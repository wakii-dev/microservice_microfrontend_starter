# dotnet-svc — multi-stage (platform/conventions/01).
# Intentional deviation (mirrors go-svc README): dev machines have NO .NET SDK —
# every build/test runs through Docker; xunit runs inside the build stage (CI gate).

# deps stage — restore in its own layer (COPY csproj first, source later — cache rule 5)
FROM mcr.microsoft.com/dotnet/sdk:8.0-bookworm-slim AS deps
WORKDIR /src
COPY src/DotnetSvc/DotnetSvc.csproj src/DotnetSvc/
COPY tests/DotnetSvc.Tests/DotnetSvc.Tests.csproj tests/DotnetSvc.Tests/
RUN dotnet restore tests/DotnetSvc.Tests/DotnetSvc.Tests.csproj

# build stage — unit test + publish
FROM deps AS build
COPY src/ src/
COPY tests/ tests/
RUN dotnet test tests/DotnetSvc.Tests/DotnetSvc.Tests.csproj -c Release --no-restore --nologo
RUN dotnet publish src/DotnetSvc/DotnetSvc.csproj -c Release -o /out --no-restore --nologo

# runtime stage — thin aspnet; wget installed for the compose /readyz healthcheck
# (conventions/01 rule 4: NO healthcheck here — single source of truth in compose)
FROM mcr.microsoft.com/dotnet/aspnet:8.0-bookworm-slim AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends wget \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /out .
# non-root (conventions/01 rule 2) — APP_UID builtin of .NET 8 images (1654)
USER $APP_UID
EXPOSE 8083
ENTRYPOINT ["dotnet", "DotnetSvc.dll"]
