package com.dacarto.matrizes.controller;

import com.dacarto.matrizes.model.Fornecedor;
import com.dacarto.matrizes.repository.FornecedorRepository;
import com.dacarto.matrizes.repository.ReparoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/fornecedores")
@RequiredArgsConstructor

public class FornecedorController {

    private final FornecedorRepository fornecedorRepository;
    private final ReparoRepository reparoRepository;

    @GetMapping
    public ResponseEntity<List<Fornecedor>> listar() {
        return ResponseEntity.ok(fornecedorRepository.findAllByOrderByNomeAsc());
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Fornecedor fornecedor) {
        if (fornecedor.getNome() == null || fornecedor.getNome().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("O nome do fornecedor é obrigatório.");
        }

        String nome = fornecedor.getNome().trim();
        if (fornecedorRepository.existsByNome(nome)) {
            return ResponseEntity.badRequest().body("Já existe um fornecedor com este nome.");
        }

        fornecedor.setNome(nome);
        fornecedor.setContato(normalize(fornecedor.getContato()));
        fornecedor.setTelefone(normalize(fornecedor.getTelefone()));
        
        String email = normalize(fornecedor.getEmail());
        fornecedor.setEmail(email != null ? email.toLowerCase() : null);

        Fornecedor salvo = fornecedorRepository.save(fornecedor);
        return ResponseEntity.ok(salvo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable UUID id, @RequestBody Fornecedor fornecedorDetails) {
        Fornecedor fornecedor = fornecedorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Fornecedor não encontrado"));

        if (fornecedorDetails.getNome() == null || fornecedorDetails.getNome().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("O nome do fornecedor é obrigatório.");
        }

        String nomeNovo = fornecedorDetails.getNome().trim();
        if (!nomeNovo.equalsIgnoreCase(fornecedor.getNome())) {
            if (fornecedorRepository.existsByNome(nomeNovo)) {
                return ResponseEntity.badRequest().body("Já existe um fornecedor com este nome.");
            }
        }

        fornecedor.setNome(nomeNovo);
        fornecedor.setContato(normalize(fornecedorDetails.getContato()));
        fornecedor.setTelefone(normalize(fornecedorDetails.getTelefone()));
        
        String email = normalize(fornecedorDetails.getEmail());
        fornecedor.setEmail(email != null ? email.toLowerCase() : null);

        Fornecedor atualizado = fornecedorRepository.save(fornecedor);
        return ResponseEntity.ok(atualizado);
    }

    private String normalize(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable UUID id) {
        if (!fornecedorRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        if (reparoRepository.existsByFornecedorId(id)) {
            return ResponseEntity.badRequest().body("Não é possível excluir o fornecedor pois existem reparos vinculados a ele.");
        }

        fornecedorRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
