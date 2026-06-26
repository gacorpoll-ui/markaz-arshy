import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, TrendingUp, Cpu, Save, RefreshCw } from 'lucide-react';

export default function AdminAIProviders({ token }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState(null);
  const [editingModel, setEditingModel] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateModelModal, setShowCreateModelModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { fetchProviders(); }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-providers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProviders(Array.isArray(await res.json()) ? await res.json() : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSync9router = async () => {
    const apiKeyPrompt = window.prompt("Masukkan API Key 9router:");
    if (apiKeyPrompt === null) return;
    setSyncing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-sync-9router`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ apiKey: apiKeyPrompt }),
      });
      const data = await res.json();
      alert(res.ok ? data.message : (data.error || 'Gagal'));
      if (res.ok) fetchProviders();
    } catch (e) { alert('Gagal sync: ' + e.message); } finally { setSyncing(false); }
  };

  const apiCall = async (url, method, body) => {
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (res.ok) { fetchProviders(); return true; }
    alert(data.error || 'Gagal');
    return false;
  };

  const handleCreateProvider = async (d) => { const ok = await apiCall(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-providers`, 'POST', d); if (ok) setShowCreateModal(false); };
  const handleEditProvider = async (id, d) => { const ok = await apiCall(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-providers/${id}`, 'PUT', d); if (ok) setEditingProvider(null); };
  const handleCreateModel = async (d) => { const ok = await apiCall(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-models`, 'POST', d); if (ok) setShowCreateModelModal(false); };
  const handleEditModel = async (id, d) => { const ok = await apiCall(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-models/${id}`, 'PUT', d); if (ok) setEditingModel(null); };
  const handleToggleActive = (id, v) => apiCall(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-providers/${id}`, 'PUT', { isActive: v });
  const handleToggleModel = (id, v) => apiCall(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-models/${id}`, 'PUT', { isActive: v });
  const handleDeleteProvider = async (id, name) => { if (!window.confirm(`Hapus "${name}"?`)) return; await apiCall(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-providers/${id}`, 'DELETE'); };
  const handleDeleteModel = async (id, name) => { if (!window.confirm(`Hapus model "${name}"?`)) return; await apiCall(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-models/${id}`, 'DELETE'); };

  if (loading) return <div className="adm-loading"><RefreshCw size={28} className="spin" /> Loading providers...</div>;

  const totalModels = providers.reduce((s, p) => s + p.models.length, 0);
  const activeModels = providers.reduce((s, p) => s + p.models.filter(m => m.isActive).length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="adm-page-header">
        <div>
          <div className="adm-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Cpu size={22} style={{ color: 'var(--accent-primary)' }} /> AI Providers
          </div>
          <div className="adm-page-sub">Kelola provider AI, model, dan harga</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSync9router} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 12 }} disabled={syncing}>
            <RefreshCw size={14} className={syncing ? 'spin' : ''} /> {syncing ? 'Syncing...' : 'Sync 9router'}
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 12 }}>
            <Plus size={14} /> Add Provider
          </button>
        </div>
      </div>

      <div className="adm-stat-grid" style={{ marginBottom: 4 }}>
        {[
          { label: 'Total Providers', value: providers.length, color: 'var(--accent-primary)' },
          { label: 'Total Models', value: totalModels, color: 'var(--accent-primary)' },
          { label: 'Active Models', value: activeModels, color: '#10b981' },
          { label: 'Inactive Models', value: totalModels - activeModels, color: '#ef4444' },
        ].map((s, i) => (
          <div key={i} className="adm-stat-card">
            <div className="adm-stat-label">{s.label}</div>
            <div className="adm-stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {providers.length === 0 && <div className="adm-empty">Belum ada provider. Klik "Add Provider" untuk memulai.</div>}

      {providers.map(provider => (
        <div key={provider.id} className="adm-card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: provider.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {provider.name?.charAt(0) || '?'}
              </div>
              <div>
                <div className="td-name" style={{ fontSize: 16 }}>{provider.name}</div>
                <span className={`adm-badge ${provider.isActive ? 'adm-badge-success' : 'adm-badge-danger'}`}>{provider.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {provider.description && <div className="adm-page-sub" style={{ maxWidth: 300, fontSize: 12, textAlign: 'right' }}>{provider.description}</div>}
              <button onClick={() => handleToggleActive(provider.id, !provider.isActive)} className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 11 }}>{provider.isActive ? 'Disable' : 'Enable'}</button>
              <button onClick={() => setEditingProvider(provider)} className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 11 }}><Edit2 size={12} /> Edit</button>
              <button onClick={() => handleDeleteProvider(provider.id, provider.name)} className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 11 }}><Trash2 size={12} /> Hapus</button>
            </div>
          </div>

          <div style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="adm-card-header-sm" style={{ marginBottom: 0, border: 'none', padding: 0 }}>Models</div>
              <button onClick={() => setShowCreateModelModal({ providerId: provider.id, providerName: provider.name })} className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 11 }}>
                <Plus size={12} /> Add Model
              </button>
            </div>
            {provider.models.length === 0 ? <div className="adm-empty" style={{ padding: '20px' }}>Belum ada model.</div> : (
              <div style={{ overflowX: 'auto' }}>
                <table className="adm-table">
                  <thead><tr><th>Nama</th><th>Model ID</th><th className="td-actions">Input /1K</th><th className="td-actions">Output /1K</th><th className="td-actions">Context</th><th style={{ textAlign: 'center' }}>Status</th><th className="td-actions">Aksi</th></tr></thead>
                  <tbody>
                    {provider.models.map(m => (
                      <tr key={m.id}>
                        <td className="td-name">{m.name}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{m.modelId}</td>
                        <td className="td-amt">Rp {Math.ceil(m.inputPricePer1K * 1000).toLocaleString('id-ID')}</td>
                        <td className="td-amt">Rp {Math.ceil(m.outputPricePer1K * 1000).toLocaleString('id-ID')}</td>
                        <td className="td-amt">{(m.contextWindow / 1000).toFixed(0)}K</td>
                        <td style={{ textAlign: 'center' }}><span className={`adm-badge ${m.isActive ? 'adm-badge-success' : 'adm-badge-danger'}`}>{m.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td className="td-actions">
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditingModel(m)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 10 }}><Edit2 size={10} /> Edit</button>
                            <button onClick={() => handleToggleModel(m.id, !m.isActive)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 10 }}>{m.isActive ? 'Disable' : 'Enable'}</button>
                            <button onClick={() => handleDeleteModel(m.id, m.name)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: 10 }}><Trash2 size={10} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Modals */}
      {showCreateModal && <ProviderFormModal title="Add AI Provider" onClose={() => setShowCreateModal(false)} onSave={handleCreateProvider} />}
      {editingProvider && <ProviderFormModal title="Edit AI Provider" provider={editingProvider} onClose={() => setEditingProvider(null)} onSave={handleEditProvider} />}
      {editingModel && <ModelFormModal title="Edit AI Model" model={editingModel} onClose={() => setEditingModel(null)} onSave={handleEditModel} />}
      {showCreateModelModal && (
        <ModelFormModal
          title={`Add Model to ${showCreateModelModal.providerName}`}
          providerId={showCreateModelModal.providerId}
          onClose={() => setShowCreateModelModal(false)}
          onSave={handleCreateModel}
        />
      )}
    </div>
  );
}

/* ═══ Reusable Modal ═══ */
function Modal({ children, onClose }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="adm-card" style={{ maxWidth: 520, width: '100%', maxHeight: '85vh', overflow: 'auto', padding: 28 }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/* ═══ Provider Form ═══ */
function ProviderFormModal({ title, provider, onClose, onSave }) {
  const [name, setName] = useState(provider?.name || '');
  const [slug, setSlug] = useState(provider?.slug || '');
  const [description, setDescription] = useState(provider?.description || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !slug) { alert('Nama dan Slug wajib diisi'); return; }
    setLoading(true);
    await onSave(provider?.id, { name, slug, description });
    setLoading(false);
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="adm-card-header" style={{ border: 'none', padding: 0, margin: 0 }}>{title}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Nama Provider</label>
          <input type="text" className="form-input" placeholder="OpenAI" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Slug (lowercase)</label>
          <input type="text" className="form-input" placeholder="openai" value={slug} onChange={e => setSlug(e.target.value)} required />
        </div>
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Deskripsi</label>
          <textarea className="form-input" placeholder="Deskripsi provider..." value={description} onChange={e => setDescription(e.target.value)} style={{ minHeight: 60, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1, padding: 12 }} disabled={loading}>Batal</button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: 12 }} disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ═══ Model Form ═══ */
function ModelFormModal({ title, model, providerId, onClose, onSave }) {
  const [name, setName] = useState(model?.name || '');
  const [modelId, setModelId] = useState(model?.modelId || '');
  const [inputPrice, setInputPrice] = useState(model?.inputPricePer1K || '150');
  const [outputPrice, setOutputPrice] = useState(model?.outputPricePer1K || '450');
  const [contextWindow, setContextWindow] = useState(model?.contextWindow || '128000');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !modelId) { alert('Nama dan ID Model wajib diisi'); return; }
    setLoading(true);
    await onSave(model?.id || { providerId, name, modelId, inputPricePer1K: parseFloat(inputPrice), outputPricePer1K: parseFloat(outputPrice), contextWindow: parseInt(contextWindow) });
    setLoading(false);
  };

  const isEdit = !!model;

  return (
    <Modal onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div className="adm-card-header" style={{ border: 'none', padding: 0, margin: 0 }}>{title}</div>
          {isEdit && <div className="adm-page-sub">ID: <code style={{ background: 'var(--bg-muted)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>{model.modelId}</code></div>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="adm-form-grid" style={{ marginBottom: 0 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nama Model</label>
            <input type="text" className="form-input" placeholder="GPT-4o" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Model ID</label>
            <input type="text" className="form-input" style={{ fontFamily: 'monospace' }} placeholder="gpt-4o" value={modelId} onChange={e => setModelId(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Harga Input /1K (Rp)</label>
            <input type="number" step="0.000001" className="form-input" value={inputPrice} onChange={e => setInputPrice(e.target.value)} required />
            {parseFloat(inputPrice) > 0 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>≈ Rp {Math.ceil(parseFloat(inputPrice) * 1000).toLocaleString()} / 1M</span>}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Harga Output /1K (Rp)</label>
            <input type="number" step="0.000001" className="form-input" value={outputPrice} onChange={e => setOutputPrice(e.target.value)} required />
            {parseFloat(outputPrice) > 0 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>≈ Rp {Math.ceil(parseFloat(outputPrice) * 1000).toLocaleString()} / 1M</span>}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Context Window</label>
            <input type="number" className="form-input" placeholder="128000" value={contextWindow} onChange={e => setContextWindow(e.target.value)} required />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{(parseInt(contextWindow) / 1000).toFixed(0)}K tokens</span>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">&nbsp;</label>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 11 }} disabled={loading}>
              <Save size={14} /> {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" style={{ width: '100%', padding: 11 }} disabled={loading}>Batal</button>
        </div>
      </form>
    </Modal>
  );
}
