package com.dacarto.matrizes.model.converters;

import com.dacarto.matrizes.model.Inspecao.InspecaoResultado;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class InspecaoResultadoConverter implements AttributeConverter<InspecaoResultado, String> {

    @Override
    public String convertToDatabaseColumn(InspecaoResultado attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getLabel();
    }

    @Override
    public InspecaoResultado convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        String normalized = dbData.trim();
        if (normalized.equalsIgnoreCase("Requer Reparo") || normalized.equalsIgnoreCase("RequereReparo") || normalized.contains("Reparo")) {
            return InspecaoResultado.RequereReparo;
        }
        for (InspecaoResultado res : InspecaoResultado.values()) {
            if (res.getLabel().equalsIgnoreCase(dbData) || res.name().equalsIgnoreCase(dbData)) {
                return res;
            }
        }
        throw new IllegalArgumentException("Unknown InspecaoResultado value: " + dbData);
    }
}
