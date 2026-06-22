package com.dacarto.matrizes.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converte o campo status_reparo entre String (banco) e ReparoStatus (Java).
 * Normaliza para UPPER_CASE ao ler, aceitando valores como "Retornado" ou "RETORNADO".
 */
@Converter
public class ReparoStatusConverter implements AttributeConverter<Reparo.ReparoStatus, String> {

    @Override
    public String convertToDatabaseColumn(Reparo.ReparoStatus attribute) {
        if (attribute == null) return null;
        return attribute.name(); // sempre grava em UPPER_CASE
    }

    @Override
    public Reparo.ReparoStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return null;
        try {
            return Reparo.ReparoStatus.valueOf(dbData.toUpperCase().replace(" ", "_").replace("-", "_"));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                "Valor inválido na coluna status_reparo: '" + dbData + "'. " +
                "Valores aceitos: ENVIADO, EM_REPARO, RETORNADO, APROVADO_POS_REPARO, REPROVADO_POS_REPARO"
            );
        }
    }
}
