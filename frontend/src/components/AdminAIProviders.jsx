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
    const apiKeyPrompt = window.prompt("Masukkan API Key 9router Anda:", "sk-576a1c43755b51a6-bnts4h-1428de35");
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
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                <Edit2 size={16} />
                Edit
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
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
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
                  <tr key={model.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{model.name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '12px' }}>
                      {model.modelId}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>
                      Rp {Math.ceil(model.inputPricePerToken * 1000 * 15000).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>
                      Rp {Math.ceil(model.outputPricePerToken * 1000 * 15000).toLocaleString('id-ID')}
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
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => setEditingModel(model)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleModel(model.id, !model.isActive)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          {model.isActive ? 'Disable' : 'Enable'}
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
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-primary)' }}>
              {providers.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Models</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-primary)' }}>
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
 * EditModelModal Component
 */
function EditModelModal({ model, onClose, onSave }) {
  const [name, setName] = useState(model.name || '');
  const [modelId, setModelId] = useState(model.modelId || '');
  const [inputPrice, setInputPrice] = useState(model.inputPricePerToken || 0);
  const [outputPrice, setOutputPrice] = useState(model.outputPricePerToken || 0);
  const [contextWindow, setContextWindow] = useState(model.contextWindow || 0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !modelId) {
      alert('Nama dan ID Model wajib diisi');
      return;
    }
    setLoading(true);
    await onSave(model.id, {
      name,
      modelId,
      inputPricePerToken: parseFloat(inputPrice),
      outputPricePerToken: parseFloat(outputPrice),
      contextWindow: parseInt(contextWindow),
    });
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
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
        border: '1px solid var(--border-color)',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Edit Model AI</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Nama Model</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Model ID (9router/API name)</label>
            <input
              type="text"
              className="form-input"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Harga Input / 1K Token ($ USD)</label>
              <input
                type="number"
                step="0.000001"
                className="form-input"
                value={inputPrice}
                onChange={(e) => setInputPrice(e.target.value)}
                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Est: Rp {Math.ceil(inputPrice * 1000 * 15000).toLocaleString('id-ID')} / 1M
              </span>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Harga Output / 1K Token ($ USD)</label>
              <input
                type="number"
                step="0.000001"
                className="form-input"
                value={outputPrice}
                onChange={(e) => setOutputPrice(e.target.value)}
                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Est: Rp {Math.ceil(outputPrice * 1000 * 15000).toLocaleString('id-ID')} / 1M
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Context Window (Tokens)</label>
            <input
              type="number"
              className="form-input"
              value={contextWindow}
              onChange={(e) => setContextWindow(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              required
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
      background: 'rgba(0, 0, 0, 0.7)',
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
        border: '1px solid var(--border-color)',
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
              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
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
              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Deskripsi</label>
            <textarea
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', minHeight: '80px', resize: 'vertical' }}
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
      background: 'rgba(0, 0, 0, 0.7)',
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
        border: '1px solid var(--border-color)',
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
              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
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
              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
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
              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', minHeight: '80px', resize: 'vertical' }}
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
  const [inputPrice, setInputPrice] = useState('0.00001');
  const [outputPrice, setOutputPrice] = useState('0.00003');
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
      inputPricePerToken: parseFloat(inputPrice),
      outputPricePerToken: parseFloat(outputPrice),
      contextWindow: parseInt(contextWindow),
    });
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: '20px',
    }}>
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
        padding: '30px', maxWidth: '550px', width: '100%',
        border: '1px solid var(--border-color)',
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
              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Model ID (9router/API name)</label>
            <input
              type="text" className="form-input" placeholder="e.g. gpt-4o"
              value={modelId} onChange={(e) => setModelId(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Harga Input / 1K Token ($ USD)</label>
              <input
                type="number" step="0.000001" className="form-input"
                value={inputPrice} onChange={(e) => setInputPrice(e.target.value)}
                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Est: Rp {Math.ceil(parseFloat(inputPrice || 0) * 1000 * 15000).toLocaleString('id-ID')} / 1M
              </span>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Harga Output / 1K Token ($ USD)</label>
              <input
                type="number" step="0.000001" className="form-input"
                value={outputPrice} onChange={(e) => setOutputPrice(e.target.value)}
                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Est: Rp {Math.ceil(parseFloat(outputPrice || 0) * 1000 * 15000).toLocaleString('id-ID')} / 1M
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Context Window (Tokens)</label>
            <input
              type="number" className="form-input"
              value={contextWindow} onChange={(e) => setContextWindow(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
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
