package com.dacarto.matrizes.repository;

import com.dacarto.matrizes.model.Inspecao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface InspecaoRepository extends JpaRepository<Inspecao, UUID> {

    void deleteAllByMatrizElementoId(UUID matrizElementoId);

    @Query("SELECT i FROM Inspecao i WHERE " +
           "(:busca IS NULL OR :busca = '' OR LOWER(i.inspetor) LIKE LOWER(CONCAT('%', :busca, '%')) OR LOWER(i.matrizElemento.tagIdentificacao) LIKE LOWER(CONCAT('%', :busca, '%'))) " +
           "AND (:tipo IS NULL OR i.tipoInspecao = :tipo) " +
           "AND (:resultado IS NULL OR i.resultado = :resultado)")
    Page<Inspecao> buscarComFiltros(
            @Param("busca") String busca,
            @Param("tipo") Inspecao.InspecaoTipo tipo,
            @Param("resultado") Inspecao.InspecaoResultado resultado,
            Pageable pageable
    );
}
