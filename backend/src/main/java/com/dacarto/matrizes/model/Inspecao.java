package com.dacarto.matrizes.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "inspecoes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Inspecao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matriz_elemento_id", nullable = false)
    private MatrizElemento matrizElemento;

    @Convert(converter = com.dacarto.matrizes.model.converters.InspecaoTipoConverter.class)
    @Column(name = "tipo_inspecao", nullable = false)
    private InspecaoTipo tipoInspecao;

    @Column(name = "data_inspecao", nullable = false)
    @Builder.Default
    private OffsetDateTime dataInspecao = OffsetDateTime.now();

    @Column(nullable = false, length = 150)
    private String inspetor;

    @Convert(converter = com.dacarto.matrizes.model.converters.InspecaoResultadoConverter.class)
    @Column(nullable = false)
    private InspecaoResultado resultado;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "parametros_avaliados", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> parametrosAvaliados = new HashMap<>();

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "imagem_avif", columnDefinition = "TEXT")
    private String imagemAvif;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public enum InspecaoTipo {
        Inicial("Inicial"),
        Periodica("Periódica"),
        PosReparo("Pós-Reparo");

        private final String label;
        InspecaoTipo(String label) { this.label = label; }
        public String getLabel() { return label; }
    }

    public enum InspecaoResultado {
        Aprovado("Aprovado"),
        Reprovado("Reprovado"),
        RequereReparo("Requer Reparo");

        private final String label;
        InspecaoResultado(String label) { this.label = label; }
        public String getLabel() { return label; }
    }
}
