import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, ArrowUp, ArrowDown, GripVertical, Copy, ToggleLeft, ToggleRight, Layers, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Admin AI Combos Management
 * Create model combos: a combo is a named model that contains a list of fallback models
 * e.g. "gemini-3.5-flash-high" → ["google-ai/gemini-2.5-flash", "openai/gpt-4o-mini", ...]
 */
export default function AdminCombos({ token }) {
  const [combos, setCombos] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [expandedCombo, setExpandedCombo] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [combosRes, providersRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-combos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-providers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const combosData = await combosRes.json();
      const providersData = await providersRes.json();
      setCombos(Array.isArray(combosData) ? combosData : []);
      setProviders(Array.isArray(providersData) ? providersData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-combos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchData();
        setShowCreateModal(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal membuat combo');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-combos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchData();
        setEditingCombo(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal update combo');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus combo ini?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ai-combos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCombos(combos.filter(c => c.id !== id));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await handleUpdate(id, { isActive: !isActive });
    } catch (error) {
      console.error('Error toggling combo:', error);
    }
  };

  // Get all available models from providers
  const getAllModels = () => {
    return providers
      .filter(p => p.isActive)
      .flatMap(p =>
        (p.models || [])
          .filter(m => m.isActive)
          .map(m => ({
            value: `${p.slug}/${m.modelId}`,
            label: `${m.name}`,
            provider: p.name,
            providerSlug: p.slug,
            modelId: m.modelId,
          }))
      );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.3 }}>⏳</div>
        <p>Memuat combos...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            <Layers size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            AI Combos
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Buat model combos dengan fallback — kumpulkan beberapa model jadi satu
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 20px', borderRadius: '10px', border: 'none',
            background: 'var(--color-primary)', color: 'white',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          }}
        >
          <Plus size={16} /> Buat Combo
        </button>
      </div>

      {/* Info Card */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.05)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        borderRadius: '12px',
        padding: '16px',
      }}>
        <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#6366f1', marginBottom: '6px' }}>
          💡 Apa itu Combo?
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Combo adalah model virtual yang mengumpulkan beberapa model dari berbagai provider. 
          Nama combo (misal: <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>gemini-3.5-flash-high</code>) 
          akan digunakan sebagai model ID oleh user. Router otomatis mencoba model pertama, jika gagal fallback ke model berikutnya.
        </p>
      </div>

      {/* Combos List */}
      {combos.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'var(--glass-bg)', border: '1px solid var(--border-color)',
          borderRadius: '16px',
        }}>
          <Layers size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Belum ada combos
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Buat combo pertama untuk menggabungkan beberapa model
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', borderRadius: '10px', border: 'none',
              background: 'var(--color-primary)', color: 'white',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Buat Combo
          </button>
        </div>
      ) : (
        combos.map(combo => (
          <ComboCard
            key={combo.id}
            combo={combo}
            allModels={getAllModels()}
            isExpanded={expandedCombo === combo.id}
            onToggle={() => setExpandedCombo(expandedCombo === combo.id ? null : combo.id)}
            onEdit={() => setEditingCombo(combo)}
            onDelete={() => handleDelete(combo.id)}
            onToggleActive={() => handleToggleActive(combo.id, combo.isActive)}
          />
        ))
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingCombo) && (
        <ComboFormModal
          combo={editingCombo}
          allModels={getAllModels()}
          onSave={(data) => {
            if (editingCombo) {
              handleUpdate(editingCombo.id, data);
            } else {
              handleCreate(data);
            }
          }}
          onClose={() => {
            setShowCreateModal(false);
            setEditingCombo(null);
          }}
        />
      )}
    </div>
  );
}

function ComboCard({ combo, allModels, isExpanded, onToggle, onEdit, onDelete, onToggleActive }) {
  const models = Array.isArray(combo.models) ? combo.models : [];
  
  const getProviderColor = (slug) => {
    const colors = { 'openai': '#10a37f', 'anthropic': '#d97757', 'google-ai': '#4285f4' };
    return colors[slug] || '#4facfe';
  };

  const getModelLabel = (modelValue) => {
    const found = allModels.find(m => m.value === modelValue);
    if (found) return `${found.label} (${found.modelId})`;
    return modelValue;
  };

  return (
    <div style={{
      background: 'var(--glass-bg)',
      border: '1px solid var(--border-color)',
      borderRadius: '14px',
      overflow: 'hidden',
      transition: 'all 0.2s',
    }}>
      {/* Header Row */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          cursor: 'pointer',
          background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Layers size={18} style={{ color: '#6366f1' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <code style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {combo.displayName || combo.name}
              </code>
              <code style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                ID: {combo.name}
              </code>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <span style={{
                padding: '2px 8px', borderRadius: '4px',
                background: combo.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: combo.isActive ? '#22c55e' : '#ef4444',
                fontSize: '10px', fontWeight: '600',
              }}>
                {combo.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {models.length} model{models.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleActive(); }}
            style={{
              padding: '4px 10px', borderRadius: '6px', border: 'none',
              background: combo.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: combo.isActive ? '#22c55e' : '#ef4444',
              fontSize: '11px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            {combo.isActive ? 'Aktif' : 'Nonaktif'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            style={{
              padding: '6px', borderRadius: '6px', border: 'none',
              background: 'rgba(79, 172, 254, 0.1)', color: '#4facfe',
              cursor: 'pointer',
            }}
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{
              padding: '6px', borderRadius: '6px', border: 'none',
              background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={14} />
          </button>
          {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{
          padding: '0 20px 20px',
          borderTop: '1px solid var(--border-color)',
        }}>
          {/* Combo description */}
          {combo.description && (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '12px 0', lineHeight: '1.5' }}>
              {combo.description}
            </p>
          )}

          {/* Models list */}
          <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
            Models (fallback order)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {models.map((modelValue, idx) => {
              const parts = modelValue.split('/');
              const providerSlug = parts[0];
              const modelId = parts.slice(1).join('/');
              return (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 12px', borderRadius: '8px',
                  background: 'rgba(0,0,0,0.03)',
                }}>
                  <span style={{
                    width: '20px', height: '20px', borderRadius: '5px',
                    background: getProviderColor(providerSlug),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '10px', fontWeight: '700', flexShrink: 0,
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{
                    padding: '2px 6px', borderRadius: '4px',
                    background: `${getProviderColor(providerSlug)}15`,
                    color: getProviderColor(providerSlug),
                    fontSize: '10px', fontWeight: '600',
                  }}>
                    {providerSlug}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {getModelLabel(modelValue)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ComboFormModal({ combo, allModels, onSave, onClose }) {
  const [name, setName] = useState(combo?.name || '');
  const [displayName, setDisplayName] = useState(combo?.displayName || '');
  const [description, setDescription] = useState(combo?.description || '');
  const [selectedModels, setSelectedModels] = useState(combo?.models || []);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [nameError, setNameError] = useState('');

  const getProviderColor = (slug) => {
    const colors = { 'openai': '#10a37f', 'anthropic': '#d97757', 'google-ai': '#4285f4' };
    return colors[slug] || '#4facfe';
  };

  const validateName = (value) => {
    if (!value.trim()) { setNameError('Wajib diisi'); return false; }
    if (!/^[a-zA-Z0-9_.\-]+$/.test(value.trim())) { setNameError('Hanya huruf, angka, - _ .'); return false; }
    setNameError('');
    return true;
  };

  const handleAddModel = (modelValue) => {
    if (!selectedModels.includes(modelValue)) {
      setSelectedModels([...selectedModels, modelValue]);
    }
  };

  const handleRemoveModel = (index) => {
    setSelectedModels(selectedModels.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newModels = [...selectedModels];
    [newModels[index - 1], newModels[index]] = [newModels[index], newModels[index - 1]];
    setSelectedModels(newModels);
  };

  const handleMoveDown = (index) => {
    if (index === selectedModels.length - 1) return;
    const newModels = [...selectedModels];
    [newModels[index], newModels[index + 1]] = [newModels[index + 1], newModels[index]];
    setSelectedModels(newModels);
  };

  const handleSave = () => {
    if (!validateName(name)) return;
    onSave({
      name: name.trim(),
      displayName: displayName.trim() || name.trim(),
      description: description.trim() || null,
      models: selectedModels,
    });
  };

  const availableModels = allModels.filter(m => !selectedModels.includes(m.value));

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px',
    }}>
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border-color)',
        borderRadius: '16px', width: '100%', maxWidth: '580px',
        maxHeight: '85vh', overflow: 'auto',
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border-color)',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            {combo ? 'Edit Combo' : 'Buat Combo Baru'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Combo Name (Model ID) */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Combo Name (Model ID)
            </label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); validateName(e.target.value); }}
              placeholder="gemini-3.5-flash-high"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                border: nameError ? '1px solid #ef4444' : '1px solid var(--border-color)',
                background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)',
                fontSize: '13px', fontFamily: 'monospace', boxSizing: 'border-box',
              }}
            />
            {nameError && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{nameError}</p>}
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              ID yang digunakan user sebagai model ID. Hanya huruf, angka, - _ .
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Display Name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Gemini 3.5 Flash High"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)',
                fontSize: '13px', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Deskripsi
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kumpulan model Gemini terbaik dengan fallback ke OpenAI..."
              rows={2}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)',
                fontSize: '13px', boxSizing: 'border-box', resize: 'vertical',
              }}
            />
          </div>

          {/* Models List */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Models (fallback order — model pertama diprioritaskan)
            </label>

            {selectedModels.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '24px',
                border: '1px dashed var(--border-color)',
                borderRadius: '10px', background: 'rgba(0,0,0,0.02)',
              }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Belum ada model. Klik "Tambah Model" di bawah.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {selectedModels.map((modelValue, idx) => {
                  const parts = modelValue.split('/');
                  const providerSlug = parts[0];
                  const modelId = parts.slice(1).join('/');
                  const found = allModels.find(m => m.value === modelValue);
                  return (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 10px', borderRadius: '8px',
                      background: 'rgba(0,0,0,0.03)',
                    }}>
                      <span style={{
                        width: '20px', height: '20px', borderRadius: '5px',
                        background: getProviderColor(providerSlug),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '10px', fontWeight: '700', flexShrink: 0,
                      }}>
                        {idx + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {found?.label || modelId}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                          {modelValue}
                        </span>
                      </div>
                      <button onClick={() => handleMoveUp(idx)} disabled={idx === 0} style={{ background: 'none', border: 'none', color: idx === 0 ? 'var(--border-color)' : 'var(--text-muted)', cursor: idx === 0 ? 'default' : 'pointer', padding: '2px' }}>
                        <ArrowUp size={12} />
                      </button>
                      <button onClick={() => handleMoveDown(idx)} disabled={idx === selectedModels.length - 1} style={{ background: 'none', border: 'none', color: idx === selectedModels.length - 1 ? 'var(--border-color)' : 'var(--text-muted)', cursor: idx === selectedModels.length - 1 ? 'default' : 'pointer', padding: '2px' }}>
                        <ArrowDown size={12} />
                      </button>
                      <button onClick={() => handleRemoveModel(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}>
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Model */}
            <button
              onClick={() => setShowModelPicker(true)}
              style={{
                width: '100%', marginTop: '8px', padding: '10px',
                border: '1px dashed var(--border-color)',
                borderRadius: '8px', background: 'transparent',
                color: 'var(--color-primary)', fontSize: '12px', fontWeight: '600',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
              }}
            >
              <Plus size={14} /> Tambah Model
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', paddingTop: '8px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px',
                border: '1px solid var(--border-color)', background: 'transparent',
                color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || !!nameError || selectedModels.length === 0}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px',
                border: 'none', background: (!name.trim() || !!nameError || selectedModels.length === 0) ? 'var(--border-color)' : 'var(--color-primary)',
                color: (!name.trim() || !!nameError || selectedModels.length === 0) ? 'var(--text-muted)' : 'white',
                fontSize: '13px', fontWeight: '600', cursor: (!name.trim() || !!nameError || selectedModels.length === 0) ? 'default' : 'pointer',
              }}
            >
              {combo ? 'Simpan' : 'Buat Combo'}
            </button>
          </div>
        </div>
      </div>

      {/* Model Picker Modal */}
      {showModelPicker && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1001, padding: '20px',
        }}>
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--border-color)',
            borderRadius: '16px', width: '100%', maxWidth: '480px',
            maxHeight: '70vh', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
            }}>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Pilih Model
              </h4>
              <button onClick={() => setShowModelPicker(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
              {availableModels.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Semua model sudah ditambahkan
                </p>
              ) : (
                availableModels.map((model) => (
                  <button
                    key={model.value}
                    onClick={() => { handleAddModel(model.value); setShowModelPicker(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      border: 'none', background: 'transparent',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{
                      padding: '2px 8px', borderRadius: '4px',
                      background: `${getProviderColor(model.providerSlug)}15`,
                      color: getProviderColor(model.providerSlug),
                      fontSize: '10px', fontWeight: '600', flexShrink: 0,
                    }}>
                      {model.provider}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{model.label}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{model.modelId}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
