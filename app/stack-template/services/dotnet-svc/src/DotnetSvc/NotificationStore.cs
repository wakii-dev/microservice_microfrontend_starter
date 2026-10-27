using Dapper;
using Npgsql;

namespace DotnetSvc;

/// <summary>
/// DB access for schema `notifications` (role dotnet_svc — sole owner).
/// Migration runs at boot (embedded resource mirroring the canonical DDL —
/// contracts/db/notifications-schema.sql); readyz checks the REAL TABLE
/// (conventions/02 rule 2 — never hardcode 200).
/// </summary>
public sealed class NotificationStore
{
    private readonly NpgsqlDataSource _dataSource;

    public NotificationStore(string databaseUrl) =>
        _dataSource = NpgsqlDataSource.Create(ToNpgsqlConnectionString(databaseUrl));

    /// <summary>Npgsql only accepts keyword connection strings — the shared env
    /// shape is the URL form `postgres://user:pass@host:port/db` (same as the
    /// other services' DATABASE_URL), so convert it here. Keyword-form strings
    /// pass through unchanged. Query-string params are not supported (compose
    /// URLs carry none — add here if one ever appears).</summary>
    public static string ToNpgsqlConnectionString(string databaseUrl)
    {
        if (!databaseUrl.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
            !databaseUrl.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            return databaseUrl;
        }
        var uri = new Uri(databaseUrl);
        var segments = uri.UserInfo.Split(':');
        return new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? 5432 : uri.Port,
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            Username = Uri.UnescapeDataString(segments[0]),
            Password = Uri.UnescapeDataString(segments.Length > 1 ? segments[1] : string.Empty),
        }.ConnectionString;
    }

    /// <summary>Applies migration 0001 (idempotent — IF NOT EXISTS). Called once at boot; on error → fail-fast.</summary>
    public async Task MigrateAsync(CancellationToken cancellationToken = default)
    {
        var sql = await ReadMigrationAsync(cancellationToken);
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(sql, cancellationToken: cancellationToken));
    }

    /// <summary>Does the table really exist in the schema? — the ready condition (conventions/02).</summary>
    public async Task<bool> IsReadyAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        return await connection.QuerySingleAsync<bool>(
            new CommandDefinition(
                "SELECT to_regclass('notifications.notifications') IS NOT NULL",
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<Models.Notification>> ListAsync(Guid userId, int limit, int offset, CancellationToken cancellationToken = default)
    {
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        var rows = await connection.QueryAsync<Models.Notification>(
            new CommandDefinition(
                """
                SELECT id, user_id AS "UserId", title, body, read AS "Read", created_at AS "CreatedAt"
                FROM notifications.notifications
                WHERE user_id = @userId
                ORDER BY created_at DESC
                LIMIT @limit OFFSET @offset
                """,
                new { userId, limit, offset },
                cancellationToken: cancellationToken));
        return rows.AsList();
    }

    public async Task<int> CountAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        return await connection.QuerySingleAsync<int>(
            new CommandDefinition(
                "SELECT count(*) FROM notifications.notifications WHERE user_id = @userId",
                new { userId },
                cancellationToken: cancellationToken));
    }

    public async Task<Models.Notification?> FindAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<Models.Notification>(
            new CommandDefinition(
                """
                SELECT id, user_id AS "UserId", title, body, read AS "Read", created_at AS "CreatedAt"
                FROM notifications.notifications
                WHERE id = @id AND user_id = @userId
                """,
                new { id, userId },
                cancellationToken: cancellationToken));
    }

    public async Task<Models.Notification> InsertAsync(Models.Notification notification, CancellationToken cancellationToken = default)
    {
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        return await connection.QuerySingleAsync<Models.Notification>(
            new CommandDefinition(
                """
                INSERT INTO notifications.notifications (id, user_id, title, body, read)
                VALUES (@Id, @UserId, @Title, @Body, @Read)
                RETURNING id, user_id AS "UserId", title, body, read AS "Read", created_at AS "CreatedAt"
                """,
                notification,
                cancellationToken: cancellationToken));
    }

    /// <summary>Updates only the `read` column — returns the new row, null when not owned by the user (→ 404).</summary>
    public async Task<Models.Notification?> UpdateReadAsync(Guid id, Guid userId, bool read, CancellationToken cancellationToken = default)
    {
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<Models.Notification>(
            new CommandDefinition(
                """
                UPDATE notifications.notifications
                SET read = @read
                WHERE id = @id AND user_id = @userId
                RETURNING id, user_id AS "UserId", title, body, read AS "Read", created_at AS "CreatedAt"
                """,
                new { id, userId, read },
                cancellationToken: cancellationToken));
    }

    /// <summary>Deletes — false when missing or not owned by the user (→ 404).</summary>
    public async Task<bool> DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        var affected = await connection.ExecuteAsync(
            new CommandDefinition(
                "DELETE FROM notifications.notifications WHERE id = @id AND user_id = @userId",
                new { id, userId },
                cancellationToken: cancellationToken));
        return affected > 0;
    }

    private static async Task<string> ReadMigrationAsync(CancellationToken cancellationToken)
    {
        const string resourceName = "DotnetSvc.Migrations.0001_init.sql";
        var assembly = typeof(NotificationStore).Assembly;
        await using var stream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"embedded resource missing: {resourceName}");
        using var reader = new StreamReader(stream);
        return await reader.ReadToEndAsync(cancellationToken);
    }
}

/// <summary>Wire DTOs / row types — camelCase via the Minimal API default serializer.</summary>
public static class Models
{
    /// <summary>1:1 with the Notification schema in contracts/openapi/dotnet.yaml.
    /// CreatedAt = DateTime UTC (Npgsql reads timestamptz → DateTime; Dapper does
    /// not convert DateTime→DateTimeOffset) — the JSON serializer still emits ISO 8601 date-time.</summary>
    public sealed record Notification(Guid Id, Guid UserId, string Title, string? Body, bool Read, DateTime CreatedAt);

    public sealed record NotificationList(IReadOnlyList<Notification> Items, int Total);
}
