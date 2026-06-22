package com.dacarto.matrizes.controller;

import com.dacarto.matrizes.model.Maquina;
import com.dacarto.matrizes.service.MaquinaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/maquinas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MaquinaController {

    private final MaquinaService service;

    @GetMapping
    public ResponseEntity<List<Maquina>> listar(@RequestParam(required = false, defaultValue = "false") boolean todas) {
        if (todas) {
            return ResponseEntity.ok(service.listarTodas());
        }
        return ResponseEntity.ok(service.listarAtivas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Maquina> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Maquina maquina) {
        try {
            Maquina salva = service.criar(maquina);
            return ResponseEntity.ok(salva);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable UUID id, @RequestBody Maquina maquina) {
        try {
            Maquina atualizada = service.atualizar(id, maquina);
            return ResponseEntity.ok(atualizada);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable UUID id) {
        try {
            service.deletar(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            // Se falhar devido a chave estrangeira, podemos alternativamente desativar a máquina
            try {
                Maquina m = service.buscarPorId(id);
                m.setAtiva(false);
                service.atualizar(id, m);
                return ResponseEntity.ok().body("A máquina possui vínculos e foi desativada em vez de excluída.");
            } catch (Exception ex) {
                return ResponseEntity.badRequest().body("Erro ao excluir ou desativar máquina: " + e.getMessage());
            }
        }
    }
}
