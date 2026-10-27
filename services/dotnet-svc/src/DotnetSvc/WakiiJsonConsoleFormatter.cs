using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Logging.Console;

namespace DotnetSvc;

/// <summary>
/// Single-line JSON console formatter — conventions/03 shape:
/// {"ts":"2026-10-27T05:00:00.123Z","level":"info","service":"dotnet-svc",
///  "msg":"request","requestId":"…","method":"GET","path":"…","status":200,"durationMs":3}
/// ts/level/service/msg mandatory; the rest come from the log scope (request logger).
/// Unhandled exception: level error + stack in the err field (rule 2).
/// </summary>
public sealed class WakiiJsonConsoleFormatter : ConsoleFormatter
{
    public const string FormatterName = "wakii-json";
    public const string ServiceName = "dotnet-svc";

    public WakiiJsonConsoleFormatter() : base(FormatterName) { }

    public override void Write<TState>(
        in LogEntry<TState> logEntry,
        IExternalScopeProvider? scopeProvider,
        TextWriter textWriter)
    {
        var message = logEntry.Formatter?.Invoke(logEntry.State, logEntry.Exception)
                      ?? logEntry.State?.ToString()
                      ?? string.Empty;

        var sw = new StringWriter();
        sw.Write("{\"ts\":\"");
        sw.Write(DateTimeOffset.UtcNow.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'"));
        sw.Write("\",\"level\":\"");
        sw.Write(MapLevel(logEntry.LogLevel));
        sw.Write("\",\"service\":\"");
        sw.Write(ServiceName);
        sw.Write("\",\"msg\":");
        sw.Write(JsonSerializer.Serialize(message));
        if (logEntry.Exception is not null)
        {
            sw.Write(",\"err\":");
            sw.Write(JsonSerializer.Serialize(logEntry.Exception.ToString()));
        }
        scopeProvider?.ForEachScope(WriteScopeEntry, sw);
        sw.Write("}\n");
        textWriter.Write(sw.ToString());
    }

    private static void WriteScopeEntry(object? scope, TextWriter sw)
    {
        foreach (var (key, value) in AsPairs(scope))
        {
            sw.Write(',');
            sw.Write(JsonSerializer.Serialize(key));
            sw.Write(':');
            sw.Write(value is null ? "null" : JsonSerializer.Serialize(value));
        }
    }

    private static IEnumerable<KeyValuePair<string, object?>> AsPairs(object? scope)
    {
        switch (scope)
        {
            case IEnumerable<KeyValuePair<string, object?>> list:
                foreach (var kv in list) yield return kv;
                break;
            case KeyValuePair<string, object?> single:
                yield return single;
                break;
            default:
                yield return new KeyValuePair<string, object?>("scope", scope?.ToString());
                break;
        }
    }

    /// <summary>Map LogLevel → the 4 levels of conventions/03 (debug|info|warn|error).</summary>
    public static string MapLevel(LogLevel level) => level switch
    {
        LogLevel.Trace or LogLevel.Debug => "debug",
        LogLevel.Information => "info",
        LogLevel.Warning => "warn",
        _ => "error",
    };
}
