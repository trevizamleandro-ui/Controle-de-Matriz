package com.dacarto.matrizes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RelatorioItemDTO {
    private UUID id;
    private String tagIdentificacao;
    private String nome;
    private String tipo;
    private String maquinaAtual;
    private Integer quantidadeEstoque;
    private Boolean emReparo;
    private String fornecedorReparo;
    private BigDecimal custoTotalReparos;
}
