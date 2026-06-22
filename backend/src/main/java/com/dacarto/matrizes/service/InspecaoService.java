package com.dacarto.matrizes.service;

import com.dacarto.matrizes.model.Inspecao;
import com.dacarto.matrizes.model.MatrizElemento;
import com.dacarto.matrizes.repository.InspecaoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class InspecaoService {

    private final InspecaoRepository repository;
    private final MatrizElementoService matrizElementoService;

    public Page<Inspecao> listar(String busca, Inspecao.InspecaoTipo tipo, Inspecao.InspecaoResultado resultado, int page, int size, String sortBy) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());
        return repository.buscarComFiltros(busca, tipo, resultado, pageable);
    }

    public Inspecao buscarPorId(UUID id) {
        return repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Inspeção não encontrada: " + id));
    }

    @Transactional
    public Inspecao criar(Inspecao inspecao) {
        // Garantir que a matriz elemento existe
        MatrizElemento matrizElemento = matrizElementoService.buscarPorId(inspecao.getMatrizElemento().getId());
        inspecao.setMatrizElemento(matrizElemento);
        
        Inspecao salva = repository.save(inspecao);
        log.info("Inspeção criada: [{}] para TAG {}", salva.getId(), matrizElemento.getTagIdentificacao());
        return salva;
    }

    @Transactional
    public Inspecao atualizar(UUID id, Inspecao dados) {
        Inspecao existente = buscarPorId(id);

        if (dados.getMatrizElemento() != null && !existente.getMatrizElemento().getId().equals(dados.getMatrizElemento().getId())) {
            MatrizElemento novaMatriz = matrizElementoService.buscarPorId(dados.getMatrizElemento().getId());
            existente.setMatrizElemento(novaMatriz);
        }

        existente.setTipoInspecao(dados.getTipoInspecao());
        existente.setInspetor(dados.getInspetor());
        existente.setResultado(dados.getResultado());
        existente.setParametrosAvaliados(dados.getParametrosAvaliados());
        existente.setObservacoes(dados.getObservacoes());
        existente.setImagemAvif(dados.getImagemAvif());
        
        if (dados.getDataInspecao() != null) {
            existente.setDataInspecao(dados.getDataInspecao());
        }

        Inspecao atualizada = repository.save(existente);
        log.info("Inspeção atualizada: [{}]", atualizada.getId());
        return atualizada;
    }

    @Transactional
    public void deletar(UUID id) {
        Inspecao existente = buscarPorId(id);
        repository.delete(existente);
        log.info("Inspeção deletada: [{}]", id);
    }
}
