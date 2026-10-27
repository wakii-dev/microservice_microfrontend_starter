using System.Text.Json;
using DotnetSvc;
using Xunit;

namespace DotnetSvc.Tests;

// Error envelope — shape MUST match platform/conventions/04 + the FE
// decodeErrorEnvelope (app/shared): {"error":{code,message,requestId,details}}.
public class EnvelopeTests
{
    private static JsonElement Serialized(object payload)
    {
        var json = JsonSerializer.Serialize(payload);
        return JsonDocument.Parse(json).RootElement;
    }

    [Fact]
    public void Error_has_exactly_code_message_requestId_details()
    {
        var element = Serialized(Envelope.Error("NOT_FOUND", "notification X not found", "req-1", null));

        var error = element.GetProperty("error");
        Assert.Equal("NOT_FOUND", error.GetProperty("code").GetString());
        Assert.Equal("notification X not found", error.GetProperty("message").GetString());
        Assert.Equal("req-1", error.GetProperty("requestId").GetString());
        Assert.True(error.TryGetProperty("details", out _));
    }

    [Fact]
    public void Error_requestId_null_is_serialized_as_null_not_dropped()
    {
        var element = Serialized(Envelope.Error("INTERNAL", "internal server error", null, null));
        Assert.Equal(JsonValueKind.Null, element.GetProperty("error").GetProperty("requestId").ValueKind);
    }

    [Fact]
    public void AppError_maps_status_and_code_per_conventions_04_catalog()
    {
        Assert.Equal(400, AppError.Validation(new { fields = new[] { "title" } }).Status);
        Assert.Equal("VALIDATION_ERROR", AppError.Validation(null).Code);
        Assert.Equal(404, AppError.NotFound("not found").Status);
        Assert.Equal("NOT_FOUND", AppError.NotFound("not found").Code);
        Assert.Equal(503, AppError.DependencyDown("database not reachable").Status);
        Assert.Equal("DEPENDENCY_DOWN", AppError.DependencyDown("x").Code);
    }
}

// Validator — rules match contracts/openapi/dotnet.yaml (NotificationInput).
public class NotificationValidatorTests
{
    [Fact]
    public void Title_null_empty_or_blank_is_invalid()
    {
        Assert.Contains("title", NotificationValidator.Validate(null, null));
        Assert.Contains("title", NotificationValidator.Validate("", null));
        Assert.Contains("title", NotificationValidator.Validate("   ", null));
    }

    [Fact]
    public void Title_over_200_chars_is_invalid()
    {
        Assert.Contains("title", NotificationValidator.Validate(new string('x', NotificationValidator.TitleMaxLength + 1), null));
        Assert.DoesNotContain("title", NotificationValidator.Validate(new string('x', NotificationValidator.TitleMaxLength), null));
    }

    [Fact]
    public void Body_over_5000_chars_is_invalid_body_within_limit_passes()
    {
        Assert.Contains("body", NotificationValidator.Validate("ok", new string('x', NotificationValidator.BodyMaxLength + 1)));
        Assert.Empty(NotificationValidator.Validate("ok", new string('x', NotificationValidator.BodyMaxLength)));
    }

    [Fact]
    public void Valid_input_yields_no_errors()
    {
        Assert.Empty(NotificationValidator.Validate("Meeting reminder", "optional body"));
    }
}
