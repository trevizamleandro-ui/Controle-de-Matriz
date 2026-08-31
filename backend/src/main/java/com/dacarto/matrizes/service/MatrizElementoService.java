package com.dacarto.matrizes.service;

import com.dacarto.matrizes.dto.RelatorioItemDTO;
import com.dacarto.matrizes.model.MatrizElemento;
import com.dacarto.matrizes.model.Reparo;
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
import java.util.stream.Collectors;

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

    public List<RelatorioItemDTO> gerarRelatorioDetalhado() {
        List<MatrizElemento> matrizes = repository.findAll(Sort.by(Sort.Direction.ASC, "tagIdentificacao"));
        List<Reparo> reparos = reparoRepository.findAllWithFornecedor();

        Map<UUID, List<Reparo>> reparosPorMatriz = reparos.stream()
                .filter(r -> r.getMatrizElemento() != null)
                .collect(Collectors.groupingBy(r -> r.getMatrizElemento().getId()));

        return matrizes.stream().map(m -> {
            List<Reparo> reparosItem = reparosPorMatriz.getOrDefault(m.getId(), List.of());

            BigDecimal custoTotal = reparosItem.stream()
                    .map(Reparo::getCustoReparo)
                    .filter(java.util.Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Reparo ultimoReparoEmAndamento = reparosItem.stream()
                    .filter(r -> r.getStatusReparo() == Reparo.ReparoStatus.ENVIADO || r.getStatusReparo() == Reparo.ReparoStatus.EM_REPARO)
                    .max(java.util.Comparator.comparing(Reparo::getDataEnvio))
                    .orElse(null);

            boolean isEmReparo = m.getStatus() == MatrizElemento.ItemStatus.EM_REPARO || (m.getQuantidadeReparo() != null && m.getQuantidadeReparo() > 0);

            return RelatorioItemDTO.builder()
                    .id(m.getId())
                    .tagIdentificacao(m.getTagIdentificacao())
                    .nome(m.getNome())
                    .tipo(m.getTipo() != null ? m.getTipo().name() : "")
                    .maquinaAtual(m.getLocalizacaoAtual())
                    .quantidadeEstoque(m.getQuantidadeEstoque() != null ? m.getQuantidadeEstoque() : 0)
                    .emReparo(isEmReparo)
                    .fornecedorReparo(ultimoReparoEmAndamento != null && ultimoReparoEmAndamento.getFornecedor() != null ? ultimoReparoEmAndamento.getFornecedor().getNome() : null)
                    .custoTotalReparos(custoTotal)
                    .build();
        }).collect(Collectors.toList());
    }

    // Retorna TODOS os itens sem paginação nem filtro (para o Inventário com filtro no cliente)
    public List<MatrizElemento> listarTudoSemFiltro() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "tagIdentificacao"));
    }

    @Transactional
    public MatrizElemento ajustarLocalizacao(UUID id, int deltaAlmoxarifado, int deltaMaquina) {
        MatrizElemento m = buscarPorId(id);
        // Migração: inicializa campos de localização se registro for legado
        m.inicializarLocalizacaoSeNecessario();
        int novoAlmox   = Math.max(0, (m.getQuantidadeAlmoxarifado() != null ? m.getQuantidadeAlmoxarifado() : 0) + deltaAlmoxarifado);
        int novoMaquina = Math.max(0, (m.getQuantidadeMaquina()     != null ? m.getQuantidadeMaquina()     : 0) + deltaMaquina);
        m.setQuantidadeAlmoxarifado(novoAlmox);
        m.setQuantidadeMaquina(novoMaquina);
        m.sincronizarEstoque();
        return repository.save(m);
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
        item.sincronizarEstoque();
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
        
        if (dados.getQuantidadeAlmoxarifado() != null) {
            existente.setQuantidadeAlmoxarifado(dados.getQuantidadeAlmoxarifado());
        }
        if (dados.getQuantidadeMaquina() != null) {
            existente.setQuantidadeMaquina(dados.getQuantidadeMaquina());
        }
        existente.sincronizarEstoque();
        
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
        // 3 queries ao invés de 14 —————————————————————————————————————————
        // 1) Contagens por (status × tipo) — uma única query GROUP BY
        List<Object[]> contagens = repository.contarPorStatusETipo();

        // 2) Somas de estoque (total, matrizes, elementos) — uma única query CASE
        List<Object[]> somasList = repository.sumEstoquePorTipo();
        Object[] somas = (somasList != null && !somasList.isEmpty()) ? somasList.get(0) : new Object[]{0, 0, 0};
        long totalMatrizes  = toLong(somas[0]);
        long totalElementos = toLong(somas[1]);
        long totalItens     = toLong(somas[2]);

        // 3) Valor financeiro do inventário
        java.math.BigDecimal valorTotal = repository.calcularValorTotalInventario();

        // Itens abaixo do estoque mínimo (query separada pois retorna entidades)
        List<MatrizElemento> abaixo = repository.findAbaixoEstoqueMinimo();

        return buildKpiMap(contagens, totalMatrizes, totalElementos, totalItens, valorTotal, abaixo.size());
    }

    /** Processa o resultado do GROUP BY em memória para montar o Map de KPIs */
    private Map<String, Object> buildKpiMap(
            List<Object[]> contagens,
            long totalMatrizes, long totalElementos, long totalItens,
            java.math.BigDecimal valorTotal, int abaixoMinimo) {

        // Inicializa contadores
        long emUso = 0, emUsoM = 0, emUsoE = 0;
        long emEst = 0, emEstM = 0, emEstE = 0;
        long emRep = 0, emRepM = 0, emRepE = 0;
        long desativ = 0, desativM = 0, desativE = 0;

        for (Object[] row : contagens) {
            String status = String.valueOf(row[0]);
            String tipo   = String.valueOf(row[1]);
            long   cnt    = toLong(row[2]);
            boolean isM   = "Matriz".equals(tipo);

            switch (status) {
                case "EM_USO"     -> { emUso += cnt; if (isM) emUsoM += cnt; else emUsoE += cnt; }
                case "EM_ESTOQUE" -> { emEst += cnt; if (isM) emEstM += cnt; else emEstE += cnt; }
                case "EM_REPARO"  -> { emRep += cnt; if (isM) emRepM += cnt; else emRepE += cnt; }
                case "DESATIVADO" -> { desativ += cnt; if (isM) desativM += cnt; else desativE += cnt; }
            }
        }

        return Map.ofEntries(
            Map.entry("totalItens",    totalItens),
            Map.entry("totalMatrizes", totalMatrizes),
            Map.entry("totalElementos", totalElementos),

            Map.entry("emUso",          emUso),
            Map.entry("emUsoMatrizes",  emUsoM),
            Map.entry("emUsoElementos", emUsoE),

            Map.entry("emEstoque",          emEst),
            Map.entry("emEstoqueMatrizes",  emEstM),
            Map.entry("emEstoqueElementos", emEstE),

            Map.entry("emReparo",          emRep),
            Map.entry("emReparoMatrizes",  emRepM),
            Map.entry("emReparoElementos", emRepE),

            Map.entry("desativados",         desativ),
            Map.entry("desativadosMatrizes", desativM),
            Map.entry("desativadosElementos",desativE),

            Map.entry("abaixoEstoqueMinimo",   abaixoMinimo),
            Map.entry("valorTotalInventario",  valorTotal)
        );
    }

    private static long toLong(Object val) {
        if (val == null) return 0L;
        if (val instanceof Number n) return n.longValue();
        return Long.parseLong(val.toString());
    }

    public List<MatrizElemento> listarAbaixoEstoqueMinimo() {
        return repository.findAbaixoEstoqueMinimo();
    }
}

