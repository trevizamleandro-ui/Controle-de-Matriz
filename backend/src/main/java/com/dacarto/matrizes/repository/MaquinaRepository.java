package com.dacarto.matrizes.repository;

import com.dacarto.matrizes.model.Maquina;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MaquinaRepository extends JpaRepository<Maquina, UUID> {
    List<Maquina> findAllByOrderByNomeMaquinaAsc();
    List<Maquina> findByAtivaTrueOrderByNomeMaquinaAsc();
    boolean existsByNomeMaquina(String nomeMaquina);
}
