# syntax=docker/dockerfile:1

FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q -DskipTests clean package

FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
RUN addgroup -S youdemy && adduser -S youdemy -G youdemy
COPY --from=build /workspace/target/youdemy-backend-1.0.0.jar app.jar
RUN chown -R youdemy:youdemy /app
USER youdemy
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
