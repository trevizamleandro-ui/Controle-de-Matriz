package com.dacarto.matrizes.controller;

import com.dacarto.matrizes.model.Reparo;
import com.dacarto.matrizes.service.ReparoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reparos")
@RequiredArgsConstructor

public class ReparoController {

    private final ReparoService service;

    @GetMapping
    public ResponseEntity<Page<Reparo>> listar(
            @RequestParam(required = false) String busca,
            @RequestParam(required = false) UUID fornecedorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy) {
        
        return ResponseEntity.ok(service.listar(busca, fornecedorId, page, size, sortBy));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Reparo> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Reparo> criar(@RequestBody Reparo reparo) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(reparo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Reparo> atualizar(@PathVariable UUID id, @RequestBody Reparo reparo) {
        return ResponseEntity.ok(service.atualizar(id, reparo));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
