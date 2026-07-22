package com.dacarto.matrizes.repository;

import com.dacarto.matrizes.model.MatrizElemento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MatrizElementoRepository extends JpaRepository<MatrizElemento, UUID> {

    Optional<MatrizElemento> findByTagIdentificacao(String tagIdentificacao);

    boolean existsByTagIdentificacao(String tagIdentificacao);

    Page<MatrizElemento> findByStatusAndTipo(
        MatrizElemento.ItemStatus status,
        MatrizElemento.ItemTipo tipo,
        Pageable pageable
    );

    Page<MatrizElemento> findByStatus(MatrizElemento.ItemStatus status, Pageable pageable);

    Page<MatrizElemento> findByTipo(MatrizElemento.ItemTipo tipo, Pageable pageable);

    // Todos os itens não-desativados, sem paginação (para dropdowns)
    @Query("SELECT m FROM MatrizElemento m WHERE m.status != com.dacarto.matrizes.model.MatrizElemento.ItemStatus.DESATIVADO ORDER BY m.tagIdentificacao ASC")
    List<MatrizElemento> findAllAtivos();

    // Itens com estoque abaixo do mínimo
    @Query("SELECT m FROM MatrizElemento m WHERE m.quantidadeEstoque < m.estoqueMinimo AND m.status != 'DESATIVADO'")
    List<MatrizElemento> findAbaixoEstoqueMinimo();

    // Busca textual por tag, nome ou modelo
    @Query("""
        SELECT m FROM MatrizElemento m
        WHERE LOWER(m.tagIdentificacao) LIKE LOWER(CONCAT('%', :termo, '%'))
           OR LOWER(m.nome)            LIKE LOWER(CONCAT('%', :termo, '%'))
           OR LOWER(m.modelo)          LIKE LOWER(CONCAT('%', :termo, '%'))
        """)
    Page<MatrizElemento> buscarPorTermo(@Param("termo") String termo, Pageable pageable);

    // KPIs do dashboard
    long countByStatus(MatrizElemento.ItemStatus status);
    long countByTipo(MatrizElemento.ItemTipo tipo);
    long countByStatusAndTipo(MatrizElemento.ItemStatus status, MatrizElemento.ItemTipo tipo);

    @Query("SELECT COALESCE(SUM(m.quantidadeEstoque), 0) FROM MatrizElemento m WHERE m.tipo = :tipo")
    Long sumEstoqueByTipo(@Param("tipo") MatrizElemento.ItemTipo tipo);

    @Query("SELECT COALESCE(SUM(m.quantidadeEstoque), 0) FROM MatrizElemento m")
    Long sumEstoqueTotal();

    @Query("SELECT COALESCE(SUM(m.custoUnitario * m.quantidadeEstoque), 0) FROM MatrizElemento m WHERE m.status != 'DESATIVADO'")
    java.math.BigDecimal calcularValorTotalInventario();
}
