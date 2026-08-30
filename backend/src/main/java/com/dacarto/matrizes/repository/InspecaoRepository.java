package com.dacarto.matrizes.repository;

import com.dacarto.matrizes.model.Inspecao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface InspecaoRepository extends JpaRepository<Inspecao, UUID>, JpaSpecificationExecutor<Inspecao> {

    void deleteAllByMatrizElementoId(UUID matrizElementoId);
}
