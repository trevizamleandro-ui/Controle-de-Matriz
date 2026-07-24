package com.dacarto.matrizes.controller;

import com.dacarto.matrizes.model.MatrizElemento;
import com.dacarto.matrizes.service.MatrizElementoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/matrizes")
@RequiredArgsConstructor

public class MatrizElementoController {

    private final MatrizElementoService service;

    /**
     * GET /api/v1/matrizes
     * Lista com filtros opcionais: termo de busca, status, tipo
     */
    @GetMapping
    public ResponseEntity<Page<MatrizElemento>> listar(
            @RequestParam(required = false) String busca,
            @RequestParam(required = false) MatrizElemento.ItemStatus status,
            @RequestParam(required = false) MatrizElemento.ItemTipo tipo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String ordenarPor) {

        return ResponseEntity.ok(service.listar(busca, status, tipo, page, size, ordenarPor));
    }

    @GetMapping("/todos")
    public ResponseEntity<List<MatrizElemento>> listarTodos() {
        return ResponseEntity.ok(service.listarTodos());
    }

    @GetMapping("/todos-itens")
    public ResponseEntity<List<MatrizElemento>> listarTodosItens() {
        return ResponseEntity.ok(service.listarTudoSemFiltro());
    }

    @PatchMapping("/{id}/localizacao")
    public ResponseEntity<MatrizElemento> ajustarLocalizacao(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int deltaAlmoxarifado,
            @RequestParam(defaultValue = "0") int deltaMaquina) {
        return ResponseEntity.ok(service.ajustarLocalizacao(id, deltaAlmoxarifado, deltaMaquina));
    }

    /**
     * GET /api/v1/matrizes/dashboard
     * KPIs para o dashboard principal
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        return ResponseEntity.ok(service.calcularKpis());
    }

    /**
     * GET /api/v1/matrizes/alertas/estoque
     * Itens com estoque abaixo do mínimo
     */
    @GetMapping("/alertas/estoque")
    public ResponseEntity<List<MatrizElemento>> alertasEstoque() {
        return ResponseEntity.ok(service.listarAbaixoEstoqueMinimo());
    }

    /**
     * GET /api/v1/matrizes/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<MatrizElemento> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    /**
     * GET /api/v1/matrizes/tag/{tag}
     */
    @GetMapping("/tag/{tag}")
    public ResponseEntity<MatrizElemento> buscarPorTag(@PathVariable String tag) {
        return ResponseEntity.ok(service.buscarPorTag(tag));
    }

    /**
     * POST /api/v1/matrizes
     */
    @PostMapping
    public ResponseEntity<MatrizElemento> criar(@Valid @RequestBody MatrizElemento item) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(item));
    }

    /**
     * PUT /api/v1/matrizes/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<MatrizElemento> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody MatrizElemento item) {
        return ResponseEntity.ok(service.atualizar(id, item));
    }

    /**
     * PATCH /api/v1/matrizes/{id}/estoque
     * Ajusta o estoque (entrada ou saída)
     */
    @PatchMapping("/{id}/estoque")
    public ResponseEntity<MatrizElemento> ajustarEstoque(
            @PathVariable UUID id,
            @RequestParam int delta,
            @RequestParam(defaultValue = "Ajuste manual") String motivo) {
        return ResponseEntity.ok(service.ajustarEstoque(id, delta, motivo));
    }

    /**
     * DELETE /api/v1/matrizes/{id}
     * Desativa o item (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desativar(@PathVariable UUID id) {
        service.desativar(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * DELETE /api/v1/matrizes/{id}/excluir
     * Exclui fisicamente o item (hard delete)
     */
    @DeleteMapping("/{id}/excluir")
    public ResponseEntity<Void> excluir(@PathVariable UUID id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
