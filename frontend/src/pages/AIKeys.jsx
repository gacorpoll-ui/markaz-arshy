import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Key, AlertCircle, ArrowRight } from 'lucide-react';
import AIKeyCard from '../components/AIKeyCard';

/**
 * AI Keys Management Page - User can view and manage their API keys
 */
export default function AIKeys({ user, token }) {
  const aiRouterUrl = import.meta.env.VITE_AI_ROUTER_PUBLIC_URL || 'https://ai.markaz-arshy.com/v1';
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [preselectedModel, setPreselectedModel] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchApiKeys();
  }, [user]);

  useEffect(() => {
    if (location.state && location.state.modelId) {
      setPreselectedModel({
        id: location.state.modelId,
        name: location.state.modelName
      });
      setShowCreateModal(true);
      // Clean up state so it doesn't reopen on reload
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setApiKeys(data);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = (key) => {
    setSelectedKey(key);
    setShowTopUpModal(true);
  };

  const handleDelete = async (keyId) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/keys/${keyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert('API key deleted successfully');
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      alert('Failed to delete API key');
    }
  };

  const handleToggleActive = async (keyId, isActive) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/keys/${keyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        alert(`API key ${isActive ? 'enabled' : 'disabled'} successfully`);
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Error updating API key:', error);
      alert('Failed to update API key');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        Loading API keys...
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-title)',
              fontSize: '32px',
              fontWeight: '700',
              marginBottom: '8px',
            }}>
              My API Keys
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Manage your AI Router API keys and credits
            </p>
          </div>
          <button
            onClick={() => { setPreselectedModel(null); setShowCreateModal(true); }}
            className="btn btn-primary"
            style={{ padding: '12px 24px' }}
          >
            <Plus size={18} />
            Create New Key
          </button>
        </div>

        {/* Info Banner */}
        <div style={{
          background: 'rgba(79, 172, 254, 0.05)',
          border: '1px solid rgba(79, 172, 254, 0.15)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}>
          <AlertCircle size={20} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Keep your API keys secure!</strong> Never share your keys publicly. 
            You can create multiple keys for different projects and revoke them anytime.
          </div>
        </div>
      </div>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-color)',
        }}>
          <Key size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.3 }} />
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
            No API Keys Yet
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Create your first API key to start using AI models
          </p>
          <button
            onClick={() => { setPreselectedModel(null); setShowCreateModal(true); }}
            className="btn btn-primary"
            style={{ padding: '12px 32px' }}
          >
            <Plus size={18} />
            Create API Key
          </button>
        </div>
      ) : (
        <div>
          {apiKeys.map(key => (
            <AIKeyCard
              key={key.id}
              apiKey={key}
              onTopUp={handleTopUp}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Tutorial & Integration Guide */}
      <div 
        className="glass-card" 
        style={{ 
          padding: '30px', 
          marginTop: '40px', 
          border: '1px solid rgba(79, 172, 254, 0.2)',
          background: 'rgba(255, 255, 255, 0.01)'
        }}
      >
        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ padding: '6px', background: 'rgba(79, 172, 254, 0.1)', borderRadius: '6px', display: 'inline-flex' }}>
            <Key size={18} style={{ color: 'var(--color-primary)' }} />
          </span>
          Panduan Integrasi & Tutorial Penggunaan
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          {/* Base URL & Client Config */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
              1. Konfigurasi API
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
              Hubungkan alat bantu koding Anda (seperti Cursor, Cline, VSCode, atau SDK OpenAI) ke AI Router Markaz-Arshy dengan setelan berikut.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                API Base URL (Gateway)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={aiRouterUrl} 
                  className="form-input" 
                  style={{ fontFamily: 'monospace', fontSize: '13px', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', flex: 1 }} 
                />
                <button 
                  onClick={() => { navigator.clipboard.writeText(aiRouterUrl); alert("Copied Base URL!"); }}
                  className="btn btn-secondary" 
                  style={{ padding: '0 16px', height: '42px', fontSize: '13px' }}
                >
                  Copy
                </button>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                *Sesuaikan host/port jika 9router dihosting di VPS server luar (misal: https://api.domain.com/v1).
              </span>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                Cara Setting di Cursor / Cline:
              </label>
              <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>Pilih jenis provider: <strong>OpenAI Compatible</strong></li>
                <li>Base URL: <code style={{ color: 'var(--color-primary)' }}>{aiRouterUrl}</code></li>
                <li>API Key: masukkan <strong>API Key</strong> Anda di atas</li>
                <li>Model ID: gunakan model dari katalog (contoh: <code style={{ color: 'var(--color-secondary)' }}>gpt-4o-mini</code>)</li>
              </ul>
            </div>
          </div>

          {/* Code Example */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
              2. Contoh Kode (Node.js SDK)
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Anda dapat menggunakan library resmi <code style={{ color: 'var(--color-primary)' }}>openai</code> untuk memanggil model:
            </p>
            <pre style={{ 
              background: 'rgba(0, 0, 0, 0.4)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '16px', 
              fontSize: '12px', 
              fontFamily: 'monospace', 
              color: '#d4d4d4', 
              overflowX: 'auto',
              lineHeight: '1.5',
              margin: 0
            }}>
{`import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: '${aiRouterUrl}',
  apiKey: 'ma-xxxxxxxxxxxx'
});

async function main() {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Halo!' }],
  });
  console.log(response.choices[0].message.content);
}

main();`}
            </pre>
          </div>
        </div>

        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate('/docs/ai')}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 30px', fontSize: '14px', cursor: 'pointer' }}
          >
            Lihat Dokumentasi Lengkap & FAQ <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Top-Up Modal */}
      {showTopUpModal && selectedKey && (
        <TopUpModal
          apiKey={selectedKey}
          token={token}
          onClose={() => {
            setShowTopUpModal(false);
            setSelectedKey(null);
            fetchApiKeys();
          }}
        />
      )}

      {/* Create Key Modal */}
      {showCreateModal && (
        <CreateKeyModal
          token={token}
          aiRouterUrl={aiRouterUrl}
          userBalance={user ? user.balance : 0}
          onClose={() => {
            setShowCreateModal(false);
            fetchApiKeys();
          }}
        />
      )}
    </div>
  );
}

/**
 * Top-Up Modal Component
 */
function TopUpModal({ apiKey, token, onClose }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTopUp = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Masukkan jumlah top up yang valid');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/credits/top-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          apiKeyId: apiKey.id,
          amount: numAmount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Berhasil melakukan top up Rp ${numAmount.toLocaleString('id-ID')}`);
        onClose();
      } else {
        alert(data.error || 'Gagal melakukan top up kredit');
      }
    } catch (error) {
      console.error('Error topping up:', error);
      alert('Gagal melakukan top up kredit');
    } finally {
      setLoading(false);
    }
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
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
          Top Up Kredit AI
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Tambah kredit ke <strong>{apiKey.keyName}</strong>
        </p>

        <div className="form-group">
          <label className="form-label">Jumlah (Rp)</label>
          <input
            type="number"
            className="form-input"
            placeholder="50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1000"
            step="1000"
          />
        </div>

        <div style={{
          background: 'rgba(79, 172, 254, 0.05)',
          border: '1px solid rgba(79, 172, 254, 0.15)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          marginBottom: '24px',
        }}>
          Kredit akan dipotong langsung dari saldo utama akun Anda
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ flex: 1, padding: '12px' }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleTopUp}
            className="btn btn-primary"
            style={{ flex: 1, padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Top Up'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Create Key Modal Component
 */
function CreateKeyModal({ token, onClose, userBalance, aiRouterUrl }) {
  const [keyName, setKeyName] = useState('');
  const [initialCredits, setInitialCredits] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!keyName) {
      alert('Nama API Key wajib diisi');
      return;
    }
    const credits = parseFloat(initialCredits) || 0;
    if (credits > userBalance) {
      alert('Saldo utama Anda tidak mencukupi untuk alokasi kredit awal ini');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/keys/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          keyName,
          tier: 'ENTERPRISE',
          modelId: null,
          initialCredits: credits
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert(`✅ API Key Berhasil Dibuat!\n\n🔑 API Key: ${data.apiKey}\n\nBase URL: ${aiRouterUrl || 'https://ai.markaz-arshy.com/v1'}\nModel: code\n\nGunakan key ini di Cursor/Cline/Claude Code`);
        onClose();
      } else {
        alert(data.error || 'Gagal membuat API Key');
      }
    } catch (error) {
      console.error('Error creating key:', error);
      alert('Gagal membuat API Key');
    } finally {
      setLoading(false);
    }
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
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
          Create New API Key
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Buat API Key baru untuk mengakses model AI. Kunci ini dapat digunakan untuk semua model.
        </p>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: '600' }}>Nama API Key</label>
          <input
            type="text"
            className="form-input"
            placeholder="Contoh: My Cursor Key"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: '600' }}>Alokasi Kredit Awal (Rp)</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            value={initialCredits}
            onChange={(e) => setInitialCredits(e.target.value)}
            min="0"
            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
            *Kredit akan dipotong langsung dari saldo wallet Anda (Saldo saat ini: Rp {Math.ceil(userBalance).toLocaleString('id-ID')}).
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ flex: 1, padding: '12px', cursor: 'pointer' }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="btn btn-primary"
            style={{ flex: 1, padding: '12px', cursor: 'pointer' }}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Key'}
          </button>
        </div>
      </div>
    </div>
  );
}
