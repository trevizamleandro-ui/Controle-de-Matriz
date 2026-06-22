package com.dacarto.matrizes.repository;

import com.dacarto.matrizes.model.Reparo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReparoRepository extends JpaRepository<Reparo, UUID> {

    void deleteAllByMatrizElementoId(UUID matrizElementoId);

    List<Reparo> findByMatrizElementoIdOrderByDataEnvioDesc(UUID matrizElementoId);

    List<Reparo> findByStatusReparo(Reparo.ReparoStatus status);

    // Reparos atrasados: data retorno prevista no passado e ainda não retornaram
    @Query("""
        SELECT r FROM Reparo r
        WHERE r.dataRetornoPrevista < :agora
          AND r.dataRetornoReal IS NULL
          AND r.statusReparo NOT IN :statusExcluidos
        """)
    List<Reparo> findReparosAtrasados(
        @org.springframework.data.repository.query.Param("agora") OffsetDateTime agora,
        @org.springframework.data.repository.query.Param("statusExcluidos") List<Reparo.ReparoStatus> statusExcluidos
    );

    long countByStatusReparo(Reparo.ReparoStatus status);

    @Query("SELECT r FROM Reparo r WHERE " +
           "(:busca IS NULL OR :busca = '' OR LOWER(r.descricaoProblema) LIKE LOWER(CONCAT('%', :busca, '%')) OR LOWER(r.matrizElemento.tagIdentificacao) LIKE LOWER(CONCAT('%', :busca, '%'))) " +
           "AND (:fornecedorId IS NULL OR r.fornecedor.id = :fornecedorId)")
    org.springframework.data.domain.Page<Reparo> buscarComFiltros(
            @org.springframework.data.repository.query.Param("busca") String busca,
            @org.springframework.data.repository.query.Param("fornecedorId") UUID fornecedorId,
            org.springframework.data.domain.Pageable pageable
    );

    boolean existsByFornecedorId(UUID fornecedorId);
}
