package com.dacarto.matrizes.controller;

import com.dacarto.matrizes.model.Inspecao;
import com.dacarto.matrizes.service.InspecaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inspecoes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Para simplificar dev
public class InspecaoController {

    private final InspecaoService service;

    @GetMapping
    public ResponseEntity<Page<Inspecao>> listar(
            @RequestParam(required = false) String busca,
            @RequestParam(required = false) Inspecao.InspecaoTipo tipo,
            @RequestParam(required = false) Inspecao.InspecaoResultado resultado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy) {
        
        return ResponseEntity.ok(service.listar(busca, tipo, resultado, page, size, sortBy));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Inspecao> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Inspecao> criar(@RequestBody Inspecao inspecao) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(inspecao));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Inspecao> atualizar(@PathVariable UUID id, @RequestBody Inspecao inspecao) {
        return ResponseEntity.ok(service.atualizar(id, inspecao));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
