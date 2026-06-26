import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, DollarSign, TrendingUp } from 'lucide-react';

/**
 * Admin AI Providers Management
 * Manage AI providers (OpenAI, Anthropic, Google AI) and their models
 */
export default function AdminAIProviders({ token }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState(null);
  const [editingModel, setEditingModel] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateModelModal, setShowCreateModelModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleSync9router = async () => {
    const apiKeyPrompt = window.prompt("Masukkan API Key 9router Anda:");
    if (apiKeyPrompt === null) return; // Cancelled
    
    const routerUrlPrompt = window.prompt("Masukkan URL 9router (opsional):", "http://localhost:20128");
    if (routerUrlPrompt === null) return; // Cancelled

    setSyncing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-sync-9router`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          apiKey: apiKeyPrompt,
          routerUrl: routerUrlPrompt
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Berhasil mensinkronisasi model dari 9router');
        fetchProviders();
      } else {
        alert(data.error || 'Gagal melakukan sinkronisasi');
      }
    } catch (error) {
      console.error('Error syncing 9router:', error);
      alert('Gagal melakukan sinkronisasi. Periksa koneksi backend.');
    } finally {
      setSyncing(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-providers`, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
      });
      const data = await response.json();
      setProviders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvider = async (providerData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-providers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(providerData),
      });

      if (response.ok) {
        alert('Provider created successfully');
        setShowCreateModal(false);
        fetchProviders();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create provider');
      }
    } catch (error) {
      console.error('Error creating provider:', error);
      alert('Failed to create provider');
    }
  };

  const handleCreateModel = async (modelData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(modelData),
      });

      if (response.ok) {
        alert('Model created successfully');
        setShowCreateModelModal(false);
        fetchProviders();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create model');
      }
    } catch (error) {
      console.error('Error creating model:', error);
      alert('Failed to create model');
    }
  };

  const handleEditProvider = async (providerId, providerData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-providers/${providerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(providerData),
      });

      if (response.ok) {
        alert('Provider updated successfully');
        setEditingProvider(null);
        fetchProviders();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update provider');
      }
    } catch (error) {
      console.error('Error updating provider:', error);
      alert('Failed to update provider');
    }
  };

  const handleEditModel = async (modelId, modelData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-models/${modelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(modelData),
      });

      if (response.ok) {
        alert('Model updated successfully');
        setEditingModel(null);
        fetchProviders();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update model');
      }
    } catch (error) {
      console.error('Error updating model:', error);
      alert('Failed to update model');
    }
  };

  const handleToggleActive = async (providerId, isActive) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-providers/${providerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Provider berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
        fetchProviders();
      } else {
        alert(data.error || 'Gagal mengupdate provider');
      }
    } catch (error) {
      console.error('Error toggling provider:', error);
      alert('Gagal mengupdate provider. Periksa koneksi.');
    }
  };

  const handleToggleModel = async (modelId, isActive) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-models/${modelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Model berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
        fetchProviders();
      } else {
        alert(data.error || 'Gagal mengupdate model');
      }
    } catch (error) {
      console.error('Error toggling model:', error);
      alert('Gagal mengupdate model. Periksa koneksi.');
    }
  };

  const handleDeleteProvider = async (providerId, providerName) => {
    if (!window.confirm(`Hapus provider "${providerName}" beserta semua model di dalamnya?`)) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-providers/${providerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Provider berhasil dihapus');
        fetchProviders();
      } else {
        alert(data.error || 'Gagal menghapus provider');
      }
    } catch (error) {
      console.error('Error deleting provider:', error);
      alert('Gagal menghapus provider');
    }
  };

  const handleDeleteModel = async (modelId, modelName) => {
    if (!window.confirm(`Hapus model "${modelName}"?`)) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-models/${modelId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Model berhasil dihapus');
        fetchProviders();
      } else {
        alert(data.error || 'Gagal menghapus model');
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      alert('Gagal menghapus model');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
            AI Providers Management
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Manage AI providers, models, and pricing
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSync9router}
            className="btn btn-secondary"
            style={{ padding: '12px 24px' }}
            disabled={syncing}
          >
            {syncing ? 'Syncing...' : 'Sync from 9router'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ padding: '12px 24px' }}
          >
            <Plus size={18} />
            Add Provider
          </button>
        </div>
      </div>

      {/* Providers List */}
      {providers.map(provider => (
        <div key={provider.id} className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
          {/* Provider Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700' }}>{provider.name}</h2>
              <div 
                className="badge"
                style={{ 
                  background: provider.isActive ? '#22c55e' : '#6b7280',
                  color: 'white',
                }}
              >
                {provider.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleToggleActive(provider.id, !provider.isActive)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                {provider.isActive ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={() => setEditingProvider(provider)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit2 size={14} />
                Edit
              </button>
              <button
                onClick={() => handleDeleteProvider(provider.id, provider.name)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
              >
                <Trash2 size={14} />
                Hapus
              </button>
            </div>
          </div>

          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            {provider.description || 'No description'}
          </p>

          {/* Models Table */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Models</h3>
            <button
              onClick={() => setShowCreateModelModal({ providerId: provider.id, providerName: provider.name })}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} />
              Add Model
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)' }}>Nama Model</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)' }}>ID Model</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>Harga Input / 1M</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>Harga Output / 1M</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>Context</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {provider.models.map(model => (
                  <tr key={model.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{model.name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '12px' }}>
                      {model.modelId}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>
                      Rp {Math.ceil(model.inputPricePer1K * 1000).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>
                      Rp {Math.ceil(model.outputPricePer1K * 1000).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>
                      {(model.contextWindow / 1000).toFixed(0)}K
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div 
                        className="badge"
                        style={{ 
                          background: model.isActive ? '#22c55e' : '#6b7280',
                          color: 'white',
                          fontSize: '11px',
                          display: 'inline-block',
                        }}
                      >
                        {model.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          onClick={() => setEditingModel(model)}
                          className="btn btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit2 size={11} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleModel(model.id, !model.isActive)}
                          className="btn btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '11px' }}
                        >
                          {model.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDeleteModel(model.id, model.name)}
                          className="btn btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '11px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '3px' }}
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Stats Summary */}
      <div className="glass-card" style={{ padding: '24px', marginTop: '30px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>
          <TrendingUp size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          AI Router Statistics
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Providers</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-primary)' }}>
              {providers.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Models</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-primary)' }}>
              {providers.reduce((sum, p) => sum + p.models.length, 0)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Active Models</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#22c55e' }}>
              {providers.reduce((sum, p) => sum + p.models.filter(m => m.isActive).length, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Create Provider Modal */}
      {showCreateModal && (
        <CreateProviderModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateProvider}
        />
      )}

      {/* Edit Provider Modal */}
      {editingProvider && (
        <EditProviderModal
          provider={editingProvider}
          onClose={() => setEditingProvider(null)}
          onSave={handleEditProvider}
        />
      )}

      {/* Edit Model Modal */}
      {editingModel && (
        <EditModelModal
          model={editingModel}
          onClose={() => setEditingModel(null)}
          onSave={handleEditModel}
        />
      )}

      {/* Create Model Modal */}
      {showCreateModelModal && (
        <CreateModelModal
          providerId={showCreateModelModal.providerId}
          providerName={showCreateModelModal.providerName}
          onClose={() => setShowCreateModelModal(false)}
          onSave={handleCreateModel}
        />
      )}
    </div>
  );
}

/**
 * EditModelModal Component — Robust version
 */
function EditModelModal({ model, onClose, onSave }) {
  const [name, setName] = useState(model.name || '');
  const [modelId, setModelId] = useState(model.modelId || '');
  const [inputPrice, setInputPrice] = useState(model.inputPricePer1K || 0);
  const [outputPrice, setOutputPrice] = useState(model.outputPricePer1K || 0);
  const [contextWindow, setContextWindow] = useState(model.contextWindow || 0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Nama model wajib diisi';
    if (!modelId.trim()) errs.modelId = 'Model ID wajib diisi';
    if (parseFloat(inputPrice) < 0) errs.inputPrice = 'Harga tidak boleh negatif';
    if (parseFloat(outputPrice) < 0) errs.outputPrice = 'Harga tidak boleh negatif';
    if (parseInt(contextWindow) < 0) errs.contextWindow = 'Context window tidak boleh negatif';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSave(model.id, {
        name: name.trim(),
        modelId: modelId.trim(),
        inputPricePer1K: parseFloat(inputPrice),
        outputPricePer1K: parseFloat(outputPrice),
        contextWindow: parseInt(contextWindow),
      });
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    }
    setLoading(false);
  };

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '10px 12px',
    background: 'var(--bg-muted)',
    border: `1px solid ${hasError ? '#ef4444' : 'var(--border-default)'}`,
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '13px',
    boxSizing: 'border-box',
    outline: 'none',
  });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--bg-muted)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px',
    }}>
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: '16px', padding: '28px',
        maxWidth: '520px', width: '100%', maxHeight: '85vh', overflow: 'auto',
        border: '1px solid var(--border-default)',
        boxShadow: '0 20px 60px var(--bg-muted)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Edit Model AI</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              ID: <code style={{ background: 'var(--bg-muted)', padding: '2px 6px', borderRadius: '4px' }}>{model.modelId}</code>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Nama Model
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="GPT-4o"
              style={inputStyle(errors.name)}
            />
            {errors.name && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
          </div>

          {/* Model ID */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Model ID (API name)
            </label>
            <input
              type="text"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder="gpt-4o"
              style={{ ...inputStyle(errors.modelId), fontFamily: 'monospace' }}
            />
            {errors.modelId && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.modelId}</span>}
          </div>

          {/* Price Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Harga Input / 1K Token (Rp)
              </label>
              <input
                type="number"
                step="0.000001"
                value={inputPrice}
                onChange={(e) => setInputPrice(e.target.value)}
                style={inputStyle(errors.inputPrice)}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                ≈ Rp {Math.ceil(inputPrice * 1000).toLocaleString('id-ID')} / 1M
              </span>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Harga Output / 1K Token (Rp)
              </label>
              <input
                type="number"
                step="0.000001"
                value={outputPrice}
                onChange={(e) => setOutputPrice(e.target.value)}
                style={inputStyle(errors.outputPrice)}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                ≈ Rp {Math.ceil(outputPrice * 1000).toLocaleString('id-ID')} / 1M
              </span>
            </div>
          </div>

          {/* Context Window */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Context Window (Tokens)
            </label>
            <input
              type="number"
              value={contextWindow}
              onChange={(e) => setContextWindow(e.target.value)}
              placeholder="128000"
              style={inputStyle(errors.contextWindow)}
            />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              {(contextWindow / 1000).toFixed(0)}K tokens
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '11px', borderRadius: '10px',
                border: '1px solid var(--border-default)', background: 'transparent',
                color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              }}
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              style={{
                flex: 2, padding: '11px', borderRadius: '10px',
                border: 'none', background: 'var(--color-primary)', color: 'white',
                fontSize: '13px', fontWeight: '600', cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : '💾 Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * EditProviderModal Component
 */
function EditProviderModal({ provider, onClose, onSave }) {
  const [name, setName] = useState(provider.name || '');
  const [slug, setSlug] = useState(provider.slug || '');
  const [description, setDescription] = useState(provider.description || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !slug) {
      alert('Nama dan Slug wajib diisi');
      return;
    }
    setLoading(true);
    await onSave(provider.id, { name, slug, description });
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'var(--bg-muted)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        padding: '30px',
        maxWidth: '500px',
        width: '100%',
        border: '1px solid var(--border-default)',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Edit AI Provider</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Nama Provider</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-muted)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Slug (lowercase, no spaces)</label>
            <input
              type="text"
              className="form-input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-muted)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Deskripsi</label>
            <textarea
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-muted)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '12px', cursor: 'pointer' }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, padding: '12px', cursor: 'pointer' }}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * CreateProviderModal Component
 */
function CreateProviderModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !slug) {
      alert('Nama dan Slug wajib diisi');
      return;
    }
    setLoading(true);
    await onSave({ name, slug, description });
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'var(--bg-muted)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        padding: '30px',
        maxWidth: '500px',
        width: '100%',
        border: '1px solid var(--border-default)',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Add AI Provider</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Nama Provider</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. OpenAI"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-muted)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Slug (lowercase, no spaces)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. openai"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-muted)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Deskripsi</label>
            <textarea
              className="form-input"
              placeholder="Deskripsi provider..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-muted)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '12px', cursor: 'pointer' }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, padding: '12px', cursor: 'pointer' }}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Provider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
/**
 * CreateModelModal Component
 */
function CreateModelModal({ providerId, providerName, onClose, onSave }) {
  const [name, setName] = useState('');
  const [modelId, setModelId] = useState('');
  const [inputPrice, setInputPrice] = useState('150');
  const [outputPrice, setOutputPrice] = useState('450');
  const [contextWindow, setContextWindow] = useState('128000');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !modelId) {
      alert('Nama dan ID Model wajib diisi');
      return;
    }
    setLoading(true);
    await onSave({
      providerId,
      name,
      modelId,
      inputPricePer1K: parseFloat(inputPrice),
      outputPricePer1K: parseFloat(outputPrice),
      contextWindow: parseInt(contextWindow),
    });
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--bg-muted)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: '20px',
    }}>
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
        padding: '30px', maxWidth: '550px', width: '100%',
        border: '1px solid var(--border-default)',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Add AI Model</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Provider: <span style={{ color: 'var(--color-primary)' }}>{providerName}</span>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Nama Model</label>
            <input
              type="text" className="form-input" placeholder="e.g. GPT-4o"
              value={name} onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-muted)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Model ID (9router/API name)</label>
            <input
              type="text" className="form-input" placeholder="e.g. gpt-4o"
              value={modelId} onChange={(e) => setModelId(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-muted)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Harga Input / 1K Token (Rp)</label>
              <input
                type="number" step="0.000001" className="form-input"
                value={inputPrice} onChange={(e) => setInputPrice(e.target.value)}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-muted)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Est: Rp {Math.ceil(parseFloat(inputPrice || 0) * 1000).toLocaleString('id-ID')} / 1M
              </span>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Harga Output / 1K Token (Rp)</label>
              <input
                type="number" step="0.000001" className="form-input"
                value={outputPrice} onChange={(e) => setOutputPrice(e.target.value)}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-muted)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Est: Rp {Math.ceil(parseFloat(outputPrice || 0) * 1000).toLocaleString('id-ID')} / 1M
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Context Window (Tokens)</label>
            <input
              type="number" className="form-input"
              value={contextWindow} onChange={(e) => setContextWindow(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-muted)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary"
              style={{ flex: 1, padding: '12px', cursor: 'pointer' }} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary"
              style={{ flex: 1, padding: '12px', cursor: 'pointer' }} disabled={loading}>
              {loading ? 'Creating...' : 'Create Model'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
