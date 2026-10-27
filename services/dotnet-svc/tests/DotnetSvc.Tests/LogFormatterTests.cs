using System.Text.Json;
using System.Text.RegularExpressions;
using DotnetSvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace DotnetSvc.Tests;

// Log shape conventions/03: single-line JSON {ts, level, service, msg, + scope fields}.
public class WakiiJsonConsoleFormatterTests
{
    /// <summary>Fake scope provider — the public ExternalScopeProvider class is
    /// named LoggerExternalScopeProvider and lives in Microsoft.Extensions.Logging;
    /// the formatter only needs ForEachScope, so a one-scope fake is simpler.</summary>
    private sealed class SingleScopeProvider(object? scope) : IExternalScopeProvider
    {
        public void ForEachScope<TState>(Action<object?, TState> callback, TState state)
        {
            if (scope is not null) callback(scope, state);
        }

        public IDisposable Push(object? state) => throw new NotSupportedException();
    }

    private static string Render(LogLevel level, string message, Exception? exception, IExternalScopeProvider? scopes)
    {
        var formatter = new WakiiJsonConsoleFormatter();
        var output = new StringWriter();
        var entry = new LogEntry<string>(level, "DotnetSvc.Program", new EventId(1), "state", exception, (_, _) => message);
        formatter.Write(in entry, scopes, output);
        return output.ToString();
    }

    [Fact]
    public void Info_log_has_ts_level_service_msg_and_scope_fields()
    {
        var scopes = new SingleScopeProvider(new Dictionary<string, object?>
        {
            ["requestId"] = "req-42",
            ["method"] = "GET",
            ["path"] = "/api/dotnet/notifications",
            ["status"] = 200,
            ["durationMs"] = 3,
        });
        var line = Render(LogLevel.Information, "request", null, scopes);
        var json = JsonDocument.Parse(line).RootElement;

        Assert.Matches(@"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$", json.GetProperty("ts").GetString());
        Assert.Equal("info", json.GetProperty("level").GetString());
        Assert.Equal("dotnet-svc", json.GetProperty("service").GetString());
        Assert.Equal("request", json.GetProperty("msg").GetString());
        Assert.Equal("req-42", json.GetProperty("requestId").GetString());
        Assert.Equal(200, json.GetProperty("status").GetInt32());
        // single line only (12-factor — compose/CI collect)
        Assert.Equal(2, line.Split('\n').Length); // JSON + \n
    }

    [Fact]
    public void Error_log_puts_stack_in_err_field_without_breaking_json()
    {
        var line = Render(LogLevel.Error, "unhandled error", new InvalidOperationException("boom \"quote\""), null);
        var json = JsonDocument.Parse(line).RootElement;
        Assert.Equal("error", json.GetProperty("level").GetString());
        Assert.Contains("boom \"quote\"", json.GetProperty("err").GetString());
    }

    [Fact]
    public void MapLevel_maps_to_the_4_levels_of_conventions_03()
    {
        Assert.Equal("debug", WakiiJsonConsoleFormatter.MapLevel(LogLevel.Trace));
        Assert.Equal("debug", WakiiJsonConsoleFormatter.MapLevel(LogLevel.Debug));
        Assert.Equal("info", WakiiJsonConsoleFormatter.MapLevel(LogLevel.Information));
        Assert.Equal("warn", WakiiJsonConsoleFormatter.MapLevel(LogLevel.Warning));
        Assert.Equal("error", WakiiJsonConsoleFormatter.MapLevel(LogLevel.Error));
        Assert.Equal("error", WakiiJsonConsoleFormatter.MapLevel(LogLevel.Critical));
    }
}

// Embedded migration — 1:1 mirror of the canonical DDL
// contracts/db/notifications-schema.sql (table + index portion only).
public class MigrationResourceTests
{
    [Fact]
    public void Embedded_resource_has_full_ddl_and_no_create_schema_statement()
    {
        var assembly = typeof(NotificationStore).Assembly;
        using var stream = assembly.GetManifestResourceStream("DotnetSvc.Migrations.0001_init.sql");
        Assert.NotNull(stream);
        using var reader = new StreamReader(stream);
        var sql = reader.ReadToEnd();

        Assert.Contains("CREATE TABLE IF NOT EXISTS notifications.notifications", sql);
        Assert.Contains("idx_notifications_user_id", sql);
        Assert.Contains("idx_notifications_created_at", sql);
        // APPLY CONTEXT (canonical DDL #4): the schema belongs to 01-init.sh (runs
        // as superuser) — the service role only has CREATE on the schema, so the
        // migration must NOT contain the CREATE SCHEMA statement (statement form,
        // not a bare substring — the header comment mentions the phrase).
        Assert.DoesNotContain("CREATE SCHEMA IF NOT EXISTS", sql);
        Assert.DoesNotContain("CREATE SCHEMA notifications", sql);
    }
}

// Npgsql rejects URL connection strings — the shared DATABASE_URL shape
// (postgres://user:pass@host:port/db, same as every other service) must be
// converted to keyword form. Keyword strings pass through.
public class ConnectionStringTests
{
    [Fact]
    public void Postgres_url_converts_to_keyword_form()
    {
        var keyword = NotificationStore.ToNpgsqlConnectionString("postgres://dotnet_svc:se%20cret@postgres:5432/boilerplate");
        Assert.Contains("Host=postgres", keyword);
        Assert.Contains("Port=5432", keyword);
        Assert.Contains("Database=boilerplate", keyword);
        Assert.Contains("Username=dotnet_svc", keyword);
        Assert.Contains("se cret", keyword); // URL-decoded (builder quoting style not asserted — format is Npgsql's business)
    }

    [Fact]
    public void Postgresql_scheme_and_default_port_also_handled()
    {
        var keyword = NotificationStore.ToNpgsqlConnectionString("postgresql://dotnet_svc:pw@localhost/boilerplate");
        Assert.Contains("Host=localhost", keyword);
        Assert.Contains("Port=5432", keyword);
        Assert.Contains("Database=boilerplate", keyword);
        Assert.Contains("Password=pw", keyword);
    }

    [Fact]
    public void Keyword_form_passes_through_unchanged()
    {
        const string raw = "Host=db;Username=u;Password=p";
        Assert.Equal(raw, NotificationStore.ToNpgsqlConnectionString(raw));
    }
}
