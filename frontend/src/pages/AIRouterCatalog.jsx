import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Cpu, Key, Zap, ArrowRight, ExternalLink, Shield, BarChart3, Copy, Check, ChevronDown, ChevronUp, Terminal, BookOpen } from 'lucide-react';

/**
 * AI Router Catalog — Hybrid Table-Cards Redesign
 * OpenRouter-inspired, data-rich, developer-focused layout
 * Single API Key for all models
 */
export default function AIRouterCatalog({ user, token }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [copied, setCopied] = useState(false);
  const [expandedModel, setExpandedModel] = useState(null);
  const [copiedModel, setCopiedModel] = useState(null);
  const navigate = useNavigate();

  const baseUrl = import.meta.env.VITE_AI_ROUTER_PUBLIC_URL || 'https://ai.markaz-arshy.com/v1';

  useEffect(() => {
    fetchProviders();
  }, []);

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

  const allModels = providers
    .filter(p => selectedProvider === 'all' || p.slug === selectedProvider)
    .flatMap(p =>
      (p.models || []).map(m => ({ ...m, provider: p }))
    );

  // Harga disimpan di DB sebagai Rp per 1K tokens
  const formatPrice = (pricePer1K) => {
    return `Rp ${Math.ceil(pricePer1K).toLocaleString('id-ID')}`;
  };

  const formatPricePerM = (pricePer1K) => {
    return `Rp ${Math.ceil(pricePer1K * 1000).toLocaleString('id-ID')}`;
  };

  const getProviderColor = (slug) => {
    const colors = {
      'openai': '#10a37f',
      'anthropic': '#d97757',
      'google-ai': '#4285f4',
    };
    return colors[slug] || '#4facfe';
  };

  const getProviderBadge = (slug) => {
    const badges = {
      'openai': { name: 'OpenAI', color: '#10a37f' },
      'anthropic': { name: 'Anthropic', color: '#d97757' },
      'google-ai': { name: 'Google', color: '#4285f4' },
    };
    return badges[slug] || { name: slug, color: '#4facfe' };
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyModelId = (modelId, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(modelId).then(() => {
      setCopiedModel(modelId);
      setTimeout(() => setCopiedModel(null), 2000);
    });
  };

  const getSpeed = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('mini') || lower.includes('flash') || lower.includes('haiku') || lower.includes('lite')) return { label: 'Fast', color: '#22c55e' };
    if (lower.includes('pro') || lower.includes('opus') || lower.includes('max')) return { label: 'Premium', color: '#f59e0b' };
    return { label: 'Balanced', color: '#6366f1' };
  };

  // ═══ Loading State ═══
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>⏳</div>
          <p>Memuat AI models...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Responsive CSS for this page */}
      <style>{`
        .ai-features-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .ai-table-header, .ai-table-row { display: grid; grid-template-columns: 2.2fr 1fr 0.7fr 1fr 1fr 0.6fr 0.5fr; gap: 10px; }
        .ai-pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .ai-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .ai-table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        @media (max-width: 768px) {
          .ai-features-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .ai-table-header { display: none; }
          .ai-table-row { grid-template-columns: 1fr auto; gap: 8px; padding: 14px 16px !important; }
          .ai-table-row > *:nth-child(n+3) { display: none; }
          .ai-table-row > *:first-child { grid-column: 1 / -1; }
          .ai-table-row > *:last-child { position: absolute; right: 16px; top: 14px; }
          .ai-table-row { position: relative; }
          .ai-pricing-grid { grid-template-columns: 1fr; gap: 16px; }
          .ai-detail-grid { grid-template-columns: 1fr; gap: 16px; }
        }
        @media (max-width: 480px) {
          .ai-features-grid { grid-template-columns: 1fr; }
          .ai-hero-title { font-size: 36px !important; }
        }
      `}</style>

      {/* ═══════════════════════════════════════
         SECTION 1: HERO
         ═══════════════════════════════════════ */}
      <section style={{
        padding: '80px 24px 60px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(79, 172, 254, 0.08) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '9999px',
            background: 'rgba(0, 242, 254, 0.08)',
            border: '1px solid rgba(0, 242, 254, 0.2)',
            marginBottom: '24px',
          }}>
            <Zap size={14} style={{ color: '#00f2fe' }} />
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#00f2fe', letterSpacing: '0.3px' }}>
              AI Gateway — OpenAI Compatible
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: '52px',
            fontWeight: '800',
            lineHeight: '1.1',
            marginBottom: '20px',
            fontFamily: 'var(--font-title)',
          }}>
            <span style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Semua Model AI
            </span>
            <br />
            <span style={{ color: 'var(--text-primary)' }}>Satu API Key</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto 32px',
            lineHeight: '1.6',
          }}>
            Akses GPT-4o, Claude, Gemini, dan model lainnya dengan satu API key.
            Kompatibel dengan Cursor, Cline, dan semua tools OpenAI-compatible.
          </p>

          {/* Quick Start Code Block */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '580px',
            margin: '0 auto 28px',
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Quick Start
              </span>
              <button
                onClick={() => copyToClipboard(`curl ${baseUrl}/chat/completions \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello!"}]}'`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: copied ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 242, 254, 0.08)',
                  border: '1px solid ' + (copied ? 'rgba(16, 185, 129, 0.3)' : 'rgba(0, 242, 254, 0.2)'),
                  borderRadius: '6px', padding: '4px 10px',
                  color: copied ? '#10b981' : '#00f2fe',
                  fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
            <pre style={{
              margin: 0, fontSize: '12px', fontFamily: 'monospace',
              color: '#e2e8f0', lineHeight: '1.6', whiteSpace: 'pre-wrap',
            }}>
              {`curl ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello!"}]}'`}
            </pre>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <>
                <button
                  onClick={() => navigate('/dashboard/ai-keys')}
                  className="btn btn-primary"
                  style={{ padding: '12px 28px', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Key size={16} />
                  Buat API Key
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => navigate('/docs/ai')}
                  className="btn btn-secondary"
                  style={{ padding: '12px 28px', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <BookOpen size={16} />
                  Lihat Dokumentasi
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/register')}
                  className="btn btn-primary"
                  style={{ padding: '12px 28px', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  Mulai Gratis
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="btn btn-secondary"
                  style={{ padding: '12px 28px', fontSize: '15px', fontWeight: '600' }}
                >
                  Masuk
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
         SECTION 2: FEATURES STRIP
         ═══════════════════════════════════════ */}
      <section style={{
        padding: '40px 24px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div className="ai-features-grid" style={{
          maxWidth: '1000px',
          margin: '0 auto',
        }}>
          {[
            { icon: <Key size={18} />, title: '1 API Key', desc: 'Satu key untuk semua model', color: '#4facfe' },
            { icon: <Zap size={18} />, title: 'OpenAI Compatible', desc: 'Format API standar industry', color: '#f59e0b' },
            { icon: <BarChart3 size={18} />, title: 'Real-time Usage', desc: 'Monitor token & cost', color: '#8b5cf6' },
            { icon: <Shield size={18} />, title: 'Rate Limiting', desc: 'BASIC / PRO / ENTERPRISE', color: '#22c55e' },
          ].map((feat, i) => (
            <div key={i} style={{
              textAlign: 'center',
              padding: '20px 12px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              transition: 'all 0.2s ease',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${feat.color}30`; e.currentTarget.style.background = `${feat.color}05`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: `${feat.color}12`, display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center',
                color: feat.color, marginBottom: '10px',
              }}>
                {feat.icon}
              </div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{feat.title}</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
         SECTION 3: MODEL CATALOG (Hybrid Table-Cards)
         ═══════════════════════════════════════ */}
      <section style={{ padding: '60px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header + Filter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px', fontFamily: 'var(--font-title)' }}>
              Model Catalog
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {allModels.length} models tersedia — bayar sesuai penggunaan
            </p>
          </div>

          {/* Provider Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedProvider('all')}
              style={{
                padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                background: selectedProvider === 'all' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                color: selectedProvider === 'all' ? '#070913' : 'var(--text-secondary)',
                border: selectedProvider === 'all' ? 'none' : '1px solid var(--border-color)',
                transition: 'all 0.2s ease',
              }}
            >
              Semua
            </button>
            {providers.map(p => (
              <button
                key={p.slug}
                onClick={() => setSelectedProvider(p.slug)}
                style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                  background: selectedProvider === p.slug ? getProviderColor(p.slug) : 'rgba(255,255,255,0.05)',
                  color: selectedProvider === p.slug ? 'white' : 'var(--text-secondary)',
                  border: selectedProvider === p.slug ? 'none' : '1px solid var(--border-color)',
                  transition: 'all 0.2s ease',
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Table Wrapper */}
        <div className="ai-table-wrapper" style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
        }}>
          {/* Table Header */}
          <div className="ai-table-header" style={{
            padding: '14px 24px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '10px',
            fontWeight: '700',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
          }}>
            <span>Model</span>
            <span>Provider</span>
            <span style={{ textAlign: 'right' }}>Context</span>
            <span style={{ textAlign: 'right' }}>Input / 1K</span>
            <span style={{ textAlign: 'right' }}>Output / 1K</span>
            <span style={{ textAlign: 'center' }}>Speed</span>
            <span style={{ textAlign: 'center' }}></span>
          </div>

          {/* Model Rows */}
          {allModels.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Cpu size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p>Tidak ada model tersedia</p>
            </div>
          ) : (
            allModels.map((model) => {
              const badge = getProviderBadge(model.provider.slug);
              const speed = getSpeed(model.name);
              const isExpanded = expandedModel === model.id;

              return (
                <div key={model.id}>
                  {/* Model Row — Card Style */}
                  <div
                    className="ai-table-row"
                    onClick={() => setExpandedModel(isExpanded ? null : model.id)}
                    style={{
                      padding: '16px 24px',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      background: isExpanded
                        ? 'rgba(0, 242, 254, 0.03)'
                        : 'transparent',
                      borderLeft: isExpanded ? '3px solid #00f2fe' : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Model Name + Provider Dot */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: badge.color, flexShrink: 0,
                        boxShadow: `0 0 6px ${badge.color}60`,
                      }} />
                      <span style={{
                        fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {model.name}
                      </span>
                      {isExpanded
                        ? <ChevronUp size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        : <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      }
                    </div>

                    {/* Provider Badge */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '6px',
                        background: `${badge.color}12`, color: badge.color,
                        fontSize: '11px', fontWeight: '600',
                        whiteSpace: 'nowrap',
                      }}>
                        {badge.name}
                      </span>
                    </div>

                    {/* Context Window */}
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <span style={{
                        fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)',
                        background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '4px',
                      }}>
                        {(model.contextWindow / 1000).toFixed(0)}K
                      </span>
                    </div>

                    {/* Input Price */}
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {formatPrice(model.inputPricePer1K)}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {formatPricePerM(model.inputPricePer1K)} / 1M
                      </span>
                    </div>

                    {/* Output Price */}
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {formatPrice(model.outputPricePer1K)}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {formatPricePerM(model.outputPricePer1K)} / 1M
                      </span>
                    </div>

                    {/* Speed Badge */}
                    <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px',
                        background: `${speed.color}12`, color: speed.color,
                        fontSize: '11px', fontWeight: '600',
                      }}>
                        {speed.label}
                      </span>
                    </div>

                    {/* Action Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        onClick={(e) => copyModelId(model.modelId, e)}
                        style={{
                          padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                          cursor: 'pointer', border: 'none',
                          background: copiedModel === model.modelId ? 'rgba(16,185,129,0.15)' : 'rgba(0,242,254,0.08)',
                          color: copiedModel === model.modelId ? '#10b981' : '#00f2fe',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => { if (copiedModel !== model.modelId) e.currentTarget.style.background = 'rgba(0,242,254,0.15)'; }}
                        onMouseLeave={(e) => { if (copiedModel !== model.modelId) e.currentTarget.style.background = 'rgba(0,242,254,0.08)'; }}
                      >
                        {copiedModel === model.modelId ? <Check size={12} /> : 'Use'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div style={{
                      padding: '20px 24px',
                      background: 'rgba(0, 242, 254, 0.02)',
                      borderBottom: '1px solid var(--border-color)',
                      borderLeft: '3px solid #00f2fe',
                    }}>
                      <div className="ai-detail-grid">
                        {/* Left: Model Info */}
                        <div>
                          <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                            Detail Model
                          </h4>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '2' }}>
                            <div><strong style={{ color: 'var(--text-primary)' }}>Model ID:</strong> <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', color: '#00f2fe' }}>{model.modelId}</code></div>
                            <div><strong style={{ color: 'var(--text-primary)' }}>Provider:</strong> {model.provider.name}</div>
                            <div><strong style={{ color: 'var(--text-primary)' }}>Context:</strong> {model.contextWindow.toLocaleString()} tokens</div>
                            <div><strong style={{ color: 'var(--text-primary)' }}>Input:</strong> {formatPrice(model.inputPricePer1K)} / 1K <span style={{ color: 'var(--text-muted)' }}>({formatPricePerM(model.inputPricePer1K)} / 1M)</span></div>
                            <div><strong style={{ color: 'var(--text-primary)' }}>Output:</strong> {formatPrice(model.outputPricePer1K)} / 1K <span style={{ color: 'var(--text-muted)' }}>({formatPricePerM(model.outputPricePer1K)} / 1M)</span></div>
                          </div>
                        </div>

                        {/* Right: Usage Example */}
                        <div>
                          <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                            Contoh Penggunaan
                          </h4>
                          <pre style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '14px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            color: '#e2e8f0',
                            lineHeight: '1.5',
                            overflowX: 'auto',
                            whiteSpace: 'pre-wrap',
                            marginBottom: '10px',
                          }}>
                            {`curl ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model.modelId}",
    "messages": [{"role":"user","content":"Hello!"}]
  }'`}
                          </pre>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(`curl ${baseUrl}/chat/completions \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"model":"${model.modelId}","messages":[{"role":"user","content":"Hello!"}]}'`);
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px',
                              background: 'rgba(0, 242, 254, 0.08)',
                              border: '1px solid rgba(0, 242, 254, 0.2)',
                              borderRadius: '6px', padding: '4px 10px',
                              color: '#00f2fe', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Copy size={12} /> Copy Example
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════
         SECTION 4: PRICING TIERS
         ═══════════════════════════════════════ */}
      <section style={{ padding: '60px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', textAlign: 'center', fontFamily: 'var(--font-title)' }}>
          Pricing & Rate Limits
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '32px' }}>
          Bayar sesuai penggunaan. Pilih tier sesuai kebutuhan Anda.
        </p>

        <div className="ai-pricing-grid">
          {[
            { tier: 'BASIC', price: 'Rp 0', desc: 'Free tier', rateLimit: '10 req/min', color: '#6366f1', features: ['All models', 'Basic rate limit', 'Usage dashboard'] },
            { tier: 'PRO', price: 'Rp 50.000', desc: 'per bulan', rateLimit: '60 req/min', color: '#4facfe', features: ['All models', 'Higher rate limit', 'Priority support', 'Usage analytics'], popular: true },
            { tier: 'ENTERPRISE', price: 'Custom', desc: 'kontak kami', rateLimit: '300 req/min', color: '#f59e0b', features: ['All models', 'Max rate limit', 'Dedicated support', 'Custom limits', 'SLA'] },
          ].map((plan, i) => (
            <div key={i} style={{
              background: 'var(--glass-bg)',
              border: plan.popular ? `2px solid ${plan.color}` : '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '28px',
              position: 'relative',
              transition: 'all 0.3s ease',
            }}
              onMouseEnter={(e) => { if (!plan.popular) e.currentTarget.style.borderColor = `${plan.color}40`; }}
              onMouseLeave={(e) => { if (!plan.popular) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  background: plan.color, color: 'white',
                  padding: '4px 14px', borderRadius: '6px',
                  fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                }}>
                  Most Popular
                </div>
              )}
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: plan.color, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{plan.tier}</h3>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px', fontFamily: 'var(--font-title)' }}>{plan.price}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>{plan.desc}</div>
              <div style={{
                padding: '8px 12px', borderRadius: '8px',
                background: `${plan.color}08`, border: `1px solid ${plan.color}20`,
                marginBottom: '16px', fontSize: '13px', fontWeight: '600',
                color: plan.color, textAlign: 'center',
              }}>
                {plan.rateLimit}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
         SECTION 5: 3-STEP GUIDE
         ═══════════════════════════════════════ */}
      <section style={{
        padding: '60px 24px',
        maxWidth: '700px',
        margin: '0 auto',
      }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', textAlign: 'center', fontFamily: 'var(--font-title)' }}>
          Mulai dalam 3 Langkah
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '40px' }}>
          Anda bisa mulai menggunakan AI dalam hitungan menit
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            {
              step: 1,
              title: 'Buat API Key',
              desc: 'Daftar akun, top up saldo, lalu buat API key baru di dashboard.',
              action: user ? 'Buka Dashboard' : 'Daftar Sekarang',
              href: user ? '/dashboard/ai-keys' : '/register',
              color: '#4facfe',
            },
            {
              step: 2,
              title: 'Pilih Tool',
              desc: 'Gunakan API key di Cursor, Cline, Claude Code, atau tools lainnya.',
              action: 'Lihat Panduan',
              href: '/docs/ai',
              color: '#8b5cf6',
            },
            {
              step: 3,
              title: 'Mulai Coding!',
              desc: 'Salin config, paste ke tool Anda, dan mulai coding dengan AI.',
              action: null,
              href: null,
              color: '#22c55e',
            },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', gap: '20px', alignItems: 'flex-start',
              position: 'relative',
              paddingBottom: i < 2 ? '32px' : '0',
            }}>
              {/* Step Circle */}
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: `${item.color}12`,
                border: `2px solid ${item.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: '800', color: item.color,
                flexShrink: 0, zIndex: 1,
              }}>
                {item.step}
              </div>

              {/* Connecting Line */}
              {i < 2 && (
                <div style={{
                  position: 'absolute',
                  left: '23px', top: '48px',
                  width: '2px',
                  height: 'calc(100% - 48px)',
                  background: `linear-gradient(180deg, ${item.color}30 0%, transparent 100%)`,
                }} />
              )}

              {/* Content */}
              <div style={{ flex: 1, paddingTop: '4px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{item.title}</h4>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.5' }}>{item.desc}</p>
                {item.action && (
                  <Link to={item.href} style={{
                    fontSize: '13px', fontWeight: '600', color: item.color,
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px',
                    transition: 'gap 0.2s ease',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.gap = '8px'}
                    onMouseLeave={(e) => e.currentTarget.style.gap = '4px'}
                  >
                    {item.action} <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
         SECTION 6: FOOTER CTA
         ═══════════════════════════════════════ */}
      <section style={{
        padding: '60px 24px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, transparent 0%, rgba(0, 242, 254, 0.04) 100%)',
        borderTop: '1px solid var(--border-color)',
      }}>
        <h2 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', fontFamily: 'var(--font-title)' }}>
          Siap Memulai?
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Buat API key Anda sekarang dan mulai coding dengan AI tercanggih
        </p>
        {user ? (
          <button
            onClick={() => navigate('/dashboard/ai-keys')}
            className="btn btn-primary"
            style={{ padding: '14px 32px', fontSize: '16px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Key size={18} />
            Buat API Key
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => navigate('/register')}
            className="btn btn-primary"
            style={{ padding: '14px 32px', fontSize: '16px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            Daftar Gratis
            <ArrowRight size={16} />
          </button>
        )}
      </section>
    </div>
  );
}
