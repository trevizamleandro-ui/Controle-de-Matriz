package com.dacarto.matrizes.repository;

import com.dacarto.matrizes.model.Fornecedor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FornecedorRepository extends JpaRepository<Fornecedor, UUID> {
    List<Fornecedor> findAllByOrderByNomeAsc();
    boolean existsByNome(String nome);
}
