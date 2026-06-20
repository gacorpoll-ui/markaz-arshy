import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Cpu, Key, ArrowRight, HelpCircle, Code, Settings, Copy, Info, Terminal, ChevronDown, ChevronRight, Zap, Shield, CreditCard, BookOpen, ExternalLink, Check, Sparkles } from 'lucide-react';
import CLIToolCards from '../components/CLIToolCards';

/* ═══════════════════════════════════════
   FAQ Accordion Item
   ═══════════════════════════════════════ */
function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div style={{
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      background: isOpen ? 'rgba(79,172,254,0.03)' : 'transparent',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600', textAlign: 'left',
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HelpCircle size={16} style={{ color: isOpen ? 'var(--color-primary)' : 'var(--text-muted)', flexShrink: 0 }} />
          {question}
        </span>
        <ChevronDown size={16} style={{
          color: 'var(--text-muted)', transition: 'transform 0.2s ease',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          flexShrink: 0,
        }} />
      </button>
      {isOpen && (
        <div style={{ padding: '0 20px 16px 46px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          {answer}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   Code Block Component
   ═══════════════════════════════════════ */
function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', top: '10px', right: '10px', zIndex: 1,
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        {language && (
          <span style={{
            fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase',
            fontWeight: '600', letterSpacing: '0.5px',
          }}>
            {language}
          </span>
        )}
        <button
          onClick={handleCopy}
          style={{
            background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
            border: '1px solid ' + (copied ? 'rgba(34,197,94,0.3)' : 'var(--border-color)'),
            borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
            fontSize: '11px', color: copied ? '#22c55e' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: '4px',
            transition: 'all 0.2s ease',
          }}
        >
          {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
      <pre style={{
        background: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '20px',
        paddingTop: '16px',
        fontSize: '13px',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        color: '#d4d4d4',
        overflowX: 'auto',
        lineHeight: '1.6',
        margin: 0,
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ═══════════════════════════════════════
   Main Component
   ═══════════════════════════════════════ */
export default function AIDocs() {
  const aiRouterUrl = import.meta.env.VITE_AI_ROUTER_PUBLIC_URL || 'https://ai.markaz-arshy.com/v1';
  const [activeTab, setActiveTab] = useState('cli-tools');
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const [copied, setCopied] = useState('');
  const navigate = useNavigate();

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

  const copyToClipboard = useCallback((text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const allModels = providers.flatMap(p => p.models.map(m => ({ ...m, providerName: p.name })));

  const faqData = [
    {
      q: 'Bagaimana cara kerja pemotongan saldo?',
      a: 'Setiap request AI akan menghitung jumlah token input (prompt) dan output (respon). Biaya dihitung: (tokens ÷ 1000) × harga per 1K tokens. Saldo kredit API key akan otomatis terpotong secara real-time setelah request selesai.'
    },
    {
      q: 'Apa yang terjadi jika saldo habis?',
      a: 'Jika saldo kredit API key mencapai Rp 0, request selanjutnya akan ditolak dengan error 402 (Insufficient Credits). Anda dapat top up kredit kapan saja dari saldo utama akun Markaz-Arshy.'
    },
    {
      q: 'Bagaimana cara melihat penggunaan token saya?',
      a: 'Buka Dashboard → AI Keys → Usage. Anda bisa melihat detail penggunaan per request, termasuk jumlah token, biaya, model yang digunakan, dan grafik penggunaan harian. Data diperbarui secara real-time.'
    },
    {
      q: 'Model apa saja yang tersedia?',
      a: 'Markaz-Arshy mendukung model dari OpenAI (GPT-4o, GPT-4o-mini), Anthropic (Claude 3.5 Sonnet, Claude 3 Opus), Google (Gemini 1.5 Pro, Gemini 1.5 Flash), dan model lainnya. Lihat katalog lengkap di bawah.'
    },
    {
      q: 'Apakah ada rate limit?',
      a: 'Setiap API key memiliki rate limit default 300 requests per minute. Jika melebihi batas, request akan ditolak dengan error 429 (Too Many Requests). Hubungi admin untuk menambah limit.'
    },
    {
      q: 'Bagaimana cara top up saldo AI?',
      a: 'Buka Dashboard → AI Keys → pilih API key → Top Up Credits. Masukkan nominal yang diinginkan dan saldo akan dipotong dari balance utama akun Anda. Pastikan saldo utama mencukupi.'
    },
  ];

  return (
    <div style={{ paddingTop: '0', paddingBottom: '80px', color: 'var(--text-primary)' }}>

      {/* ═══ Hero Section ═══ */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79,172,254,0.08) 0%, rgba(127,0,255,0.08) 100%)',
        borderBottom: '1px solid var(--border-color)',
        padding: '60px 20px 50px',
        marginBottom: '40px',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', borderRadius: '999px',
            background: 'rgba(79,172,254,0.1)', border: '1px solid rgba(79,172,254,0.2)',
            marginBottom: '20px', fontSize: '12px', fontWeight: '600', color: 'var(--color-primary)',
          }}>
            <Sparkles size={14} />
            AI Router Documentation
          </div>
          <h1 style={{
            fontFamily: 'var(--font-title)', fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: '800', marginBottom: '16px', lineHeight: 1.2,
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #a855f7 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Panduan Integrasi AI Router
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto', lineHeight: '1.7' }}>
            Akses GPT-4o, Claude 3.5 Sonnet, Gemini Pro, dan model AI lainnya dengan satu API key. Kompatibel dengan Cursor, Claude Code, Cline, dan ribuan aplikasi lainnya.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 20px' }}>

        {/* ═══ Quick Start Cards ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {[
            { icon: CreditCard, title: '1. Top Up Saldo', desc: 'Deposit saldo utama melalui menu Deposit', link: '/deposit', color: 'var(--color-primary)' },
            { icon: Key, title: '2. Buat API Key', desc: 'Buat key baru di Dashboard AI Keys', link: '/dashboard/ai-keys', color: '#a855f7' },
            { icon: Terminal, title: '3. Mulai Coding', desc: 'Copy key & URL ke Cursor, Cline, dll', link: null, color: 'var(--color-success)' },
          ].map((step, i) => (
            <div
              key={i}
              className="glass-card"
              style={{ padding: '24px', cursor: step.link ? 'pointer' : 'default', transition: 'all 0.2s ease' }}
              onClick={() => step.link && navigate(step.link)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: `${step.color}15`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <step.icon size={18} style={{ color: step.color }} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: '700' }}>{step.title}</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{step.desc}</p>
              {step.link && (
                <div style={{ marginTop: '12px', fontSize: '12px', color: step.color, display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                  Buka <ArrowRight size={12} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ═══ Gateway Credentials ═══ */}
        <div className="glass-card" style={{ padding: '28px', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={20} style={{ color: 'var(--color-primary)' }} />
            Koneksi Gateway
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                API Base URL (OpenAI Compatible)
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text" readOnly value={aiRouterUrl}
                  style={{
                    flex: 1, padding: '10px 14px', background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-primary)', fontFamily: 'monospace', fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => copyToClipboard(aiRouterUrl, 'url')}
                  style={{
                    padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                    background: copied === 'url' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                    border: '1px solid ' + (copied === 'url' ? 'rgba(34,197,94,0.3)' : 'var(--border-color)'),
                    color: copied === 'url' ? '#22c55e' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {copied === 'url' ? <><Check size={14} /> OK</> : <><Copy size={14} /> Copy</>}
                </button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Model ID (contoh)
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text" readOnly value="mimo"
                  style={{
                    flex: 1, padding: '10px 14px', background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => copyToClipboard('mimo', 'model')}
                  style={{
                    padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                    background: copied === 'model' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                    border: '1px solid ' + (copied === 'model' ? 'rgba(34,197,94,0.3)' : 'var(--border-color)'),
                    color: copied === 'model' ? '#22c55e' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {copied === 'model' ? <><Check size={14} /> OK</> : <><Copy size={14} /> Copy</>}
                </button>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(79,172,254,0.04)', border: '1px solid rgba(79,172,254,0.12)',
            borderRadius: 'var(--radius-sm)', padding: '14px 16px',
            fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6',
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>💡 Format Biaya:</strong>{' '}
            <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px', fontSize: '11px' }}>
              (tokens ÷ 1000) × harga per 1K tokens
            </code>
            {' '}— Harga ditampilkan langsung dalam Rupiah per 1K tokens. Saldo terpotong otomatis setelah request selesai.
          </div>
        </div>

        {/* ═══ Integration Guide ═══ */}
        <div className="glass-card" style={{ padding: '28px', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Code size={20} style={{ color: 'var(--color-success)' }} />
            Panduan Integrasi
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Pilih editor atau platform Anda untuk melihat langkah setup.
          </p>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
            {[
              { id: 'cli-tools', label: 'CLI Tools', icon: Terminal },
              { id: 'cursor', label: 'Cursor IDE' },
              { id: 'cline', label: 'Cline (VS Code)' },
              { id: 'others', label: 'Tool Lainnya' },
              { id: 'nodejs', label: 'Node.js' },
              { id: 'python', label: 'Python' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px', borderRadius: '6px', border: 'none',
                  background: activeTab === tab.id ? 'var(--grad-primary)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                }}
              >
                {tab.icon && <tab.icon size={13} />}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: CLI Tools */}
          {activeTab === 'cli-tools' && (
            <div>
              <CLIToolCards apiKey={null} />
            </div>
          )}

          {/* Tab: Cursor */}
          {activeTab === 'cursor' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Konfigurasi Cursor IDE</h3>
              <ol style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '2.2' }}>
                <li>Buka Cursor → <strong>Settings</strong> (ikon ⚙️ pojok kanan atas)</li>
                <li>Pilih tab <strong>Models</strong> di sidebar kiri</li>
                <li>Di bagian <strong>OpenAI API Key</strong>, masukkan API Key Markaz-Arshy (<code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>sk-xxx...</code>)</li>
                <li>Klik <strong>Override OpenAI Base URL</strong> → masukkan: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px', fontSize: '12px', color: 'var(--color-primary)' }}>{aiRouterUrl}</code></li>
                <li>Tambahkan model ID (misal: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>mimo</code>) di list model</li>
                <li>Aktifkan model → selesai! 🎉</li>
              </ol>
            </div>
          )}

          {/* Tab: Cline */}
          {activeTab === 'cline' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Konfigurasi Cline (VS Code)</h3>
              <ol style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '2.2' }}>
                <li>Buka panel <strong>Cline</strong> di VS Code → klik ikon ⚙️ (Settings)</li>
                <li>Di bagian <strong>API Provider</strong>, pilih <strong>OpenAI Compatible</strong></li>
                <li>Masukkan <strong>Base URL</strong>: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px', fontSize: '12px', color: 'var(--color-primary)' }}>{aiRouterUrl}</code></li>
                <li>Masukkan <strong>API Key</strong> Markaz-Arshy Anda</li>
                <li>Masukkan <strong>Model ID</strong> (misal: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>mimo</code>)</li>
                <li>Simpan → Cline siap digunakan! 🎉</li>
              </ol>
            </div>
          )}

          {/* Tab: Others */}
          {activeTab === 'others' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Integrasi Universal (Hermes, Codex, dll)</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.6' }}>
                Semua aplikasi yang mendukung <strong>OpenAI Compatible API</strong> dapat dihubungkan dengan langkah universal:
              </p>
              <ol style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '2.2' }}>
                <li>Buka menu <strong>Settings</strong> → <strong>API / Model Provider</strong></li>
                <li>Pilih provider: <strong>OpenAI Compatible</strong> atau <strong>Custom</strong></li>
                <li>Masukkan <strong>Base URL</strong>: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px', fontSize: '12px', color: 'var(--color-primary)' }}>{aiRouterUrl}</code></li>
                <li>Masukkan <strong>API Key</strong>: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>sk-xxx...</code></li>
                <li>Masukkan <strong>Model ID</strong> (misal: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>mimo</code>)</li>
                <li>Simpan & test → selesai! 🎉</li>
              </ol>
            </div>
          )}

          {/* Tab: Node.js */}
          {activeTab === 'nodejs' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Node.js SDK</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Instal: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>npm install openai</code>
              </p>
              <CodeBlock language="javascript" code={`import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: '${aiRouterUrl}',
  apiKey: 'sk-xxxxxxxxxxxx' // API Key Markaz-Arshy
});

const completion = await openai.chat.completions.create({
  model: 'mimo',
  messages: [
    { role: 'user', content: 'Halo, apa kabar?' }
  ],
});

console.log(completion.choices[0].message.content);`} />
            </div>
          )}

          {/* Tab: Python */}
          {activeTab === 'python' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Python SDK</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Instal: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>pip install openai</code>
              </p>
              <CodeBlock language="python" code={`from openai import OpenAI

client = OpenAI(
    base_url="${aiRouterUrl}",
    api_key="sk-xxxxxxxxxxxx"  # API Key Markaz-Arshy
)

completion = client.chat.completions.create(
    model="mimo",
    messages=[
        {"role": "user", "content": "Halo, apa kabar?"}
    ]
)

print(completion.choices[0].message.content)`} />
            </div>
          )}
        </div>

        {/* ═══ Model Catalog ═══ */}
        <div className="glass-card" style={{ padding: '28px', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={20} style={{ color: 'var(--color-primary)' }} />
            Katalog Model & Harga
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Harga dalam Rupiah per 1K tokens. Biaya = (tokens ÷ 1000) × harga.
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>Memuat daftar model...</div>
          ) : allModels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>Tidak ada model aktif.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {['Provider', 'Model', 'Model ID', 'Input/1K', 'Output/1K', 'Context'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: h.includes('Input') || h.includes('Output') || h === 'Context' ? 'right' : 'left',
                        color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allModels.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--text-primary)' }}>{m.providerName}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>{m.name}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-secondary)' }}>{m.modelId}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontSize: '12px' }}>
                        Rp {Math.ceil(m.inputPricePer1K).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontSize: '12px' }}>
                        Rp {Math.ceil(m.outputPricePer1K).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {(m.contextWindow / 1000).toFixed(0)}K
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ═══ FAQ ═══ */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HelpCircle size={20} style={{ color: '#f59e0b' }} />
            Pertanyaan Umum (FAQ)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {faqData.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.q}
                answer={faq.a}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
