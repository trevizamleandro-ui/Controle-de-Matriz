package com.dacarto.matrizes.service;

import com.dacarto.matrizes.model.MatrizElemento;
import com.dacarto.matrizes.repository.MatrizElementoRepository;
import com.dacarto.matrizes.repository.InspecaoRepository;
import com.dacarto.matrizes.repository.ReparoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MatrizElementoService {

    private final MatrizElementoRepository repository;
    private final InspecaoRepository inspecaoRepository;
    private final ReparoRepository reparoRepository;

    // ---- LISTAGEM / BUSCA ----

    public Page<MatrizElemento> listar(
            String termo,
            MatrizElemento.ItemStatus status,
            MatrizElemento.ItemTipo tipo,
            int page, int size, String sortBy) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());

        if (termo != null && !termo.isBlank()) {
            return repository.buscarPorTermo(termo.trim(), pageable);
        }
        if (status != null && tipo != null) {
            return repository.findByStatusAndTipo(status, tipo, pageable);
        }
        if (status != null) return repository.findByStatus(status, pageable);
        if (tipo != null)   return repository.findByTipo(tipo, pageable);

        return repository.findAll(pageable);
    }

    public List<MatrizElemento> listarTodos() {
        return repository.findAllAtivos();
    }

    public MatrizElemento buscarPorId(UUID id) {
        return repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Matriz/Elemento não encontrado: " + id));
    }

    public MatrizElemento buscarPorTag(String tag) {
        return repository.findByTagIdentificacao(tag)
            .orElseThrow(() -> new RuntimeException("Tag não encontrada: " + tag));
    }

    // ---- CRUD ----

    @Transactional
    public MatrizElemento criar(MatrizElemento item) {
        if (repository.existsByTagIdentificacao(item.getTagIdentificacao())) {
            throw new IllegalArgumentException("Tag já cadastrada: " + item.getTagIdentificacao());
        }
        MatrizElemento salvo = repository.save(item);
        log.info("Matriz/Elemento criado: {} [{}]", salvo.getTagIdentificacao(), salvo.getId());
        return salvo;
    }

    @Transactional
    public MatrizElemento atualizar(UUID id, MatrizElemento dados) {
        MatrizElemento existente = buscarPorId(id);

        // Verifica unicidade da tag se mudou
        if (!existente.getTagIdentificacao().equals(dados.getTagIdentificacao())
                && repository.existsByTagIdentificacao(dados.getTagIdentificacao())) {
            throw new IllegalArgumentException("Tag já cadastrada: " + dados.getTagIdentificacao());
        }

        existente.setTagIdentificacao(dados.getTagIdentificacao());
        existente.setNome(dados.getNome());
        existente.setTipo(dados.getTipo());
        existente.setModelo(dados.getModelo());
        existente.setMaterial(dados.getMaterial());
        existente.setCaracteristicasTecnicas(dados.getCaracteristicasTecnicas());
        existente.setCustoUnitario(dados.getCustoUnitario());
        existente.setEstoqueMinimo(dados.getEstoqueMinimo());
        existente.setQuantidadeEstoque(dados.getQuantidadeEstoque());
        existente.setStatus(dados.getStatus());
        existente.setLocalizacaoAtual(dados.getLocalizacaoAtual());
        existente.setObservacoes(dados.getObservacoes());
        existente.setChecklistPontos(dados.getChecklistPontos());
        existente.setDesenhoPdf(dados.getDesenhoPdf());
        existente.setAlturaOriginal(dados.getAlturaOriginal());
        existente.setAlturaAtual(dados.getAlturaAtual());
        existente.setAlturaMinima(dados.getAlturaMinima());
        existente.setQuantidadeRetificas(dados.getQuantidadeRetificas());
        existente.setPressao(dados.getPressao());
        existente.setTipoCorte(dados.getTipoCorte());

        log.info("Matriz/Elemento atualizado: {} [{}]", existente.getTagIdentificacao(), id);
        return repository.save(existente);
    }

    @Transactional
    public void desativar(UUID id) {
        MatrizElemento item = buscarPorId(id);
        item.setStatus(MatrizElemento.ItemStatus.DESATIVADO);
        repository.save(item);
        log.info("Matriz/Elemento desativado: {} [{}]", item.getTagIdentificacao(), id);
    }

    @Transactional
    public void excluir(UUID id) {
        MatrizElemento item = buscarPorId(id);
        // Excluir dependências em cascata
        inspecaoRepository.deleteAllByMatrizElementoId(id);
        reparoRepository.deleteAllByMatrizElementoId(id);
        repository.delete(item);
        log.info("Matriz/Elemento excluido definitivamente (com cascata): {} [{}]", item.getTagIdentificacao(), id);
    }

    // ---- INVENTÁRIO ----

    @Transactional
    public MatrizElemento ajustarEstoque(UUID id, int delta, String motivo) {
        MatrizElemento item = buscarPorId(id);
        int novoEstoque = item.getQuantidadeEstoque() + delta;
        if (novoEstoque < 0) throw new IllegalArgumentException("Estoque não pode ser negativo");
        item.setQuantidadeEstoque(novoEstoque);
        log.info("Estoque ajustado: {} | delta={} | motivo={}", item.getTagIdentificacao(), delta, motivo);
        return repository.save(item);
    }

    // ---- KPIs / DASHBOARD ----

    public Map<String, Object> calcularKpis() {
        List<MatrizElemento> abaixo = repository.findAbaixoEstoqueMinimo();
        return Map.ofEntries(
            Map.entry("totalItens", repository.sumEstoqueTotal()),
            Map.entry("totalMatrizes", repository.sumEstoqueByTipo(MatrizElemento.ItemTipo.Matriz)),
            Map.entry("totalElementos", repository.sumEstoqueByTipo(MatrizElemento.ItemTipo.Elemento)),
            
            Map.entry("emUso", repository.countByStatus(MatrizElemento.ItemStatus.EM_USO)),
            Map.entry("emUsoMatrizes", repository.countByStatusAndTipo(MatrizElemento.ItemStatus.EM_USO, MatrizElemento.ItemTipo.Matriz)),
            Map.entry("emUsoElementos", repository.countByStatusAndTipo(MatrizElemento.ItemStatus.EM_USO, MatrizElemento.ItemTipo.Elemento)),
            
            Map.entry("emEstoque", repository.countByStatus(MatrizElemento.ItemStatus.EM_ESTOQUE)),
            Map.entry("emEstoqueMatrizes", repository.countByStatusAndTipo(MatrizElemento.ItemStatus.EM_ESTOQUE, MatrizElemento.ItemTipo.Matriz)),
            Map.entry("emEstoqueElementos", repository.countByStatusAndTipo(MatrizElemento.ItemStatus.EM_ESTOQUE, MatrizElemento.ItemTipo.Elemento)),
            
            Map.entry("emReparo", repository.countByStatus(MatrizElemento.ItemStatus.EM_REPARO)),
            Map.entry("emReparoMatrizes", repository.countByStatusAndTipo(MatrizElemento.ItemStatus.EM_REPARO, MatrizElemento.ItemTipo.Matriz)),
            Map.entry("emReparoElementos", repository.countByStatusAndTipo(MatrizElemento.ItemStatus.EM_REPARO, MatrizElemento.ItemTipo.Elemento)),
            
            Map.entry("desativados", repository.countByStatus(MatrizElemento.ItemStatus.DESATIVADO)),
            Map.entry("desativadosMatrizes", repository.countByStatusAndTipo(MatrizElemento.ItemStatus.DESATIVADO, MatrizElemento.ItemTipo.Matriz)),
            Map.entry("desativadosElementos", repository.countByStatusAndTipo(MatrizElemento.ItemStatus.DESATIVADO, MatrizElemento.ItemTipo.Elemento)),
            
            Map.entry("abaixoEstoqueMinimo", abaixo.size()),
            Map.entry("valorTotalInventario", repository.calcularValorTotalInventario())
        );
    }

    public List<MatrizElemento> listarAbaixoEstoqueMinimo() {
        return repository.findAbaixoEstoqueMinimo();
    }
}
