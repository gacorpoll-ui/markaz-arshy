import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Sparkles, Filter } from 'lucide-react';
import AIRouterCard from '../components/AIRouterCard';
import CatalogSkeleton from '../components/CatalogSkeleton';

/**
 * AI Router Catalog Page - Menampilkan semua AI models yang tersedia
 */
export default function AIRouterCatalog({ user, token }) {
  const [providers, setProviders] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    filterModels();
  }, [selectedProvider, providers]);

  const fetchProviders = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/providers`);
      const data = await response.json();
      setProviders(data);
    } catch (error) {
      console.error('Error fetching AI providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterModels = () => {
    if (selectedProvider === 'all') {
      const allModels = providers.flatMap(provider => 
        provider.models.map(model => ({ ...model, provider }))
      );
      setFilteredModels(allModels);
    } else {
      const provider = providers.find(p => p.slug === selectedProvider);
      if (provider) {
        const models = provider.models.map(model => ({ ...model, provider }));
        setFilteredModels(models);
      }
    }
  };

  if (loading) {
    return <CatalogSkeleton />;
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <div style={{
          display: 'inline-flex',
          padding: '12px 24px',
          borderRadius: '9999px',
          background: 'rgba(79, 172, 254, 0.1)',
          border: '1px solid rgba(79, 172, 254, 0.2)',
          marginBottom: '20px',
        }}>
          <Cpu size={20} style={{ color: 'var(--color-primary)', marginRight: '8px' }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)' }}>
            AI Router & API Keys
          </span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-title)',
          fontSize: '48px',
          fontWeight: '700',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Akses Semua AI Model dengan 1 API Key
        </h1>

        <p style={{
          fontSize: '18px',
          color: 'var(--text-secondary)',
          maxWidth: '700px',
          margin: '0 auto 30px',
          lineHeight: '1.6',
        }}>
          OpenAI GPT-4, Anthropic Claude, Google Gemini — semua dalam satu platform. 
          Bayar sesuai penggunaan dengan harga kompetitif.
        </p>

        {/* CTA untuk non-login users */}
        {!user && (
          <div style={{
            background: 'rgba(79, 172, 254, 0.05)',
            border: '1px solid rgba(79, 172, 254, 0.15)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Login untuk membuat API key dan mulai menggunakan AI models
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary"
              style={{ padding: '10px 24px' }}
            >
              Login / Daftar Sekarang
            </button>
          </div>
        )}
      </div>

      {/* Provider Filter Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border-color)',
        overflowX: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px' }}>
          <Filter size={18} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
            Filter:
          </span>
        </div>

        <button
          onClick={() => setSelectedProvider('all')}
          className={selectedProvider === 'all' ? 'btn btn-primary' : 'btn btn-secondary'}
          style={{ padding: '8px 20px', fontSize: '14px', whiteSpace: 'nowrap' }}
        >
          <Sparkles size={16} />
          Semua Model
        </button>

        {providers.map(provider => (
          <button
            key={provider.id}
            onClick={() => setSelectedProvider(provider.slug)}
            className={selectedProvider === provider.slug ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ padding: '8px 20px', fontSize: '14px', whiteSpace: 'nowrap' }}
          >
            {provider.name}
          </button>
        ))}
      </div>

      {/* Models Grid */}
      {filteredModels.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--text-muted)',
        }}>
          <Cpu size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
          <p>Tidak ada model tersedia untuk provider ini.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '20px',
        }}>
          {filteredModels.map(model => (
            <AIRouterCard
              key={model.id}
              model={model}
              provider={model.provider}
            />
          ))}
        </div>
      )}

      {/* Info Section */}
      <div style={{
        marginTop: '60px',
        padding: '30px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(168, 85, 247, 0.05)',
        border: '1px solid rgba(168, 85, 247, 0.15)',
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>
          🚀 Keuntungan Menggunakan AI Router
        </h3>
        <ul style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '20px' }}>
          <li><strong>1 API Key untuk Semua</strong> — Tidak perlu manage multiple API keys</li>
          <li><strong>Harga Kompetitif</strong> — Markup minimal, bayar sesuai penggunaan</li>
          <li><strong>Usage Dashboard</strong> — Monitor real-time usage & cost per model</li>
          <li><strong>Rate Limiting Tiers</strong> — BASIC (10 rpm), PRO (60 rpm), ENTERPRISE (300 rpm)</li>
          <li><strong>Auto-Deduct Credits</strong> — Top-up sekali, pakai untuk semua model</li>
        </ul>
      </div>
    </div>
  );
}
