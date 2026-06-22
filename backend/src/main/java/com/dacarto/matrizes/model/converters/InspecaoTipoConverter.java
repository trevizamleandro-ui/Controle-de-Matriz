package com.dacarto.matrizes.model.converters;

import com.dacarto.matrizes.model.Inspecao.InspecaoTipo;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class InspecaoTipoConverter implements AttributeConverter<InspecaoTipo, String> {

    @Override
    public String convertToDatabaseColumn(InspecaoTipo attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getLabel();
    }

    @Override
    public InspecaoTipo convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        String normalized = dbData.trim();
        // Support encoding issues like 'Peridica' or partials
        if (normalized.equalsIgnoreCase("Peridica") || normalized.equalsIgnoreCase("Periódica") || normalized.contains("Peri")) {
            return InspecaoTipo.Periodica;
        }
        if (normalized.equalsIgnoreCase("PosReparo") || normalized.equalsIgnoreCase("Pós-Reparo") || normalized.contains("Pos") || normalized.contains("Pós")) {
            return InspecaoTipo.PosReparo;
        }
        for (InspecaoTipo tipo : InspecaoTipo.values()) {
            if (tipo.getLabel().equalsIgnoreCase(dbData) || tipo.name().equalsIgnoreCase(dbData)) {
                return tipo;
            }
        }
        throw new IllegalArgumentException("Unknown InspecaoTipo value: " + dbData);
    }
}
