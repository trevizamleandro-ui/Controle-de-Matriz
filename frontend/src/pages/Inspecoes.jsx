import { useState, useEffect, useCallback } from 'react';
import { inspecoesApi, matrizesApi } from '../services/api';

// ---- HELPERS ----
const getLocalIsoString = (date = new Date()) => {
  const tzoffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

function resultadoBadge(r) {
  const cls = {
    'Aprovado': 'badge-em-uso',       // Verde
    'Reprovado': 'badge-desativado',  // Vermelho
    'Requer Reparo': 'badge-em-reparo'// Amarelo
  };
  const dots = { 'Aprovado': '✔', 'Reprovado': '✖', 'Requer Reparo': '⚠' };
  return <span className={`badge ${cls[r] || ''}`}>{dots[r]} {r}</span>;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('pt-BR', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  }).format(new Date(dateStr));
}

// ---- MODAL CADASTRO / EDIÇÃO ----
const EMPTY_FORM = {
  matrizElementoId: '',
  tipoInspecao: 'Inicial',
  inspetor: '',
  resultado: 'Aprovado',
  observacoes: '',
  imagemAvif: null,
};

function ModalInspecao({ inspecao, matrizes, onSave, onClose }) {
  const [form, setForm] = useState(() => inspecao
    ? { 
        ...inspecao, 
        matrizElementoId: inspecao.matrizElemento?.id,
        tipoInspecao: inspecao.tipoInspecao,
        imagemAvif: inspecao.imagemAvif || null,
        dataInspecao: inspecao.dataInspecao ? getLocalIsoString(new Date(inspecao.dataInspecao)) : getLocalIsoString()
      }
    : {
        ...EMPTY_FORM,
        dataInspecao: getLocalIsoString()
      }
  );

  const [checklistRespostas, setChecklistRespostas] = useState(() => {
    let saved = {};
    if (inspecao && inspecao.parametrosAvaliados) {
      if (typeof inspecao.parametrosAvaliados === 'string') {
        try {
          saved = JSON.parse(inspecao.parametrosAvaliados);
        } catch {
          saved = {};
        }
      } else {
        saved = inspecao.parametrosAvaliados;
      }
    }
    // Se estiver editando, podemos mesclar com pontos configurados na matriz para garantir que apareçam
    const matrixId = inspecao?.matrizElemento?.id;
    if (matrixId) {
      const m = matrizes.find(item => item.id === matrixId);
      if (m && m.checklistPontos) {
        m.checklistPontos.forEach(p => {
          if (saved[p] === undefined) {
            saved[p] = "OK / Conforme"; // Valor padrão para novos pontos configurados
          }
        });
      }
    }
    return saved;
  });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleMatrizChange = (matrizId) => {
    set('matrizElementoId', matrizId);
    const m = matrizes.find(item => item.id === matrizId);
    if (m) {
      const obj = {};
      const pontos = m.checklistPontos || [];
      if (pontos.length > 0) {
        pontos.forEach(p => {
          obj[p] = "OK / Conforme";
        });
      } else {
        obj["Desgaste Visual"] = "Normal";
        obj["Tolerância Dimensional"] = "Dentro do limite";
      }
      setChecklistRespostas(obj);
    } else {
      setChecklistRespostas({});
    }
  };

  const handleSave = () => {
    if (!form.matrizElementoId || !form.inspetor) {
      alert('Matriz/Elemento e Inspetor são obrigatórios.');
      return;
    }
    
    const payload = {
      matrizElemento: { id: form.matrizElementoId },
      tipoInspecao: form.tipoInspecao,
      inspetor: form.inspetor,
      resultado: form.resultado,
      parametrosAvaliados: checklistRespostas,
      observacoes: form.observacoes || null,
      imagemAvif: form.imagemAvif || null,
      dataInspecao: form.dataInspecao ? new Date(form.dataInspecao).toISOString() : new Date().toISOString()
    };

    onSave(payload, inspecao?.id);
  };

  const selectedMatriz = matrizes.find(m => m.id === form.matrizElementoId);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3 className="modal-title">{inspecao ? '✏️ Editar Inspeção' : '📋 Nova Inspeção'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Peça Inspecionada (TAG / Nome) *</label>
            <select className="form-select" value={form.matrizElementoId} onChange={e => handleMatrizChange(e.target.value)}>
              <option value="">-- Selecione a Peça --</option>
              {matrizes.map(m => (
                <option key={m.id} value={m.id}>{m.tagIdentificacao || m.tag_identificacao} - {m.nome}</option>
              ))}
            </select>

            {selectedMatriz?.desenhoPdf && (
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={() => {
                  const win = window.open();
                  win.document.write(`<iframe src="${selectedMatriz.desenhoPdf}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                }}
                style={{ marginTop: 8 }}
              >
                👁 Ver Desenho Técnico (PDF)
              </button>
            )}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Tipo de Inspeção *</label>
              <select className="form-select" value={form.tipoInspecao} onChange={e => set('tipoInspecao', e.target.value)}>
                <option value="Inicial">Inicial</option>
                <option value="Periodica">Periódica</option>
                <option value="PosReparo">Pós-Reparo</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Inspetor *</label>
              <input className="form-input" placeholder="Nome do Inspetor"
                value={form.inspetor} onChange={e => set('inspetor', e.target.value)} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Resultado Final *</label>
              <select className="form-select" value={form.resultado} onChange={e => set('resultado', e.target.value)}>
                <option value="Aprovado">Aprovado</option>
                <option value="RequereReparo">Requer Reparo</option>
                <option value="Reprovado">Reprovado</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Data da Inspeção *</label>
              <input 
                type="datetime-local" 
                className="form-input" 
                value={form.dataInspecao || ''} 
                onChange={e => set('dataInspecao', e.target.value)} 
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--color-accent-cyan)' }}>📋 Checklist / Parâmetros Avaliados</span>
            </label>

            <div style={{ background: 'var(--color-bg-glass)', borderRadius: 'var(--radius-md)', padding: 16, border: '1px solid var(--color-border)' }}>
              {Object.keys(checklistRespostas).length === 0 ? (
                <div style={{ fontSize: 13, opacity: 0.5, textAlign: 'center', padding: '12px 0' }}>
                  Selecione uma peça acima para carregar o checklist correspondente.
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                    {Object.entries(checklistRespostas).map(([key, val]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 0, 0, 0.2)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{key}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <select 
                            className="form-select" 
                            style={{ width: 180, margin: 0, padding: '4px 8px', height: '32px', fontSize: 12 }}
                            value={val}
                            onChange={e => {
                              setChecklistRespostas(prev => ({
                                ...prev,
                                [key]: e.target.value
                              }));
                            }}
                          >
                            <option value="OK / Conforme">OK / Conforme</option>
                            <option value="Não Conforme">Não Conforme</option>
                            <option value="Não Aplicável">Não Aplicável</option>
                          </select>
                          <button 
                            type="button" 
                            className="btn btn-danger btn-sm" 
                            style={{ padding: '2px 8px', height: '32px' }} 
                            onClick={() => {
                              setChecklistRespostas(prev => {
                                const copy = { ...prev };
                                delete copy[key];
                                return copy;
                              });
                            }}
                            title="Remover parâmetro"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Adicionar parâmetro avulso a esta inspeção..." 
                      id="novoParametroAvulso"
                      style={{ margin: 0, fontSize: 13, height: '36px' }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.target.value.trim();
                          if (val) {
                            setChecklistRespostas(prev => ({ ...prev, [val]: "OK / Conforme" }));
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      style={{ padding: '0 16px', height: '36px' }}
                      onClick={() => {
                        const input = document.getElementById('novoParametroAvulso');
                        const val = input ? input.value.trim() : '';
                        if (val) {
                          setChecklistRespostas(prev => ({ ...prev, [val]: "OK / Conforme" }));
                          input.value = '';
                        }
                      }}
                    >
                      ➕ Adicionar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Anexar Imagem da Inspeção (Extensão .avif apenas)</label>
            <input 
              type="file" 
              accept=".avif,image/avif" 
              className="form-input" 
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  if (!file.name.toLowerCase().endsWith('.avif')) {
                    alert('Por favor, selecione apenas arquivos com extensão .avif');
                    e.target.value = '';
                    return;
                  }
                  try {
                    const base64 = await fileToBase64(file);
                    set('imagemAvif', base64);
                  } catch (err) {
                    alert('Erro ao processar imagem.');
                  }
                }
              }} 
            />
            {form.imagemAvif && (
              <div style={{ marginTop: 8 }}>
                <img src={form.imagemAvif} alt="Preview AVIF" style={{ maxHeight: 100, borderRadius: 4, border: '1px solid var(--color-border)' }} />
                <button type="button" className="btn btn-danger btn-sm" style={{ marginLeft: 8, padding: '2px 6px' }} onClick={() => set('imagemAvif', null)}>Remover</button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Observações</label>
            <textarea className="form-textarea" placeholder="Laudo ou comentários adicionais..."
              value={form.observacoes || ''} onChange={e => set('observacoes', e.target.value)} />
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {inspecao ? '💾 Salvar Alterações' : '✅ Registrar Inspeção'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- MODAL DETALHE ----
function ModalDetalhe({ inspecao, onClose }) {
  const parametros = inspecao.parametrosAvaliados || {};
  
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--color-accent-cyan)' }}>
              {inspecao.matrizElemento?.tagIdentificacao}
            </span>
            <h3 className="modal-title" style={{ marginTop: 4 }}>Laudo de Inspeção</h3>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {resultadoBadge(inspecao.resultado === 'RequereReparo' ? 'Requer Reparo' : inspecao.resultado)}
            <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{inspecao.tipoInspecao}</span>
          </div>
          
          <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
            {[
              ['Peça', inspecao.matrizElemento?.nome || '—'],
              ['Data da Inspeção', formatDate(inspecao.dataInspecao)],
              ['Inspetor Responsável', inspecao.inspetor],
            ].map(([label, val]) => (
              <div key={label} style={{ padding: '12px 16px', background: 'var(--color-bg-glass)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{val}</div>
              </div>
            ))}
          </div>

          {inspecao.imagemAvif && (
            <div style={{ marginBottom: 20 }}>
              <div className="form-label">Imagem da Inspeção (AVIF)</div>
              <div style={{ background: 'rgba(0,0,0,0.1)', padding: 8, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <img src={inspecao.imagemAvif} alt="Imagem da Inspeção" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 'var(--radius-sm)' }} />
              </div>
            </div>
          )}

          {inspecao.matrizElemento?.desenhoPdf && (
            <div style={{ marginBottom: 20 }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  const win = window.open();
                  win.document.write(`<iframe src="${inspecao.matrizElemento.desenhoPdf}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                }}
              >
                📄 Abrir Desenho Técnico Associado (PDF)
              </button>
            </div>
          )}
          
          {Object.keys(parametros).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="form-label">Parâmetros Avaliados</div>
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, border: '1px solid var(--color-border)' }}>
                {Object.entries(parametros).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-accent-cyan)', minWidth: 160 }}>{k}:</span>
                    <span style={{ color: 'var(--color-text-primary)' }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {inspecao.observacoes && (
            <div>
              <div className="form-label">Observações do Laudo</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{inspecao.observacoes}</div>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ---- MODAL CONFIGURAÇÃO CHECKLIST / PDF ----
function ModalConfigChecklist({ matrizes, onSave, onClose }) {
  const [matrizId, setMatrizId] = useState('');
  const [pontos, setPontos] = useState([]);
  const [novoPonto, setNovoPonto] = useState('');
  const [desenhoPdf, setDesenhoPdf] = useState('');
  const [loading, setLoading] = useState(false);

  // Novos campos técnicos
  const [alturaOriginal, setAlturaOriginal] = useState('');
  const [alturaAtual, setAlturaAtual] = useState('');
  const [alturaMinima, setAlturaMinima] = useState('');
  const [quantidadeRetificas, setQuantidadeRetificas] = useState('');
  const [pressao, setPressao] = useState('Alta Pressão');
  const [tipoCorte, setTipoCorte] = useState('Corte a Água');

  const handleMatrizChange = (id) => {
    setMatrizId(id);
    const m = matrizes.find(item => item.id === id);
    if (m) {
      setPontos(m.checklistPontos || []);
      setDesenhoPdf(m.desenhoPdf || '');
      setAlturaOriginal(m.alturaOriginal !== undefined && m.alturaOriginal !== null ? m.alturaOriginal : '');
      setAlturaAtual(m.alturaAtual !== undefined && m.alturaAtual !== null ? m.alturaAtual : '');
      setAlturaMinima(m.alturaMinima !== undefined && m.alturaMinima !== null ? m.alturaMinima : '');
      setQuantidadeRetificas(m.quantidadeRetificas !== undefined && m.quantidadeRetificas !== null ? m.quantidadeRetificas : '');
      setPressao(m.pressao || 'Alta Pressão');
      setTipoCorte(m.tipoCorte || 'Corte a Água');
    } else {
      setPontos([]);
      setDesenhoPdf('');
      setAlturaOriginal('');
      setAlturaAtual('');
      setAlturaMinima('');
      setQuantidadeRetificas('');
      setPressao('Alta Pressão');
      setTipoCorte('Corte a Água');
    }
  };

  const handleAddPonto = () => {
    if (novoPonto.trim() && !pontos.includes(novoPonto.trim())) {
      setPontos([...pontos, novoPonto.trim()]);
      setNovoPonto('');
    }
  };

  const handleRemovePonto = (index) => {
    setPontos(pontos.filter((_, i) => i !== index));
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        alert('Por favor, selecione apenas arquivos com extensão .pdf');
        e.target.value = '';
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        setDesenhoPdf(base64);
      } catch (err) {
        alert('Erro ao processar PDF.');
      }
    }
  };

  const handleSave = async () => {
    if (!matrizId) {
      alert('Selecione uma matriz/elemento.');
      return;
    }
    setLoading(true);
    const m = matrizes.find(item => item.id === matrizId);
    try {
      const payload = {
        ...m,
        checklistPontos: pontos,
        desenhoPdf: desenhoPdf || null,
        alturaOriginal: alturaOriginal !== '' ? parseFloat(alturaOriginal) : null,
        alturaAtual: alturaAtual !== '' ? parseFloat(alturaAtual) : null,
        alturaMinima: alturaMinima !== '' ? parseFloat(alturaMinima) : null,
        quantidadeRetificas: quantidadeRetificas !== '' ? parseInt(quantidadeRetificas) : 0,
        pressao: pressao || null,
        tipoCorte: tipoCorte || null
      };
      await matrizesApi.atualizar(matrizId, payload);
      alert('Checklist e desenho salvos com sucesso!');
      onSave();
      onClose();
    } catch (err) {
      alert('Erro ao salvar checklist: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3 className="modal-title">📋 Criar Checklist da Matriz</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Matriz / Elemento</label>
            <select className="form-select" value={matrizId} onChange={e => handleMatrizChange(e.target.value)}>
              <option value="">-- Selecione a Matriz --</option>
              {matrizes.map(m => (
                <option key={m.id} value={m.id}>{m.tagIdentificacao || m.tag_identificacao} - {m.nome}</option>
              ))}
            </select>
          </div>

          {matrizId && (
            <>
              <div style={{ padding: '12px 16px', background: 'var(--color-bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 14, color: 'var(--color-accent-cyan)' }}>📏 Dimensões e Especificações da Matriz</h4>
                
                <div className="grid-3" style={{ marginBottom: 12 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Altura Original (mm)</label>
                    <input 
                      type="number" 
                      step="any"
                      className="form-input" 
                      placeholder="ex: 50.5" 
                      value={alturaOriginal}
                      onChange={e => setAlturaOriginal(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Altura Atual (mm)</label>
                    <input 
                      type="number" 
                      step="any"
                      className="form-input" 
                      placeholder="ex: 49.0" 
                      value={alturaAtual}
                      onChange={e => setAlturaAtual(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Altura Mínima (mm)</label>
                    <input 
                      type="number" 
                      step="any"
                      className="form-input" 
                      placeholder="ex: 45.0" 
                      value={alturaMinima}
                      onChange={e => setAlturaMinima(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Quantidade de Retíficas</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="ex: 3" 
                      value={quantidadeRetificas}
                      onChange={e => setQuantidadeRetificas(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Pressão da Matriz</label>
                    <select 
                      className="form-select" 
                      value={pressao} 
                      onChange={e => setPressao(e.target.value)}
                    >
                      <option value="Alta Pressão">Alta Pressão</option>
                      <option value="Baixa Pressão">Baixa Pressão</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Tipo de Corte</label>
                    <select 
                      className="form-select" 
                      value={tipoCorte} 
                      onChange={e => setTipoCorte(e.target.value)}
                    >
                      <option value="Corte a Água">Corte a Água</option>
                      <option value="Corte Seco">Corte Seco</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Pontos a Inspecionar</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Adicionar ponto de inspeção..." 
                    value={novoPonto}
                    onChange={e => setNovoPonto(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddPonto()}
                    style={{ margin: 0 }}
                  />
                  <button type="button" className="btn btn-primary" onClick={handleAddPonto}>➕</button>
                </div>
                <div style={{ maxHeight: 150, overflowY: 'auto', background: 'rgba(0,0,0,0.1)', borderRadius: 4, padding: 8 }}>
                  {pontos.length === 0 ? (
                    <div style={{ fontSize: 12, opacity: 0.5, textAlign: 'center', padding: 8 }}>Nenhum ponto de checklist cadastrado.</div>
                  ) : (
                    pontos.map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 4 }}>
                        <span style={{ fontSize: 13 }}>{p}</span>
                        <button type="button" className="btn btn-danger btn-sm" style={{ padding: '2px 6px' }} onClick={() => handleRemovePonto(idx)}>🗑</button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Desenho Técnico (PDF apenas)</label>
                <input 
                  type="file" 
                  accept=".pdf,application/pdf" 
                  className="form-input" 
                  onChange={handlePdfUpload}
                />
                {desenhoPdf && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: '#10B981' }}>📄 Desenho técnico anexado.</span>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => {
                        const win = window.open();
                        win.document.write(`<iframe src="${desenhoPdf}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                      }}
                    >
                      Ver
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setDesenhoPdf('')}>Remover</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading || !matrizId}>
            {loading ? 'Salvando...' : '💾 Salvar Checklist'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- PÁGINA PRINCIPAL ----
export default function Inspecoes() {
  const [inspecoes, setInspecoes]       = useState([]);
  const [matrizes, setMatrizes]         = useState([]);
  const [busca, setBusca]               = useState('');
  const [buscaInput, setBuscaInput]     = useState('');
  const [filtroTipo, setFiltroTipo]     = useState('');
  const [filtroResultado, setFiltroResultado] = useState('');
  
  const [modalCadastro, setModalCadastro] = useState(false);
  const [modalEdicao, setModalEdicao]     = useState(null);
  const [modalDetalhe, setModalDetalhe]   = useState(null);
  const [modalChecklist, setModalChecklist] = useState(false);
  
  const [loading, setLoading]           = useState(true);
  const [erro, setErro]                 = useState('');

  // Carregar inspecoes
  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      let tipoEnum = filtroTipo === 'Periódica' ? 'Periodica' : filtroTipo === 'Pós-Reparo' ? 'PosReparo' : filtroTipo;
      let resultadoEnum = filtroResultado === 'Requer Reparo' ? 'RequereReparo' : filtroResultado;

      const response = await inspecoesApi.listar({ busca, tipo: tipoEnum, resultado: resultadoEnum });
      setInspecoes(response?.content || []);
    } catch (e) {
      console.error(e);
      setErro('Erro ao carregar dados da API.');
    } finally {
      setLoading(false);
    }
  }, [busca, filtroTipo, filtroResultado]);

  // Carregar matrizes separadamente (apenas uma vez no mount)
  const carregarMatrizes = useCallback(async () => {
    try {
      const matsResponse = await matrizesApi.listarTodos();
      setMatrizes(matsResponse?.content || matsResponse?.data || matsResponse || []);
    } catch (e) {
      console.error('Erro ao carregar matrizes:', e);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { carregarMatrizes(); }, [carregarMatrizes]);

  // Debounce para buscaInput -> busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusca(buscaInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [buscaInput]);

  const handleSalvar = async (payload, id) => {
    try {
      if (id) {
        await inspecoesApi.atualizar(id, payload);
      } else {
        await inspecoesApi.criar(payload);
      }
      setModalCadastro(false);
      setModalEdicao(null);
      await carregar();
    } catch (e) {
      alert(`Erro ao salvar: ${e.message}`);
    }
  };

  const handleExcluir = async (id) => {
    if (!confirm('Excluir este laudo de inspeção permanentemente?')) return;
    try {
      await inspecoesApi.excluir(id);
      await carregar();
    } catch (e) {
      alert(`Erro ao excluir: ${e.message}`);
    }
  };

  const handleImprimirRelatorio = () => {
    const agrupado = {};
    inspecoes.forEach(ins => {
      const tag = ins.matrizElemento?.tagIdentificacao || 'SEM_TAG';
      if (!agrupado[tag]) {
        agrupado[tag] = {
          matriz: ins.matrizElemento,
          lista: []
        };
      }
      agrupado[tag].lista.push(ins);
    });

    const win = window.open('', '_blank');
    if (!win) {
      alert('Por favor, permita pop-ups para imprimir o relatório.');
      return;
    }

    let html = `
      <html>
      <head>
        <title>Relatório de Histórico de Inspeções - Dacarto</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            margin: 20px;
            font-size: 13px;
          }
          .header-report {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #005691;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .title {
            font-size: 22px;
            font-weight: bold;
            color: #005691;
            margin: 0;
          }
          .subtitle {
            font-size: 12px;
            color: #666;
            margin: 5px 0 0 0;
          }
          .matrix-section {
            margin-bottom: 35px;
            page-break-inside: avoid;
          }
          .matrix-title {
            font-size: 16px;
            font-weight: bold;
            color: #005691;
            background: #f4f7f9;
            padding: 8px 12px;
            border-left: 4px solid #005691;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
          }
          .matrix-tech-info {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 12px;
            padding: 8px 12px;
            background: #fafafa;
            border: 1px solid #eee;
            border-radius: 4px;
            font-size: 11px;
          }
          .table-inspections {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
          }
          .table-inspections th {
            background: #005691;
            color: white;
            text-align: left;
            padding: 6px 10px;
            font-size: 11px;
          }
          .table-inspections td {
            padding: 8px 10px;
            border-bottom: 1px solid #ddd;
            vertical-align: top;
          }
          .badge {
            display: inline-block;
            padding: 3px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
          }
          .badge-aprovado { background: #d4edda; color: #155724; }
          .badge-reprovado { background: #f8d7da; color: #721c24; }
          .badge-reparo { background: #fff3cd; color: #856404; }
          .checklist-list {
            margin: 0;
            padding-left: 15px;
            font-size: 11px;
            color: #555;
          }
          .footer-note {
            text-align: center;
            font-size: 10px;
            color: #888;
            margin-top: 50px;
            border-top: 1px solid #eee;
            padding-top: 10px;
          }
          @media print {
            body { margin: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header-report">
          <div>
            <h1 class="title">DACARTO - Relatório de Inspeções</h1>
            <p class="subtitle">Histórico consolidado por Tag de Matriz</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-weight: bold;">Data de Extração: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            <p class="subtitle" style="margin: 3px 0 0 0;">Total de registros: ${inspecoes.length}</p>
            <button class="no-print" onclick="window.print()" style="margin-top: 8px; padding: 6px 12px; background: #005691; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">🖨 Imprimir Relatório</button>
          </div>
        </div>
    `;

    Object.values(agrupado).forEach(({ matriz, lista }) => {
      lista.sort((a, b) => new Date(b.dataInspecao) - new Date(a.dataInspecao));

      const tagStr = matriz?.tagIdentificacao || 'N/A';
      const nomeStr = matriz?.nome || '—';
      const originalH = matriz?.alturaOriginal != null ? `${matriz.alturaOriginal} mm` : '—';
      const atualH = matriz?.alturaAtual != null ? `${matriz.alturaAtual} mm` : '—';
      const minimaH = matriz?.alturaMinima != null ? `${matriz.alturaMinima} mm` : '—';
      const retificas = matriz?.quantidadeRetificas != null ? matriz.quantidadeRetificas : '0';
      const pressao = matriz?.pressao || '—';
      const tipoCorte = matriz?.tipoCorte || '—';

      html += `
        <div class="matrix-section">
          <div class="matrix-title">
            <span>Matriz: ${tagStr} - ${nomeStr}</span>
            <span style="font-size:12px; font-weight:normal;">(${lista.length} inspeção(ões))</span>
          </div>
          <div class="matrix-tech-info">
            <div><strong>Altura Original:</strong> ${originalH}</div>
            <div><strong>Altura Atual:</strong> ${atualH}</div>
            <div><strong>Altura Mínima:</strong> ${minimaH}</div>
            <div><strong>Retíficas:</strong> ${retificas}</div>
            <div><strong>Pressão:</strong> ${pressao}</div>
            <div><strong>Tipo de Corte:</strong> ${tipoCorte}</div>
          </div>
          <table class="table-inspections">
            <thead>
              <tr>
                <th style="width: 15%;">Data/Hora</th>
                <th style="width: 15%;">Inspetor</th>
                <th style="width: 12%;">Tipo</th>
                <th style="width: 12%;">Resultado</th>
                <th style="width: 26%;">Parâmetros Avaliados</th>
                <th style="width: 20%;">Observações</th>
              </tr>
            </thead>
            <tbody>
      `;

      lista.forEach(ins => {
        const dt = new Intl.DateTimeFormat('pt-BR', { 
          day: '2-digit', month: '2-digit', year: 'numeric', 
          hour: '2-digit', minute: '2-digit' 
        }).format(new Date(ins.dataInspecao));

        let resClass = 'badge-aprovado';
        if (ins.resultado === 'Reprovado') resClass = 'badge-reprovado';
        else if (ins.resultado === 'RequereReparo' || ins.resultado === 'Requer Reparo') resClass = 'badge-reparo';

        const resLabel = ins.resultado === 'RequereReparo' ? 'Requer Reparo' : ins.resultado;

        let chHtml = '';
        let params = {};
        if (ins.parametrosAvaliados) {
          if (typeof ins.parametrosAvaliados === 'string') {
            try { params = JSON.parse(ins.parametrosAvaliados); } catch {}
          } else {
            params = ins.parametrosAvaliados;
          }
        }
        
        if (Object.keys(params).length > 0) {
          chHtml = '<ul class="checklist-list">';
          Object.entries(params).forEach(([k, v]) => {
            const color = v === 'Não Conforme' ? 'color: #721c24; font-weight: bold;' : '';
            chHtml += `<li style="${color}">${k}: ${v}</li>`;
          });
          chHtml += '</ul>';
        } else {
          chHtml = '<em style="color:#888; font-size:10px;">Checklist vazio</em>';
        }

        html += `
          <tr>
            <td>${dt}</td>
            <td>${ins.inspetor}</td>
            <td>${ins.tipoInspecao === 'Periodica' ? 'Periódica' : ins.tipoInspecao === 'PosReparo' ? 'Pós-Reparo' : ins.tipoInspecao}</td>
            <td><span class="badge ${resClass}">${resLabel}</span></td>
            <td>${chHtml}</td>
            <td style="font-size: 11px; color: #555;">${ins.observacoes || '—'}</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;
    });

    html += `
        <div class="footer-note">
          <p>Dacarto Matrizes MES - Relatório Gerencial de Inspeções</p>
        </div>
      </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="page-title">🔍 Controle de Inspeções</h2>
          <p className="page-subtitle">{inspecoes.length} laudo(s) registrado(s)</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleImprimirRelatorio}>📄 Extrair Relatório</button>
          <button className="btn btn-secondary" onClick={() => setModalChecklist(true)}>📋 Criar Checklist</button>
          <button className="btn btn-primary" onClick={() => setModalCadastro(true)}>📋 Nova Inspeção</button>
        </div>
      </div>

      {erro && <div className="alert-strip danger" style={{ marginBottom: 12 }}>⚠️ {erro}</div>}

      <div className="filters-bar">
        <div className="search-input-wrapper" style={{ maxWidth: 360 }}>
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Buscar por TAG ou Inspetor..."
            value={buscaInput} onChange={e => setBuscaInput(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 160 }} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Todos os Tipos</option>
          <option>Inicial</option>
          <option>Periódica</option>
          <option>Pós-Reparo</option>
        </select>
        <select className="form-select" style={{ width: 160 }} value={filtroResultado} onChange={e => setFiltroResultado(e.target.value)}>
          <option value="">Todos os Resultados</option>
          <option>Aprovado</option>
          <option>Requer Reparo</option>
          <option>Reprovado</option>
        </select>
        {(buscaInput || busca || filtroTipo || filtroResultado) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setBuscaInput(''); setBusca(''); setFiltroTipo(''); setFiltroResultado(''); }}>
            ✕ Limpar
          </button>
        )}
      </div>

      <div className="glass-card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : inspecoes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>Nenhuma inspeção encontrada. Clique em <strong>Nova Inspeção</strong> para registrar um laudo.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>TAG Matriz</th>
                  <th>Peça Inspecionada</th>
                  <th>Tipo</th>
                  <th>Data da Inspeção</th>
                  <th>Inspetor</th>
                  <th>Resultado</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {inspecoes.map(item => (
                  <tr key={item.id}>
                    <td className="tag-cell" style={{ cursor: 'pointer' }} onClick={() => setModalDetalhe(item)}>
                      {item.matrizElemento?.tagIdentificacao || 'N/A'}
                    </td>
                    <td style={{ color: 'var(--color-text-primary)' }}>
                      {item.matrizElemento?.nome || '—'}
                    </td>
                    <td style={{ fontSize: 13 }}>{item.tipoInspecao === 'Periodica' ? 'Periódica' : item.tipoInspecao === 'PosReparo' ? 'Pós-Reparo' : item.tipoInspecao}</td>
                    <td style={{ fontSize: 13 }}>{formatDate(item.dataInspecao)}</td>
                    <td style={{ fontSize: 13 }}>{item.inspetor}</td>
                    <td>{resultadoBadge(item.resultado === 'RequereReparo' ? 'Requer Reparo' : item.resultado)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setModalDetalhe(item)} title="Ver Laudo Completo">👁</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setModalEdicao(item)} title="Editar">✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleExcluir(item.id)} title="Excluir">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(modalCadastro || modalEdicao) && (
        <ModalInspecao
          inspecao={modalEdicao}
          matrizes={matrizes}
          onSave={handleSalvar}
          onClose={() => { setModalCadastro(false); setModalEdicao(null); }}
        />
      )}

      {modalDetalhe && (
        <ModalDetalhe
          inspecao={modalDetalhe}
          onClose={() => setModalDetalhe(null)}
        />
      )}

      {modalChecklist && (
        <ModalConfigChecklist 
          matrizes={matrizes}
          onSave={async () => {
            await carregar();
            await carregarMatrizes();
          }}
          onClose={() => setModalChecklist(false)}
        />
      )}
    </>
  );
}
