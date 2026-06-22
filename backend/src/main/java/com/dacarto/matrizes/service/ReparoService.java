package com.dacarto.matrizes.service;

import com.dacarto.matrizes.model.Fornecedor;
import com.dacarto.matrizes.model.MatrizElemento;
import com.dacarto.matrizes.model.Reparo;
import com.dacarto.matrizes.repository.FornecedorRepository;
import com.dacarto.matrizes.repository.ReparoRepository;
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
public class ReparoService {

    private final ReparoRepository repository;
    private final MatrizElementoService matrizElementoService;
    // Precisaremos de um repository para Fornecedor, caso exista. 
    // Assumindo que existe FornecedorRepository.
    private final FornecedorRepository fornecedorRepository;

    public Page<Reparo> listar(String busca, UUID fornecedorId, int page, int size, String sortBy) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());
        return repository.buscarComFiltros(busca, fornecedorId, pageable);
    }

    public Reparo buscarPorId(UUID id) {
        return repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Reparo não encontrado: " + id));
    }

    @Transactional
    public Reparo criar(Reparo reparo) {
        MatrizElemento matrizElemento = matrizElementoService.buscarPorId(reparo.getMatrizElemento().getId());
        Fornecedor fornecedor = fornecedorRepository.findById(reparo.getFornecedor().getId())
            .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado"));

        reparo.setMatrizElemento(matrizElemento);
        reparo.setFornecedor(fornecedor);
        
        // Atualiza status da matriz para Em Reparo, se necessário
        if (reparo.getStatusReparo() == Reparo.ReparoStatus.ENVIADO || reparo.getStatusReparo() == Reparo.ReparoStatus.EM_REPARO) {
            matrizElemento.setStatus(MatrizElemento.ItemStatus.EM_REPARO);
        }

        Reparo salvo = repository.save(reparo);
        log.info("Reparo criado: [{}] para TAG {}", salvo.getId(), matrizElemento.getTagIdentificacao());
        return salvo;
    }

    @Transactional
    public Reparo atualizar(UUID id, Reparo dados) {
        Reparo existente = buscarPorId(id);

        if (dados.getMatrizElemento() != null && !existente.getMatrizElemento().getId().equals(dados.getMatrizElemento().getId())) {
            MatrizElemento novaMatriz = matrizElementoService.buscarPorId(dados.getMatrizElemento().getId());
            existente.setMatrizElemento(novaMatriz);
        }
        
        if (dados.getFornecedor() != null && !existente.getFornecedor().getId().equals(dados.getFornecedor().getId())) {
            Fornecedor novoFornecedor = fornecedorRepository.findById(dados.getFornecedor().getId())
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado"));
            existente.setFornecedor(novoFornecedor);
        }

        existente.setDataEnvio(dados.getDataEnvio());
        existente.setDataRetornoPrevista(dados.getDataRetornoPrevista());
        existente.setDataRetornoReal(dados.getDataRetornoReal());
        existente.setCustoReparo(dados.getCustoReparo());
        existente.setDescricaoProblema(dados.getDescricaoProblema());
        existente.setDescricaoReparoRealizado(dados.getDescricaoReparoRealizado());
        existente.setStatusReparo(dados.getStatusReparo());
        existente.setNumeroNfEnvio(dados.getNumeroNfEnvio());
        existente.setNumeroNfRetorno(dados.getNumeroNfRetorno());

        // Se finalizou e aprovou, volta para em uso/estoque
        if (dados.getStatusReparo() == Reparo.ReparoStatus.APROVADO_POS_REPARO) {
             existente.getMatrizElemento().setStatus(MatrizElemento.ItemStatus.EM_USO); // Ou outro status adequado
        }

        Reparo atualizado = repository.save(existente);
        log.info("Reparo atualizado: [{}]", atualizado.getId());
        return atualizado;
    }

    @Transactional
    public void deletar(UUID id) {
        Reparo existente = buscarPorId(id);
        repository.delete(existente);
        log.info("Reparo deletado: [{}]", id);
    }
}
