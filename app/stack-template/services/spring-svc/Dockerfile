# spring-svc — multi-stage theo platform/conventions/01
# deps → build → runtime (JRE-only, non-root 1001)

# deps stage — mvnw tải dependency vào layer cache riêng
FROM eclipse-temurin:21-jdk-alpine AS deps
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -B dependency:go-offline

# build stage — codegen models chạy trong generate-sources (snapshot users.yaml)
FROM deps AS build
COPY src src
RUN ./mvnw -B package -DskipTests

# runtime stage — JRE-only, jar fat
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
USER 1001
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
