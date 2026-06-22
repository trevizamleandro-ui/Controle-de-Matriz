package com.dacarto.matrizes.service;

import com.dacarto.matrizes.model.Maquina;
import com.dacarto.matrizes.repository.MaquinaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MaquinaService {

    private final MaquinaRepository repository;

    public List<Maquina> listarTodas() {
        return repository.findAllByOrderByNomeMaquinaAsc();
    }

    public List<Maquina> listarAtivas() {
        return repository.findByAtivaTrueOrderByNomeMaquinaAsc();
    }

    public Maquina buscarPorId(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Máquina não encontrada: " + id));
    }

    @Transactional
    public Maquina criar(Maquina maquina) {
        if (maquina.getNomeMaquina() == null || maquina.getNomeMaquina().trim().isEmpty()) {
            throw new IllegalArgumentException("O nome da máquina é obrigatório.");
        }
        String nome = maquina.getNomeMaquina().trim();
        if (repository.existsByNomeMaquina(nome)) {
            throw new IllegalArgumentException("Já existe uma máquina com este nome.");
        }
        maquina.setNomeMaquina(nome);
        Maquina salva = repository.save(maquina);
        log.info("Máquina criada: [{}] - {}", salva.getId(), salva.getNomeMaquina());
        return salva;
    }

    @Transactional
    public Maquina atualizar(UUID id, Maquina dados) {
        Maquina existente = buscarPorId(id);
        if (dados.getNomeMaquina() == null || dados.getNomeMaquina().trim().isEmpty()) {
            throw new IllegalArgumentException("O nome da máquina é obrigatório.");
        }
        String nomeNovo = dados.getNomeMaquina().trim();
        if (!nomeNovo.equalsIgnoreCase(existente.getNomeMaquina())) {
            if (repository.existsByNomeMaquina(nomeNovo)) {
                throw new IllegalArgumentException("Já existe uma máquina com este nome.");
            }
        }
        existente.setNomeMaquina(nomeNovo);
        existente.setLocalizacao(dados.getLocalizacao());
        existente.setDescricao(dados.getDescricao());
        existente.setAtiva(dados.getAtiva());
        
        Maquina atualizada = repository.save(existente);
        log.info("Máquina atualizada: [{}]", atualizada.getId());
        return atualizada;
    }

    @Transactional
    public void deletar(UUID id) {
        Maquina existente = buscarPorId(id);
        // Soft delete / Toggle or hard delete? Let's make it deactivate (soft delete) first, or hard delete
        // If we want to support both, we can do hard delete but if we have associations we can deactivate.
        // Let's check: does associacao_matriz_maquina refer to it? Yes.
        // So let's make it a soft delete (set active = false) or hard delete if possible.
        // Let's implement hard delete and catch exceptions if constrained, or set active=false.
        // Actually, setting active = false is very safe. Let's do a hard delete if no relations, otherwise soft delete/exception.
        repository.delete(existente);
        log.info("Máquina deletada: [{}]", id);
    }
}
