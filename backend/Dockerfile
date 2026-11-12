# Stage 1: Build application using Maven
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy Maven wrapper and pom.xml first for efficient dependency caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B

# Copy source and build jar
COPY src/ src/
RUN ./mvnw clean package -DskipTests

# Stage 2: Minimal runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root system user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy executable jar from builder stage
COPY --from=builder /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -XX:+UseSerialGC -Xss512k -XX:TieredStopAtLevel=1 -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
