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

    // ---- KPIs consolidados ----
    // UMA única query retorna contagens agrupadas por (status, tipo)
    // Retorna Object[] com [status (String), tipo (String), count (Long)]
    @Query("""
        SELECT CAST(m.status AS string), CAST(m.tipo AS string), COUNT(m)
        FROM MatrizElemento m
        GROUP BY m.status, m.tipo
        """)
    List<Object[]> contarPorStatusETipo();

    // Soma de estoque total/por tipo — UMA query com CASE ao invés de N queries
    @Query("""
        SELECT
            COALESCE(SUM(CASE WHEN m.tipo = com.dacarto.matrizes.model.MatrizElemento.ItemTipo.Matriz   THEN m.quantidadeEstoque ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN m.tipo = com.dacarto.matrizes.model.MatrizElemento.ItemTipo.Elemento THEN m.quantidadeEstoque ELSE 0 END), 0),
            COALESCE(SUM(m.quantidadeEstoque), 0)
        FROM MatrizElemento m
        """)
    Object[] sumEstoquePorTipo();

    @Query("SELECT COALESCE(SUM(m.custoUnitario * m.quantidadeEstoque), 0) FROM MatrizElemento m WHERE m.status != 'DESATIVADO'")
    java.math.BigDecimal calcularValorTotalInventario();
}
