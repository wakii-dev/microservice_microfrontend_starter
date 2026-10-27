namespace DotnetSvc;

/// <summary>
/// Shared error envelope — mirror of platform/conventions/04-error-envelope.md +
/// components.schemas.Error in contracts/openapi/*.yaml (the FE decodes it via
/// decodeErrorEnvelope in app/shared — never parse the raw message).
/// </summary>
public static class Envelope
{
    // Minimum code catalog (conventions/04)
    public const string CodeValidation = "VALIDATION_ERROR";
    public const string CodeUnauthorized = "UNAUTHORIZED";
    public const string CodeNotFound = "NOT_FOUND";
    public const string CodeConflict = "CONFLICT";
    public const string CodeUnprocessable = "UNPROCESSABLE";
    public const string CodeDependencyDown = "DEPENDENCY_DOWN";
    public const string CodeInternal = "INTERNAL";

    public static object Error(string code, string message, string? requestId, object? details) =>
        new { error = new { code, message, requestId, details } };
}

/// <summary>
/// Business error carrying status + envelope code — the handler maps it to the
/// standard response. Any non-AppError → 500 INTERNAL (stack never leaks to the
/// client — it stays in server-side logs, conventions/03 rule 2).
/// </summary>
public sealed class AppError : Exception
{
    public int Status { get; }
    public string Code { get; }
    public object? Details { get; }

    public AppError(int status, string code, string message, object? details = null) : base(message)
    {
        Status = status;
        Code = code;
        Details = details;
    }

    public static AppError Validation(object? details) =>
        new(StatusCodes.Status400BadRequest, Envelope.CodeValidation, "invalid payload", details);

    public static AppError NotFound(string message) =>
        new(StatusCodes.Status404NotFound, Envelope.CodeNotFound, message);

    public static AppError DependencyDown(string message) =>
        new(StatusCodes.Status503ServiceUnavailable, Envelope.CodeDependencyDown, message);
}
