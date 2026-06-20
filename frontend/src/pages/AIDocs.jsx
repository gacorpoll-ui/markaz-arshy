import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Cpu, Key, ArrowRight, HelpCircle, Code, Settings, Copy, Info } from 'lucide-react';

export default function AIDocs() {
  const aiRouterUrl = import.meta.env.VITE_AI_ROUTER_PUBLIC_URL || 'https://ai.markaz-arshy.com/v1';
  const [activeTab, setActiveTab] = useState('cursor');
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const copyToClipboard = (text, message) => {
    navigator.clipboard.writeText(text);
    alert(message || 'Copied to clipboard!');
  };

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '50px', paddingBottom: '80px', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <div style={{
          display: 'inline-flex',
          padding: '10px 20px',
          borderRadius: '9999px',
          background: 'rgba(79, 172, 254, 0.1)',
          border: '1px solid rgba(79, 172, 254, 0.2)',
          marginBottom: '16px',
        }}>
          <Cpu size={18} style={{ color: 'var(--color-primary)', marginRight: '8px', marginTop: '2px' }} />
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)' }}>
            Pusat Dokumentasi & Panduan AI
          </span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-title)',
          fontSize: '40px',
          fontWeight: '800',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Panduan Integrasi AI Router Markaz-Arshy
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          Mulai integrasikan model AI tercanggih (GPT-4o, Claude 3.5 Sonnet, Gemini Pro) ke dalam alur koding Anda dengan satu API Key terpusat.
        </p>
      </div>

      {/* Grid: Steps & Config */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', marginBottom: '50px' }}>
        
        {/* Step-by-Step Guide */}
        <div className="glass-card" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ padding: '6px', background: 'rgba(79, 172, 254, 0.1)', borderRadius: '6px', display: 'inline-flex' }}>
              <Settings size={18} style={{ color: 'var(--color-primary)' }} />
            </span>
            Langkah Memulai (Quickstart)
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>1</div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>Buat Akun & Top Up Saldo</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Daftarkan diri Anda di Markaz-Arshy lalu lakukan top up saldo utama Anda melalui sistem pembayaran otomatis kami di menu <Link to="/deposit" style={{ color: 'var(--color-primary)' }}>Deposit</Link>.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>2</div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>Buat API Key Baru</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Masuk ke menu <Link to="/dashboard/ai-keys" style={{ color: 'var(--color-primary)' }}>My API Keys</Link>, klik tombol **Create New Key**, beri nama kunci API Anda, dan alokasikan kredit awal dari saldo utama Anda.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>3</div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>Hubungkan Kunci API ke Tool Anda</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Salin API Key Anda (`ma-...`) beserta **API Base URL** yang tertera dan masukkan ke dalam aplikasi koding Anda seperti Cursor IDE atau Cline.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Global Connection Info */}
        <div className="glass-card" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ padding: '6px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '6px', display: 'inline-flex' }}>
              <Info size={18} style={{ color: 'var(--color-secondary)' }} />
            </span>
            Kredensial Gateway
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
              API Base URL (OpenAI Compatible)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                readOnly 
                value={aiRouterUrl} 
                className="form-input" 
                style={{ fontFamily: 'monospace', fontSize: '13px', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', flex: 1 }} 
              />
              <button 
                onClick={() => copyToClipboard(aiRouterUrl, 'Copied Base URL!')}
                className="btn btn-secondary" 
                style={{ padding: '0 16px', height: '42px', fontSize: '13px' }}
              >
                Copy
              </button>
            </div>
          </div>

          <div style={{ background: 'rgba(79, 172, 254, 0.03)', border: '1px solid rgba(79, 172, 254, 0.1)', borderRadius: 'var(--radius-sm)', padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>💡 Penjelasan API Key:</strong>
            API Key Anda (contoh `ma-xxxx...`) digunakan untuk mengautentikasi setiap request ke gateway. Saldo kredit AI Anda akan otomatis terpotong per request secara real-time berdasarkan pemakaian token.
          </div>
        </div>

      </div>

      {/* Integration Guide Tabs Section */}
      <div className="glass-card" style={{ padding: '40px 30px', marginBottom: '50px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ padding: '6px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', display: 'inline-flex' }}>
            <Code size={18} style={{ color: 'var(--color-success)' }} />
          </span>
          Panduan Integrasi Editor & SDK
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '30px' }}>
          Pilih editor koding atau platform di bawah untuk melihat langkah-langkah settingnya.
        </p>

        {/* Tabs Headers */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '30px', gap: '10px', overflowX: 'auto' }}>
          <button 
            className={`tab-btn ${activeTab === 'cursor' ? 'active' : ''}`}
            onClick={() => setActiveTab('cursor')}
            style={{ padding: '12px 24px', background: 'transparent', border: 'none', color: activeTab === 'cursor' ? 'var(--color-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'cursor' ? '2px solid var(--color-primary)' : 'none', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Cursor IDE
          </button>
          <button 
            className={`tab-btn ${activeTab === 'cline' ? 'active' : ''}`}
            onClick={() => setActiveTab('cline')}
            style={{ padding: '12px 24px', background: 'transparent', border: 'none', color: activeTab === 'cline' ? 'var(--color-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'cline' ? '2px solid var(--color-primary)' : 'none', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Cline (VS Code Extension)
          </button>
          <button 
            className={`tab-btn ${activeTab === 'others' ? 'active' : ''}`}
            onClick={() => setActiveTab('others')}
            style={{ padding: '12px 24px', background: 'transparent', border: 'none', color: activeTab === 'others' ? 'var(--color-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'others' ? '2px solid var(--color-primary)' : 'none', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Hermes / OpenClaw / Codex
          </button>
          <button 
            className={`tab-btn ${activeTab === 'nodejs' ? 'active' : ''}`}
            onClick={() => setActiveTab('nodejs')}
            style={{ padding: '12px 24px', background: 'transparent', border: 'none', color: activeTab === 'nodejs' ? 'var(--color-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'nodejs' ? '2px solid var(--color-primary)' : 'none', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Node.js SDK
          </button>
          <button 
            className={`tab-btn ${activeTab === 'python' ? 'active' : ''}`}
            onClick={() => setActiveTab('python')}
            style={{ padding: '12px 24px', background: 'transparent', border: 'none', color: activeTab === 'python' ? 'var(--color-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'python' ? '2px solid var(--color-primary)' : 'none', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Python SDK
          </button>
        </div>

        {/* Tab Content: Cursor */}
        {activeTab === 'cursor' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Cara Konfigurasi di Cursor IDE</h3>
              <ol style={{ fontSize: '14px', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '2' }}>
                <li>Buka Cursor IDE dan masuk ke **Cursor Settings** (ikon roda gigi di pojok kanan atas).</li>
                <li>Pilih tab **Models** di bilah sisi kiri.</li>
                <li>Cari seksi **OpenAI API Key** lalu klik tombol expand/setting.</li>
                <li>Klik tombol **Override OpenAI Base URL** dan masukkan Base URL:<br />
                  <code style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', color: 'var(--color-primary)', fontFamily: 'monospace' }}>{aiRouterUrl}</code>
                </li>
                <li>Masukkan API Key Markaz-Arshy Anda (`ma-...`) ke kolom API Key.</li>
                <li>Tambahkan nama model yang ingin Anda gunakan secara manual di list model (misal: `gpt-4o-mini`, `claude-3-5-sonnet`, `gemini-1.5-flash`).</li>
                <li>Aktifkan model tersebut dan Anda siap melakukan coding dengan AI!</li>
              </ol>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '40px', textAlign: 'center' }}>
              <div>
                <Cpu size={48} style={{ color: 'var(--color-primary)', marginBottom: '16px', opacity: 0.5 }} />
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>Cursor Model Override</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto' }}>Mengatur Base URL dan model manual adalah kunci untuk terhubung ke gateway router.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Cline */}
        {activeTab === 'cline' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Cara Konfigurasi di Cline (VS Code)</h3>
              <ol style={{ fontSize: '14px', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '2' }}>
                <li>Buka panel Cline di VS Code, lalu klik ikon **Settings** (roda gigi).</li>
                <li>Pada bagian **API Provider**, pilih **OpenAI Compatible**.</li>
                <li>Pada kolom **Base URL**, masukkan:<br />
                  <code style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', color: 'var(--color-primary)', fontFamily: 'monospace' }}>{aiRouterUrl}</code>
                </li>
                <li>Pada kolom **API Key**, masukkan API Key Markaz-Arshy Anda.</li>
                <li>Pada kolom **Model ID**, ketik model yang Anda inginkan (misal: `gpt-4o-mini` atau `claude-3-5-sonnet-20241022`).</li>
                <li>Cline siap membantu Anda menganalisis dan menulis kode program!</li>
              </ol>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '40px', textAlign: 'center' }}>
              <div>
                <Code size={48} style={{ color: 'var(--color-secondary)', marginBottom: '16px', opacity: 0.5 }} />
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>Penyedia Kompatibel OpenAI</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto' }}>Gunakan OpenAI-compatible provider di Cline agar API key kita bisa terverifikasi.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Node.js SDK */}
        {activeTab === 'nodejs' && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Integrasi dengan Node.js SDK (library `openai`)</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Instal SDK OpenAI secara resmi menggunakan npm: `npm install openai`, lalu inisialisasi client dengan setelan URL khusus gateway.
            </p>
            <pre style={{ 
              background: 'rgba(0, 0, 0, 0.4)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '20px', 
              fontSize: '13px', 
              fontFamily: 'monospace', 
              color: '#d4d4d4', 
              overflowX: 'auto',
              lineHeight: '1.6'
            }}>
{`import OpenAI from 'openai';

// Inisialisasi client menunjuk ke gateway AI Router Markaz-Arshy
const openai = new OpenAI({
  baseURL: '${aiRouterUrl}',
  apiKey: 'ma-xxxxxxxxxxxxxxxxx' // Masukkan API Key Anda di sini
});

async function main() {
  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Ketik model ID yang Anda inginkan
      messages: [
        { role: 'system', content: 'Kamu adalah asisten pemrograman yang andal.' },
        { role: 'user', content: 'Jelaskan cara kerja event loop di Javascript secara singkat.' }
      ],
    });

    console.log('Respon AI:', chatCompletion.choices[0].message.content);
  } catch (error) {
    console.error('Terjadi error:', error.message);
  }
}

main();`}
            </pre>
          </div>
        )}

        {/* Tab Content: Python SDK */}
        {activeTab === 'python' && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Integrasi dengan Python SDK (library `openai`)</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Instal SDK menggunakan pip: `pip install openai`, lalu inisialisasi client Anda dengan detail di bawah ini.
            </p>
            <pre style={{ 
              background: 'rgba(0, 0, 0, 0.4)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '20px', 
              fontSize: '13px', 
              fontFamily: 'monospace', 
              color: '#d4d4d4', 
              overflowX: 'auto',
              lineHeight: '1.6'
            }}>
{`from openai import OpenAI

# Inisialisasi client dengan menunjuk ke Base URL AI Router Markaz-Arshy
client = OpenAI(
    base_url="${aiRouterUrl}",
    api_key="ma-xxxxxxxxxxxxxxxxx" # Masukkan API Key Anda di sini
)

try:
    completion = client.chat.completions.create(
        model="gpt-4o-mini", # Pilih model ID yang tersedia
        messages=[
            {"role": "system", "content": "Kamu adalah asisten pemrograman yang ramah."},
            {"role": "user", "content": "Tuliskan kode python untuk membalikkan string."}
        ]
    )

    print("Respon AI:", completion.choices[0].message.content)
except Exception as e:
    print("Error:", str(e))`}
            </pre>
          </div>
        )}

        {/* Tab Content: Others (Hermes, OpenClaw, Codex) */}
        {activeTab === 'others' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Cara Integrasi di Hermes, OpenClaw, Codex, dll.</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.6' }}>
                Hampir semua aplikasi pihak ketiga yang mendukung integrasi API kustom (OpenAI-compatible) dapat dihubungkan dengan AI Markaz-Arshy menggunakan langkah universal berikut:
              </p>
              <ol style={{ fontSize: '14px', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '2' }}>
                <li>Buka menu pengaturan API atau integrasi model pada aplikasi Anda.</li>
                <li>Pilih jenis provider: **OpenAI Compatible**, **Custom Provider**, atau **Local/Third-Party**.</li>
                <li>Pada kolom **API Base URL** atau **API Endpoint**, masukkan:<br />
                  <code style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', color: 'var(--color-primary)', fontFamily: 'monospace' }}>{aiRouterUrl}</code>
                </li>
                <li>Pada kolom **API Key** atau **Bearer Token**, masukkan API Key Anda (`ma-...`).</li>
                <li>Pada kolom **Model Name** / **Model ID**, ketik secara manual nama model yang aktif (misal: `gpt-4o-mini`, `claude-3-5-sonnet`, `gemini-1.5-flash`).</li>
                <li>Simpan konfigurasi dan uji coba chat/completion.</li>
              </ol>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '40px', textAlign: 'center' }}>
              <div>
                <Settings size={48} style={{ color: 'var(--color-primary)', marginBottom: '16px', opacity: 0.5 }} />
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>Integrasi Kompatibilitas Penuh</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto' }}>Seluruh model di Markaz-Arshy mengikuti format API OpenAI resmi sehingga kompatibel dengan ribuan aplikasi AI modern di internet.</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Model Catalog & Pricing List */}
      <div className="glass-card" style={{ padding: '30px', marginBottom: '50px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ padding: '6px', background: 'rgba(79, 172, 254, 0.1)', borderRadius: '6px', display: 'inline-flex' }}>
            <Cpu size={18} style={{ color: 'var(--color-primary)' }} />
          </span>
          Katalog Model & Estimasi Biaya
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Berikut adalah daftar model yang saat ini diaktifkan oleh admin beserta rincian biaya tokennya.
        </p>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>Memuat daftar model...</div>
        ) : providers.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>Tidak ada model yang aktif saat ini.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)' }}>Provider</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)' }}>Nama Model</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)' }}>Model ID</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>Harga Input / 1M Token</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>Harga Output / 1M Token</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>Context</th>
                </tr>
              </thead>
              <tbody>
                {providers.flatMap(p => p.models.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px', color: 'var(--text-primary)', fontWeight: '600' }}>{p.name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{m.name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '12px' }}>{m.modelId}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>
                      Rp {Math.ceil(m.inputPricePerToken * 1000 * 15000).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>
                      Rp {Math.ceil(m.outputPricePerToken * 1000 * 15000).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>
                      {(m.contextWindow / 1000).toFixed(0)}K
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Frequently Asked Questions */}
      <div className="glass-card" style={{ padding: '30px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ padding: '6px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', display: 'inline-flex' }}>
            <HelpCircle size={18} style={{ color: '#ef4444' }} />
          </span>
          Pertanyaan yang Sering Diajukan (FAQ)
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>Bagaimana sistem pemotongan saldo bekerja?</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Setiap kali Anda mengirim perintah (request) ke AI Router, gateway 9router akan mencatat total token input (prompt) dan output (respon). Setelah request selesai, saldo kredit yang Anda alokasikan pada API Key tersebut akan otomatis dipotong secara real-time berdasarkan harga per model yang Anda gunakan.
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>Apa yang terjadi jika saldo kredit API Key saya habis?</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Jika saldo kredit pada API key Anda habis (mencapai Rp 0 atau di bawahnya), request AI selanjutnya akan ditolak dengan error `402 Insufficient credits`. Anda dapat menambah (top up) kredit ke API Key tersebut kapan saja mengambil dari saldo utama akun Markaz-Arshy Anda.
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>Dapatkah saya membatasi API Key saya untuk model tertentu saja?</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Ya! Saat membuat API Key baru di dashboard, Anda dapat membatasi kunci tersebut agar hanya dapat digunakan untuk memanggil satu model khusus, atau memilih opsi "All Models" jika ingin mengizinkan akses ke semua model yang terdaftar.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
