package com.dacarto.matrizes.repository;

import com.dacarto.matrizes.model.Inspecao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.lang.Nullable;

import java.util.UUID;

public interface InspecaoRepository extends JpaRepository<Inspecao, UUID>, JpaSpecificationExecutor<Inspecao> {

    @Override
    @EntityGraph(attributePaths = {"matrizElemento"})
    Page<Inspecao> findAll(@Nullable Specification<Inspecao> spec, Pageable pageable);

    void deleteAllByMatrizElementoId(UUID matrizElementoId);
}
