namespace DotnetSvc;

/// <summary>
/// Notification input validation — rules match contracts/openapi/dotnet.yaml
/// (NotificationInput: title required 1..200, optional body ≤ 5000).
/// Errors → 400 VALIDATION_ERROR, details = { fields: [...] } (conventions/04).
/// </summary>
public static class NotificationValidator
{
    public const int TitleMaxLength = 200;
    public const int BodyMaxLength = 5000;

    /// <summary>Returns the invalid field names (empty = valid).</summary>
    public static List<string> Validate(string? title, string? body)
    {
        var fields = new List<string>();
        if (string.IsNullOrWhiteSpace(title)) fields.Add("title");
        else if (title.Length > TitleMaxLength) fields.Add("title");
        if (body is not null && body.Length > BodyMaxLength) fields.Add("body");
        return fields;
    }
}
