package com.dacarto.matrizes.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class DatabaseFixer implements CommandLineRunner {
    private final JdbcTemplate jdbcTemplate;

    public DatabaseFixer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        log.info("Running database fixer to uppercase enum values...");
        try {
            // Log user roles before fixing
            try {
                log.info("Existing user roles: {}", jdbcTemplate.queryForList("SELECT DISTINCT role FROM usuarios"));
            } catch (Exception ex) {
                log.warn("Could not log user roles: {}", ex.getMessage());
            }

            jdbcTemplate.execute("UPDATE usuarios SET role = 'ADMIN' WHERE role = 'Admin' OR role = 'admin'");
            jdbcTemplate.execute("UPDATE usuarios SET role = 'MANUTENCAO' WHERE role = 'Manutencao' OR role = 'manutencao' OR role = 'MANUTENÇÃO' OR role = 'Manutenção' OR role = 'manutenção'");

            jdbcTemplate.execute("UPDATE reparos SET status_reparo = 'RETORNADO' WHERE status_reparo = 'Retornado'");
            jdbcTemplate.execute("UPDATE reparos SET status_reparo = 'EM_REPARO' WHERE status_reparo = 'Em Reparo'");
            jdbcTemplate.execute("UPDATE reparos SET status_reparo = 'APROVADO_POS_REPARO' WHERE status_reparo = 'Aprovado Pós-Reparo'");
            jdbcTemplate.execute("UPDATE reparos SET status_reparo = 'REPROVADO_POS_REPARO' WHERE status_reparo = 'Reprovado Pós-Reparo'");
            jdbcTemplate.execute("UPDATE reparos SET status_reparo = 'ENVIADO' WHERE status_reparo = 'Enviado'");
            
            jdbcTemplate.execute("UPDATE matrizes_elementos SET status = 'EM_ESTOQUE' WHERE status = 'Em Estoque'");
            jdbcTemplate.execute("UPDATE matrizes_elementos SET status = 'EM_USO' WHERE status = 'Em Uso'");
            jdbcTemplate.execute("UPDATE matrizes_elementos SET status = 'EM_REPARO' WHERE status = 'Em Reparo'");
            jdbcTemplate.execute("UPDATE matrizes_elementos SET status = 'DESATIVADO' WHERE status = 'Desativado'");

            // Add columns to matrizes_elementos if they don't exist
            addColumnIfNotExists("altura_original", "double precision");
            addColumnIfNotExists("altura_atual", "double precision");
            addColumnIfNotExists("altura_minima", "double precision");
            addColumnIfNotExists("quantidade_retificas", "integer");
            addColumnIfNotExists("pressao", "varchar(50)");
            addColumnIfNotExists("tipo_corte", "varchar(50)");

            // Colunas de localização física (adicionadas em 2026-07)
            addColumnIfNotExistsWithDefault("quantidade_almoxarifado", "integer", "0");
            addColumnIfNotExistsWithDefault("quantidade_maquina", "integer", "0");
            addColumnIfNotExistsWithDefault("quantidade_reparo", "integer", "0");

            // Correção pontual para MTZ-001 que ficou presa em reparo
            jdbcTemplate.execute("UPDATE matrizes_elementos SET quantidade_almoxarifado = quantidade_almoxarifado + quantidade_reparo, quantidade_reparo = 0 WHERE tag_identificacao = 'MTZ-001' AND quantidade_reparo > 0");

            log.info("Database fixer completed successfully.");
        } catch (Exception e) {
            log.error("Failed to run database fixer: ", e);
        }
    }

    private void addColumnIfNotExists(String columnName, String columnType) {
        try {
            jdbcTemplate.execute("ALTER TABLE matrizes_elementos ADD COLUMN IF NOT EXISTS " + columnName + " " + columnType);
            log.info("Column {} checked/added successfully.", columnName);
        } catch (Exception ex) {
            log.warn("Could not check/add column {}: {}", columnName, ex.getMessage());
        }
    }

    private void addColumnIfNotExistsWithDefault(String columnName, String columnType, String defaultValue) {
        try {
            jdbcTemplate.execute(
                "ALTER TABLE matrizes_elementos ADD COLUMN IF NOT EXISTS " + columnName + " " + columnType + " NOT NULL DEFAULT " + defaultValue
            );
            log.info("Column {} checked/added with default {} successfully.", columnName, defaultValue);
        } catch (Exception ex) {
            log.warn("Could not check/add column {} with default: {}", columnName, ex.getMessage());
        }
    }
}
