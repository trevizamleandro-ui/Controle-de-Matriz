package com.dacarto.matrizes.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "reparos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Reparo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matriz_elemento_id", nullable = false)
    private MatrizElemento matrizElemento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fornecedor_id", nullable = false)
    private Fornecedor fornecedor;

    @Column(name = "data_envio", nullable = false)
    @Builder.Default
    private OffsetDateTime dataEnvio = OffsetDateTime.now();

    @Column(name = "data_retorno_prevista")
    private OffsetDateTime dataRetornoPrevista;

    @Column(name = "data_retorno_real")
    private OffsetDateTime dataRetornoReal;

    @Column(name = "custo_reparo", precision = 15, scale = 2)
    private BigDecimal custoReparo;

    @Column(name = "descricao_problema", nullable = false, columnDefinition = "TEXT")
    private String descricaoProblema;

    @Column(name = "descricao_reparo_realizado", columnDefinition = "TEXT")
    private String descricaoReparoRealizado;

    @Convert(converter = ReparoStatusConverter.class)
    @Column(name = "status_reparo", nullable = false)
    @Builder.Default
    private ReparoStatus statusReparo = ReparoStatus.ENVIADO;

    @Column(name = "numero_nf_envio", length = 50)
    private String numeroNfEnvio;

    @Column(name = "numero_nf_retorno", length = 50)
    private String numeroNfRetorno;

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

    public boolean estaAtrasado() {
        return dataRetornoPrevista != null
            && dataRetornoReal == null
            && OffsetDateTime.now().isAfter(dataRetornoPrevista);
    }

    public enum ReparoStatus {
        ENVIADO("Enviado"),
        EM_REPARO("Em Reparo"),
        RETORNADO("Retornado"),
        APROVADO_POS_REPARO("Aprovado Pós-Reparo"),
        REPROVADO_POS_REPARO("Reprovado Pós-Reparo");

        private final String label;
        ReparoStatus(String label) { this.label = label; }
        
        public String getLabel() { return label; }
    }
}
