import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Key, Copy, BarChart3, Trash2, Power, Zap, ExternalLink } from 'lucide-react';
import { useAISSE } from '../hooks/useAISSE';

/**
 * AI Keys Dashboard — Simple & Professional
 */
export default function AIKeys({ user, token, onUpdateUser }) {
  const aiRouterUrl = import.meta.env.VITE_AI_ROUTER_PUBLIC_URL || 'https://ai.markaz-arshy.com/v1';
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchKeys();
  }, [user]);

  // Real-time: update balance via SSE
  const handleBalance = useCallback((balanceUpdate) => {
    if (onUpdateUser && user) {
      onUpdateUser({ ...user, balance: balanceUpdate.balance });
    }
  }, [onUpdateUser, user]);

  useAISSE({ token, onBalance: handleBalance });

  useEffect(() => {
    if (location.state?.modelId) {
      setShowCreate(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchKeys = async () => {
    try {
      // Use /keys/mine to get FULL unmasked keys — mask only for display
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/keys/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApiKeys(await res.json());
    } catch (e) {
      console.error('Error fetching keys:', e);
    } finally {
      setLoading(false);
    }
  };

  // Mask key for display only — full key stays in state for copy
  const maskKey = (key) => {
    if (!key || key.length < 12) return '***';
    return key.slice(0, 8) + '...' + key.slice(-4);
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus API key ini?')) return;
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/keys/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchKeys();
  };

  const handleToggle = async (id, isActive) => {
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/keys/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive }),
    });
    fetchKeys();
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    alert('API Key copied!');
  };

  const copyAll = () => {
    navigator.clipboard.writeText(aiRouterUrl);
    alert('Base URL copied!');
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>🔑 API Keys</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Kelola API key untuk akses AI models</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/dashboard/ai-keys/usage')} className="btn btn-secondary" style={{ padding: '10px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart3 size={15} /> Usage
          </button>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={15} /> Buat Key Baru
          </button>
        </div>
      </div>

      {/* Quick Setup Box */}
      <div style={{
        background: 'rgba(79, 172, 254, 0.04)',
        border: '1px solid rgba(79, 172, 254, 0.15)',
        borderRadius: 'var(--radius-md)',
        padding: '20px 24px',
        marginBottom: '28px',
      }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>⚡ Quick Setup</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '600' }}>Base URL</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <code style={{ fontSize: '13px', color: 'var(--color-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '4px' }}>{aiRouterUrl}</code>
              <button onClick={copyAll} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} title="Copy"><Copy size={13} /> Copy</button>
            </div>
          </div>
        </div>
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(79,172,254,0.1)' }}>
          <button onClick={() => navigate('/docs/ai')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
            Lihat Panduan Lengkap <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {/* Keys Table */}
      {apiKeys.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'rgba(255,255,255,0.015)', borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-color)',
        }}>
          <Key size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.3 }} />
          <p style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>Belum ada API Key</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Buat key baru untuk mulai menggunakan AI models</p>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '13px' }}>
            <Plus size={15} /> Buat API Key
          </button>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Nama</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>API Key</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Kredit</th>
                <th style={{ padding: '14px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((k) => (
                <tr key={k.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>{k.keyName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{k.tier}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                        {maskKey(k.apiKey)}
                      </code>
                      <button onClick={() => copyKey(k.apiKey)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: '2px' }} title="Copy full key"><Copy size={14} /></button>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <span style={{ fontWeight: '600', color: 'var(--color-success)' }}>
                      Rp {Math.ceil(user?.balance || 0).toLocaleString('id-ID')}
                    </span>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Saldo Wallet</div>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: k.isActive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                      color: k.isActive ? '#22c55e' : '#ef4444',
                    }}>
                      {k.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleToggle(k.id, !k.isActive)} title={k.isActive ? 'Disable' : 'Enable'} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', color: k.isActive ? '#f59e0b' : '#22c55e' }}>
                        <Power size={14} />
                      </button>
                      <button onClick={() => handleDelete(k.id)} title="Delete" style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateKeyModal token={token} userBalance={user?.balance || 0} aiRouterUrl={aiRouterUrl} onClose={() => { setShowCreate(false); fetchKeys(); }} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   Create Key Modal — Clean & Simple
   ═══════════════════════════════════════ */
function CreateKeyModal({ token, onClose, userBalance, aiRouterUrl }) {
  const [keyName, setKeyName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!keyName.trim()) return alert('Nama wajib diisi');
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/keys/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ keyName: keyName.trim(), tier: 'ENTERPRISE', initialCredits: 0 }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Key dibuat!\n\n🔑 ${data.apiKey}\n\nBase URL: ${aiRouterUrl}\nModel: code`);
        onClose();
      } else {
        alert(data.error || 'Gagal membuat key');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '28px', maxWidth: '420px', width: '100%', border: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>Buat API Key Baru</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Key ini bisa digunakan di Cursor, Claude Code, dll.</p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Nama Key</label>
          <input type="text" value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Contoh: Cursor Key"
            style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '13px' }} disabled={loading}>Batal</button>
          <button onClick={handleCreate} className="btn btn-primary" style={{ flex: 1, padding: '10px', fontSize: '13px' }} disabled={loading}>
            {loading ? 'Membuat...' : 'Buat Key'}
          </button>
        </div>
      </div>
    </div>
  );
}
