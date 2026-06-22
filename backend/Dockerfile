# Estágio de Build (Maven + Java 21)
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copiar POM e dependências (cache)
COPY pom.xml .
# Baixar dependências offline para acelerar builds subsequentes
RUN mvn dependency:go-offline -B

# Copiar código-fonte e compilar
COPY src ./src
RUN mvn clean package -DskipTests

# Estágio de Execução (JRE 21)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copiar o JAR compilado do estágio anterior
COPY --from=build /app/target/matrizes-api-1.0.0-SNAPSHOT.jar app.jar

# Expor a porta definida no application.yml (ou porta dinâmica do Render)
EXPOSE 8080

# Iniciar aplicação Spring Boot usando perfil de produção
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
