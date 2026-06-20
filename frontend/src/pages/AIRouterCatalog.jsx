import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Cpu, Key, Zap, ArrowRight, ExternalLink, Shield, BarChart3, Copy, Check, ChevronDown, ChevronUp, Terminal, BookOpen } from 'lucide-react';

/**
 * AI Router Catalog — Professional Redesign
 * Single API Key for all models — like OpenRouter/OpenAI
 */
export default function AIRouterCatalog({ user, token }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [copied, setCopied] = useState(false);
  const [expandedModel, setExpandedModel] = useState(null);
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

  const formatPrice = (pricePerToken) => {
    const pricePerM = pricePerToken * 1000000;
    if (pricePerM < 1) return '$' + pricePerM.toFixed(4);
    return '$' + pricePerM.toFixed(2);
  };

  const formatPriceIDR = (pricePerToken) => {
    const pricePerM = pricePerToken * 1000000;
    const priceIDR = pricePerM * 15000;
    return `Rp ${Math.ceil(priceIDR).toLocaleString('id-ID')}`;
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

  const getSpeed = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('mini') || lower.includes('flash') || lower.includes('haiku') || lower.includes('lite')) return { label: 'Fast', color: '#22c55e' };
    if (lower.includes('pro') || lower.includes('opus') || lower.includes('max')) return { label: 'Premium', color: '#f59e0b' };
    return { label: 'Balanced', color: '#6366f1' };
  };

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
      {/* ═══ HERO SECTION ═══ */}
      <section style={{
        padding: '80px 24px 60px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(79, 172, 254, 0.08) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '9999px',
            background: 'rgba(79, 172, 254, 0.1)',
            border: '1px solid rgba(79, 172, 254, 0.2)',
            marginBottom: '24px',
          }}>
            <Zap size={16} style={{ color: '#4facfe' }} />
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#4facfe' }}>AI Gateway — OpenAI Compatible</span>
          </div>

          <h1 style={{
            fontSize: '48px',
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

          {/* Quick Start Code */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '550px',
            margin: '0 auto 24px',
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Quick Start
              </span>
              <button
                onClick={() => copyToClipboard(`curl ${baseUrl}/chat/completions \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello!"}]}'`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: copied ? '#22c55e' : 'rgba(79, 172, 254, 0.1)',
                  border: '1px solid ' + (copied ? '#22c55e' : 'rgba(79, 172, 254, 0.2)'),
                  borderRadius: '6px', padding: '4px 10px',
                  color: copied ? 'white' : '#4facfe',
                  fontSize: '11px', fontWeight: '600', cursor: 'pointer',
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
                  onClick={() => navigate('/ai-docs')}
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

      {/* ═══ FEATURES STRIP ═══ */}
      <section style={{
        padding: '40px 24px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '24px',
        }}>
          {[
            { icon: <Key size={20} />, title: '1 API Key', desc: 'Satu key untuk semua model', color: '#4facfe' },
            { icon: <Zap size={20} />, title: 'OpenAI Compatible', desc: 'Format API standar industry', color: '#f59e0b' },
            { icon: <BarChart3 size={20} />, title: 'Real-time Usage', desc: 'Monitor token & cost', color: '#8b5cf6' },
            { icon: <Shield size={20} />, title: 'Rate Limiting', desc: 'BASIC / PRO / ENTERPRISE', color: '#22c55e' },
          ].map((feat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: `${feat.color}15`, display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center',
                color: feat.color, marginBottom: '10px',
              }}>
                {feat.icon}
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{feat.title}</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ MODEL CATALOG ═══ */}
      <section style={{ padding: '60px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Model Catalog
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              {allModels.length} models tersedia — bayar sesuai penggunaan
            </p>
          </div>

          {/* Provider Filter */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedProvider('all')}
              style={{
                padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                background: selectedProvider === 'all' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                color: selectedProvider === 'all' ? 'white' : 'var(--text-secondary)',
                border: selectedProvider === 'all' ? 'none' : '1px solid var(--border-color)',
                transition: 'all 0.2s',
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
                  transition: 'all 0.2s',
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Model Table */}
        <div style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.2fr 0.8fr 1fr 1fr 0.6fr',
            gap: '12px',
            padding: '14px 24px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '11px',
            fontWeight: '700',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            <span>Model</span>
            <span>Provider</span>
            <span style={{ textAlign: 'right' }}>Context</span>
            <span style={{ textAlign: 'right' }}>Input / 1M</span>
            <span style={{ textAlign: 'right' }}>Output / 1M</span>
            <span style={{ textAlign: 'center' }}>Speed</span>
          </div>

          {/* Model Rows */}
          {allModels.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Cpu size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p>Tidak ada model tersedia</p>
            </div>
          ) : (
            allModels.map((model, idx) => {
              const badge = getProviderBadge(model.provider.slug);
              const speed = getSpeed(model.name);
              const isExpanded = expandedModel === model.id;

              return (
                <div key={model.id}>
                  {/* Model Row */}
                  <div
                    onClick={() => setExpandedModel(isExpanded ? null : model.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1.2fr 0.8fr 1fr 1fr 0.6fr',
                      gap: '12px',
                      padding: '16px 24px',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      background: isExpanded ? 'rgba(79, 172, 254, 0.03)' : 'transparent',
                    }}
                    onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Model Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {model.name}
                      </span>
                      {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
                    </div>

                    {/* Provider Badge */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '6px',
                        background: `${badge.color}15`, color: badge.color,
                        fontSize: '11px', fontWeight: '600',
                      }}>
                        {badge.name}
                      </span>
                    </div>

                    {/* Context Window */}
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {(model.contextWindow / 1000).toFixed(0)}K
                      </span>
                    </div>

                    {/* Input Price */}
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {formatPrice(model.inputPricePer1K)}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {formatPriceIDR(model.inputPricePer1K)}
                      </span>
                    </div>

                    {/* Output Price */}
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {formatPrice(model.outputPricePer1K)}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {formatPriceIDR(model.outputPricePer1K)}
                      </span>
                    </div>

                    {/* Speed Badge */}
                    <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px',
                        background: `${speed.color}15`, color: speed.color,
                        fontSize: '11px', fontWeight: '600',
                      }}>
                        {speed.label}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div style={{
                      padding: '20px 24px',
                      background: 'rgba(79, 172, 254, 0.02)',
                      borderBottom: '1px solid var(--border-color)',
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* Left: Model Info */}
                        <div>
                          <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                            Detail Model
                          </h4>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                            <div><strong>Model ID:</strong> <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{model.modelId}</code></div>
                            <div><strong>Provider:</strong> {model.provider.name}</div>
                            <div><strong>Context Window:</strong> {model.contextWindow.toLocaleString()} tokens</div>
                            <div><strong>Input Price:</strong> {formatPrice(model.inputPricePer1K)} per 1K tokens</div>
                            <div><strong>Output Price:</strong> {formatPrice(model.outputPricePer1K)} per 1K tokens</div>
                          </div>
                        </div>

                        {/* Right: Usage Example */}
                        <div>
                          <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                            Contoh Penggunaan
                          </h4>
                          <pre style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '12px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            color: '#e2e8f0',
                            lineHeight: '1.5',
                            overflowX: 'auto',
                            whiteSpace: 'pre-wrap',
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
                              marginTop: '8px',
                              display: 'flex', alignItems: 'center', gap: '4px',
                              background: 'rgba(79, 172, 254, 0.1)',
                              border: '1px solid rgba(79, 172, 254, 0.2)',
                              borderRadius: '6px', padding: '4px 10px',
                              color: '#4facfe', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
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

      {/* ═══ PRICING INFO ═══ */}
      <section style={{ padding: '60px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', textAlign: 'center' }}>
          Pricing & Rate Limits
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '32px' }}>
          Bayar sesuai penggunaan. Harga per 1M tokens.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
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
              transition: 'all 0.3s',
            }}>
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  background: plan.color, color: 'white',
                  padding: '4px 12px', borderRadius: '6px',
                  fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                }}>
                  Most Popular
                </div>
              )}
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: plan.color, marginBottom: '4px' }}>{plan.tier}</h3>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>{plan.price}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>{plan.desc}</div>
              <div style={{
                padding: '8px 12px', borderRadius: '8px',
                background: `${plan.color}10`, border: `1px solid ${plan.color}20`,
                marginBottom: '16px', fontSize: '13px', fontWeight: '600',
                color: plan.color, textAlign: 'center',
              }}>
                {plan.rateLimit}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={14} style={{ color: '#22c55e', flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ QUICK START SECTION ═══ */}
      <section style={{
        padding: '60px 24px',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', textAlign: 'center' }}>
          Mulai dalam 3 Langkah
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '40px' }}>
          Anda bisa mulai menggunakan AI dalam hitungan menit
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
              href: '/ai-docs',
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
            <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: `${item.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', fontWeight: '800', color: item.color,
                flexShrink: 0,
              }}>
                {item.step}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{item.title}</h4>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.5' }}>{item.desc}</p>
                {item.action && (
                  <Link to={item.href} style={{
                    fontSize: '13px', fontWeight: '600', color: item.color,
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px',
                  }}>
                    {item.action} <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FOOTER CTA ═══ */}
      <section style={{
        padding: '60px 24px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, transparent 0%, rgba(79, 172, 254, 0.05) 100%)',
        borderTop: '1px solid var(--border-color)',
      }}>
        <h2 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
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
