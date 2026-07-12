# ✅ Day 86-87 — Dockerfile for Spring Boot backend (day4)
# Render does not natively support Java, so it needs a Docker image instead.
# This uses a two-stage build: Stage 1 compiles the jar with Maven,
# Stage 2 copies just the finished jar into a lightweight runtime image
# (keeps the final image small — the Maven/build tools don't ship in production).

# ================= STAGE 1: BUILD =================
FROM eclipse-temurin:21-jdk-jammy AS build

WORKDIR /app

# Copy Maven wrapper and pom.xml first (Docker layer caching —
# dependencies only re-download if pom.xml actually changes)
COPY .mvn .mvn
COPY mvnw mvnw
COPY pom.xml pom.xml

RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B

# Now copy the rest of the source and build
COPY src src
RUN ./mvnw clean package -DskipTests

# ================= STAGE 2: RUNTIME =================
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Copy ONLY the built jar from the build stage — nothing else
COPY --from=build /app/target/*.jar app.jar

# Render sets the PORT environment variable itself at runtime (commonly
# 10000) — we do NOT hardcode it here. application.properties reads it via
# server.port=${PORT:8080}, so whatever value Render injects is honored
# automatically. EXPOSE below is just documentation for Docker; Render
# doesn't rely on it to determine the actual port.
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]