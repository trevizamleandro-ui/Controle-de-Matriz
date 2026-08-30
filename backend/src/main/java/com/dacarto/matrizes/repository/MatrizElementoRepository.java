package com.dacarto.matrizes.repository;

import com.dacarto.matrizes.model.MatrizElemento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
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
    @Query("SELECT m FROM MatrizElemento m WHERE m.quantidadeEstoque < m.estoqueMinimo AND m.status != com.dacarto.matrizes.model.MatrizElemento.ItemStatus.DESATIVADO")
    List<MatrizElemento> findAbaixoEstoqueMinimo();

    // Busca textual por tag, nome ou modelo
    @Query("""
        SELECT m FROM MatrizElemento m
        WHERE LOWER(m.tagIdentificacao) LIKE LOWER(CONCAT('%', :termo, '%'))
           OR LOWER(m.nome)            LIKE LOWER(CONCAT('%', :termo, '%'))
           OR LOWER(m.modelo)          LIKE LOWER(CONCAT('%', :termo, '%'))
        """)
    Page<MatrizElemento> buscarPorTermo(@Param("termo") String termo, Pageable pageable);

    // ---- KPIs consolidados — queries nativas SQL para máxima compatibilidade ----

    // Retorna: [status_name (String), tipo_name (String), count (Long)]
    // Usa SQL nativo para evitar problemas com CAST de enum no Hibernate 6 + PostgreSQL
    @Query(value = """
        SELECT status, tipo, COUNT(*) as cnt
        FROM matrizes_elementos
        GROUP BY status, tipo
        """, nativeQuery = true)
    List<Object[]> contarPorStatusETipo();

    // Somas de estoque por tipo — uma única query SQL nativa com CASE
    @Query(value = """
        SELECT
            COALESCE(SUM(CASE WHEN tipo = 'Matriz'   THEN quantidade_estoque ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN tipo = 'Elemento' THEN quantidade_estoque ELSE 0 END), 0),
            COALESCE(SUM(quantidade_estoque), 0)
        FROM matrizes_elementos
        """, nativeQuery = true)
    List<Object[]> sumEstoquePorTipo();

    @Query(value = "SELECT COALESCE(SUM(custo_unitario * quantidade_estoque), 0) FROM matrizes_elementos WHERE status != 'DESATIVADO'", nativeQuery = true)
    BigDecimal calcularValorTotalInventario();
}
