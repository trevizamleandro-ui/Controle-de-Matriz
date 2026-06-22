# Estágio de Build (Maven + Java 21)
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Limitar memória do Maven (Render Free Tier tem apenas 512MB RAM)
ENV MAVEN_OPTS="-Xmx256m"

# Copiar POM e dependências (cache)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar código-fonte e compilar
COPY src ./src
RUN mvn clean package -DskipTests

# Estágio de Execução (JRE 21)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/target/matrizes-api-1.0.0-SNAPSHOT.jar app.jar
EXPOSE 8080

# Limitar memória do Java em execução para caber no plano grátis
ENTRYPOINT ["java", "-Xmx300m", "-jar", "app.jar", "--spring.profiles.active=prod"]
