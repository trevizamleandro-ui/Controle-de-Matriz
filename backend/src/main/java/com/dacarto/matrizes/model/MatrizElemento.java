package com.dacarto.matrizes.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "matrizes_elementos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class MatrizElemento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tag_identificacao", nullable = false, unique = true, length = 100)
    private String tagIdentificacao;

    @Column(nullable = false, length = 200)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemTipo tipo;

    @Column(length = 150)
    private String modelo;

    @Column(length = 150)
    private String material;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "caracteristicas_tecnicas", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> caracteristicasTecnicas = new HashMap<>();

    @Column(name = "custo_unitario", precision = 15, scale = 2)
    private BigDecimal custoUnitario;

    @Column(name = "estoque_minimo", nullable = false)
    @Builder.Default
    private Integer estoqueMinimo = 1;

    @Column(name = "quantidade_estoque", nullable = false)
    @Builder.Default
    private Integer quantidadeEstoque = 0;

    @Column(name = "quantidade_almoxarifado", nullable = false)
    @Builder.Default
    private Integer quantidadeAlmoxarifado = 0;

    @Column(name = "quantidade_maquina", nullable = false)
    @Builder.Default
    private Integer quantidadeMaquina = 0;

    @Column(name = "quantidade_reparo", nullable = false)
    @Builder.Default
    private Integer quantidadeReparo = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ItemStatus status = ItemStatus.EM_ESTOQUE;

    @Column(name = "localizacao_atual", length = 200)
    private String localizacaoAtual;

    @Column(name = "numero_sap", length = 50)
    private String numeroSap;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "checklist_pontos", columnDefinition = "jsonb")
    private List<String> checklistPontos;

    @Column(name = "desenho_pdf", columnDefinition = "TEXT")
    private String desenhoPdf;

    @Column(name = "altura_original")
    private Double alturaOriginal;

    @Column(name = "altura_atual")
    private Double alturaAtual;

    @Column(name = "altura_minima")
    private Double alturaMinima;

    @Column(name = "quantidade_retificas")
    private Integer quantidadeRetificas;

    @Column(name = "pressao", length = 50)
    private String pressao;

    @Column(name = "tipo_corte", length = 50)
    private String tipoCorte;

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

    // Quantidade total = soma das 3 localizações
    // Fallback para quantidadeEstoque quando campos novos ainda não foram preenchidos (migração)
    public Integer getQuantidadeTotal() {
        int total = (quantidadeAlmoxarifado != null ? quantidadeAlmoxarifado : 0)
                  + (quantidadeMaquina     != null ? quantidadeMaquina     : 0)
                  + (quantidadeReparo      != null ? quantidadeReparo      : 0);
        if (total == 0 && quantidadeEstoque != null && quantidadeEstoque > 0) {
            return quantidadeEstoque;
        }
        return total;
    }

    // Mantém quantidadeEstoque sincronizado com o total calculado
    public void sincronizarEstoque() {
        this.quantidadeEstoque = getQuantidadeTotal();
    }

    // Inicializa campos de localização para registros legados
    public void inicializarLocalizacaoSeNecessario() {
        int total = (quantidadeAlmoxarifado != null ? quantidadeAlmoxarifado : 0)
                  + (quantidadeMaquina     != null ? quantidadeMaquina     : 0)
                  + (quantidadeReparo      != null ? quantidadeReparo      : 0);
        if (total == 0 && quantidadeEstoque != null && quantidadeEstoque > 0) {
            this.quantidadeAlmoxarifado = this.quantidadeEstoque;
        }
    }

    // Verifica se o estoque está abaixo do mínimo
    public boolean estoqueAbaixoMinimo() {
        return getQuantidadeTotal() < this.estoqueMinimo;
    }

    public enum ItemTipo {
        Matriz, Elemento
    }

    public enum ItemStatus {
        EM_USO("Em Uso"),
        EM_ESTOQUE("Em Estoque"),
        EM_REPARO("Em Reparo"),
        DESATIVADO("Desativado");

        private final String label;

        ItemStatus(String label) { this.label = label; }
        
        @com.fasterxml.jackson.annotation.JsonValue
        public String getLabel() { return label; }
    }
}
