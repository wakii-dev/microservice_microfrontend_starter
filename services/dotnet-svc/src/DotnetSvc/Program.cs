// dotnet-svc — notifications API (ASP.NET Core 8 Minimal API).
// 4th language of the boilerplate (ADR-0011); conventions: platform/conventions/.
// Standalone domain (notifications) — touches NO other service (tasks/users/activity/auth).
using System.Diagnostics;
using System.Security.Claims;
using System.Text;
using DotnetSvc;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Extensions.Logging.Console;
using Microsoft.IdentityModel.Tokens;

// ── Config 100% env-var (conventions/06) — fail fast on required vars ────────
var port = Environment.GetEnvironmentVariable("DOTNET_SVC_PORT") ?? "8083";
string databaseUrl;
string jwtSecret;
try
{
    databaseUrl = RequireEnv("DATABASE_URL");
    jwtSecret = RequireEnv("JWT_SECRET");
}
catch (InvalidOperationException ex)
{
    Console.Error.WriteLine("config error: " + ex.Message); // fail-fast (conventions/06 rule 6)
    return 1;
}
var corsOrigins = (Environment.GetEnvironmentVariable("CORS_DEV_ORIGIN") ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

const string expectedJwtIssuer = "auth-mock"; // PINNED — token-contract.md §1 (historical value, kept ON PURPOSE)

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// ── JSON log shape conventions/03 (ts/level/service/msg + scope requestId…) ──
var logLevel = (Environment.GetEnvironmentVariable("LOG_LEVEL") ?? "info").ToLowerInvariant() switch
{
    "debug" => LogLevel.Debug,
    "warn" or "warning" => LogLevel.Warning,
    "error" => LogLevel.Error,
    _ => LogLevel.Information,
};
builder.Logging.SetMinimumLevel(logLevel);
builder.Logging.AddConsole(options => options.FormatterName = WakiiJsonConsoleFormatter.FormatterName);
builder.Logging.AddConsoleFormatter<WakiiJsonConsoleFormatter, ConsoleFormatterOptions>();

// ── DB + migration at boot (service OWNS schema notifications — mirror go-svc) ──
var store = new NotificationStore(databaseUrl);
builder.Services.AddSingleton(store);

// ── CORS dev-profile (conventions/07): compose = empty CORS_DEV_ORIGIN → deny ──
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
{
    if (corsOrigins.Length > 0) policy.WithOrigins(corsOrigins);
    else policy.SetIsOriginAllowed(_ => false); // no ACAO header ever emitted
    policy.WithHeaders("Authorization", "Content-Type", "X-Request-Id");
    policy.WithMethods("GET", "POST", "PATCH", "DELETE");
}));

// ── JWT enforcement layer 2 (token-contract.md §4) — never trust gateway presence ──
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false; // keep raw claims sub/email/roles (token-contract §1)
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = expectedJwtIssuer,
            ValidateAudience = false, // token has NO aud claim (token-contract §1)
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidAlgorithms = [SecurityAlgorithms.HmacSha256], // anti alg-swap (mirror go WithValidMethods)
            ValidateLifetime = true,
            RequireExpirationTime = true, // exp mandatory
            ClockSkew = TimeSpan.Zero, // mirror go-jwt (leeway 0) — expired = 401 immediately
            NameClaimType = "sub",
        };
        options.Events = new JwtBearerEvents
        {
            // 401 in the shared error envelope shape (conventions/04) — not the bare default body
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.HttpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.HttpContext.Response.WriteAsJsonAsync(
                    Envelope.Error(
                        Envelope.CodeUnauthorized,
                        "invalid or expired token",
                        context.HttpContext.Items["RequestId"] as string,
                        null));
            },
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

try
{
    await store.MigrateAsync();
    app.Logger.LogInformation("migration schema notifications OK");
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "migration failed"); // fail-fast — readyz never hardcodes 200
    Environment.Exit(1);
}

// ── Pipeline: exception → request-id/log → cors → auth ──────────────────────
app.UseExceptionHandler(a => a.Run(async context =>
{
    var error = context.Features.Get<IExceptionHandlerFeature>()?.Error;
    int status;
    string code, message;
    object? details;
    if (error is AppError appError)
    {
        status = appError.Status;
        code = appError.Code;
        message = appError.Message;
        details = appError.Details;
    }
    else
    {
        status = StatusCodes.Status500InternalServerError;
        code = Envelope.CodeInternal;
        message = "internal server error"; // never leak the stack (conventions/04 INTERNAL)
        details = null;
        app.Logger.LogError(error, "unhandled error"); // stack stays server-side (conventions/03 rule 2)
    }
    context.Response.StatusCode = status;
    await context.Response.WriteAsJsonAsync(
        Envelope.Error(code, message, context.Items["RequestId"] as string, details));
}));

app.Use(async (context, next) =>
{
    // X-Request-Id: echo the gateway-generated one (conventions/03) or generate; mirror to response
    var requestId = context.Request.Headers["X-Request-Id"].FirstOrDefault();
    if (string.IsNullOrWhiteSpace(requestId)) requestId = Guid.NewGuid().ToString();
    context.Response.Headers["X-Request-Id"] = requestId;
    context.Items["RequestId"] = requestId;

    var start = Stopwatch.GetTimestamp();
    await next(context);
    var durationMs = (int)Stopwatch.GetElapsedTime(start).TotalMilliseconds;
    using (app.Logger.BeginScope(new Dictionary<string, object?>
    {
        ["requestId"] = requestId,
        ["method"] = context.Request.Method,
        ["path"] = context.Request.Path.Value,
        ["status"] = context.Response.StatusCode,
        ["durationMs"] = durationMs,
    }))
    {
        app.Logger.LogInformation("request");
    }
});

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// ── Health: naked path (compose/CI probe) + mirror under prefix (conventions/02 rule 6) ──
IResult Ok() => Results.Json(new { status = "ok" });

app.MapGet("/healthz", Ok);
app.MapGet("/readyz", (HttpContext context, NotificationStore storeRef) => Ready(context, storeRef));
var api = app.MapGroup("/api/dotnet");
api.MapGet("/healthz", Ok);
api.MapGet("/readyz", (HttpContext context, NotificationStore storeRef) => Ready(context, storeRef));

async Task<IResult> Ready(HttpContext context, NotificationStore storeRef)
{
    try
    {
        return await storeRef.IsReadyAsync()
            ? Ok()
            : ErrorResult(context, StatusCodes.Status503ServiceUnavailable, Envelope.CodeDependencyDown,
                "notifications.notifications is not ready (migration did not run)");
    }
    catch (Exception)
    {
        return ErrorResult(context, StatusCodes.Status503ServiceUnavailable, Envelope.CodeDependencyDown,
            "database not reachable");
    }
}

// ── Business routes — JWT required, every query scoped to the JWT sub ───────
var notifications = api.MapGroup("/notifications").RequireAuthorization();

notifications.MapGet("/", async (HttpContext context, NotificationStore storeRef, int? limit, int? offset) =>
{
    var (userId, denied) = RequireUserId(context);
    if (denied is not null) return denied;
    var take = limit is > 0 and <= 100 ? limit.Value : 20;
    var skip = offset is > 0 ? offset.Value : 0;
    var items = await storeRef.ListAsync(userId, take, skip);
    var total = await storeRef.CountAsync(userId);
    return Results.Json(new Models.NotificationList(items, total));
});

notifications.MapPost("/", async (HttpContext context, NotificationStore storeRef, CreateInput input) =>
{
    var (userId, denied) = RequireUserId(context);
    if (denied is not null) return denied;
    var title = input.Title?.Trim();
    var fields = NotificationValidator.Validate(title, input.Body);
    if (fields.Count > 0)
        return ErrorResult(context, StatusCodes.Status400BadRequest, Envelope.CodeValidation,
            "invalid payload", new { fields });
    var created = await storeRef.InsertAsync(
        new Models.Notification(Guid.NewGuid(), userId, title!, input.Body, Read: false, CreatedAt: DateTime.UtcNow));
    return Results.Created($"/api/dotnet/notifications/{created.Id}", created);
});

notifications.MapGet("/{id:guid}", async (HttpContext context, NotificationStore storeRef, Guid id) =>
{
    var (userId, denied) = RequireUserId(context);
    if (denied is not null) return denied;
    var found = await storeRef.FindAsync(id, userId);
    return found is null
        ? ErrorResult(context, StatusCodes.Status404NotFound, Envelope.CodeNotFound, $"notification {id} not found")
        : Results.Json(found);
});

notifications.MapPatch("/{id:guid}", async (HttpContext context, NotificationStore storeRef, Guid id, UpdateInput input) =>
{
    var (userId, denied) = RequireUserId(context);
    if (denied is not null) return denied;
    if (input.Read is null)
        return ErrorResult(context, StatusCodes.Status400BadRequest, Envelope.CodeValidation,
            "invalid payload", new { fields = new[] { "read" } });
    var updated = await storeRef.UpdateReadAsync(id, userId, input.Read.Value);
    return updated is null
        ? ErrorResult(context, StatusCodes.Status404NotFound, Envelope.CodeNotFound, $"notification {id} not found")
        : Results.Json(updated);
});

notifications.MapDelete("/{id:guid}", async (HttpContext context, NotificationStore storeRef, Guid id) =>
{
    var (userId, denied) = RequireUserId(context);
    if (denied is not null) return denied;
    return await storeRef.DeleteAsync(id, userId)
        ? Results.NoContent()
        : ErrorResult(context, StatusCodes.Status404NotFound, Envelope.CodeNotFound, $"notification {id} not found");
});

app.Logger.LogInformation("dotnet-svc starting {Port}", port);
await app.RunAsync();
return 0;

// ── Local helpers + wire DTOs ────────────────────────────────────────────────

static string RequireEnv(string name)
{
    var value = Environment.GetEnvironmentVariable(name);
    if (string.IsNullOrWhiteSpace(value))
        throw new InvalidOperationException($"env {name} is required (conventions/06 rule 6)");
    return value;
}

static IResult ErrorResult(HttpContext context, int status, string code, string message, object? details = null) =>
    Results.Json(Envelope.Error(code, message, context.Items["RequestId"] as string, details), statusCode: status);

/// <summary>JWT sub → Guid; missing/invalid → 401 envelope (enforcement layer 2).</summary>
static (Guid userId, IResult? denied) RequireUserId(HttpContext context)
{
    if (Guid.TryParse(context.User.FindFirstValue("sub"), out var userId)) return (userId, null);
    return (default, ErrorResult(context, StatusCodes.Status401Unauthorized, Envelope.CodeUnauthorized, "invalid or expired token"));
}

/// <summary>POST /notifications input — matches NotificationInput in dotnet.yaml.</summary>
internal sealed record CreateInput(string? Title, string? Body);

/// <summary>PATCH /notifications/{id} input — {read: bool} required (null → 400).</summary>
internal sealed record UpdateInput(bool? Read);
