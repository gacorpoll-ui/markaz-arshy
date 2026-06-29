import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Package, CheckCircle, AlertTriangle, RefreshCw, Download, ExternalLink, Truck } from 'lucide-react';

export default function AdminImport({ token }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  // Auto-sync state
  const [mitraEmail, setMitraEmail] = useState('');
  const [mitraPassword, setMitraPassword] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleFile = (f) => {
    if (!f || !f.name.match(/\.(xlsx|xls)$/i)) {
      setError('File harus berupa XLSX atau XLS.');
      return;
    }
    setFile(f);
    setError('');
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/import-jakmall`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal import');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSyncStock = async () => {
    if (!mitraEmail || !mitraPassword) return;
    setSyncing(true);
    setSyncResult(null);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sync-jakmall-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ mitraEmail, mitraPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal sync');
      setSyncResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px' }}>
      {/* ═══ AUTO SYNC SECTION ═══ */}
      <div style={{ background: '#eff6ff', borderRadius: '16px', border: '1px solid #dbeafe', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#1e3a5f' }}>Sinkronisasi Stok Otomatis</h3>
            <p style={{ fontSize: '12px', color: '#3b82f6', margin: '2px 0 0' }}>
              Download data stok langsung dari Mitra
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
          <input type="email" value={mitraEmail} onChange={e => setMitraEmail(e.target.value)}
            placeholder="Email Mitra (riewulan10@gmail.com)"
            style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #93c5fd', fontSize: '13px', background: '#fff', color: '#333' }} />
          <div style={{ position: 'relative' }}>
            <input type={showPassword ? 'text' : 'password'} value={mitraPassword} onChange={e => setMitraPassword(e.target.value)}
              placeholder="Password Mitra"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #93c5fd', fontSize: '13px', background: '#fff', color: '#333', paddingRight: '40px' }} />
            <button onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#93c5fd' }}>
              {showPassword ? 'Sembunyikan' : 'Lihat'}
            </button>
          </div>
        </div>

        <button onClick={handleSyncStock} disabled={!mitraEmail || !mitraPassword || syncing}
          style={{
            width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
            background: !mitraEmail || !mitraPassword ? '#ddd' : '#2563eb',
            color: !mitraEmail || !mitraPassword ? '#999' : '#fff',
            fontSize: '14px', fontWeight: '700', cursor: !mitraEmail || !mitraPassword ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
          {syncing ? <><RefreshCw size={16} className="spin" /> Menyinkronkan...</> : <><Download size={16} /> Sync Stok dari Mitra</>}
        </button>

        {syncResult && (
          <div style={{ background: '#f0fdf4', borderRadius: '10px', border: '1px solid #dcfce7', padding: '16px', marginTop: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle size={16} style={{ color: '#22c55e' }} />
              <span style={{ fontWeight: '700', fontSize: '14px', color: '#166534' }}>Sinkronisasi Selesai</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '12px' }}>
              <div style={{ background: '#fff', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#22c55e' }}>{syncResult.tersedia}</div>
                <div style={{ color: '#999' }}>Stok Tersedia</div>
              </div>
              <div style={{ background: '#fff', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#ef4444' }}>{syncResult.habis}</div>
                <div style={{ color: '#999' }}>Stok Habis</div>
              </div>
              <div style={{ background: '#fff', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#f59e0b' }}>{syncResult.total}</div>
                <div style={{ color: '#999' }}>Total Produk</div>
              </div>
            </div>
            {syncResult.tidakDitemukan > 0 && (
              <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '8px', textAlign: 'center' }}>
                {syncResult.tidakDitemukan} SKU tidak ditemukan di database
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ MANUAL IMPORT SECTION ═══ */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #eee', padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 4px' }}>Import Produk dari File</h2>
        <p style={{ fontSize: '12px', color: '#999', margin: '0 0 16px' }}>Upload file XLSX export dari Mitra</p>

        <div style={{ background: '#fafafa', borderRadius: '10px', border: '1px solid #eee', padding: '16px', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: '700', margin: '0 0 8px' }}>Cara mendapatkan file export:</h4>
          <ol style={{ fontSize: '11px', color: '#666', lineHeight: 2, margin: 0, paddingLeft: '16px' }}>
            <li>Login ke <a href="https://partner.jakmall.com" target="_blank" rel="noopener noreferrer" style={{ color: '#e74c3c' }}>partner.jakmall.com <ExternalLink size={9} /></a> atau <a href="https://www.jakmall.com/mitra/inventory?tab=inventory-export" target="_blank" rel="noopener noreferrer" style={{ color: '#e74c3c' }}>Mitra → Export <ExternalLink size={9} /></a></li>
            <li>Klik <strong>Download</strong> untuk download file XLSX inventory</li>
            <li>Upload file di sini</li>
          </ol>
        </div>

        <div onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent-primary)' : error ? '#e74c3c' : '#ddd'}`,
            borderRadius: '12px', padding: '30px 20px', textAlign: 'center', cursor: 'pointer',
            background: dragOver ? 'rgba(99,102,241,0.04)' : '#fafafa',
            transition: 'all 0.2s', marginBottom: '14px',
          }}>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={e => handleFile(e.target.files[0])} style={{ display: 'none' }} />
          {file ? (
            <div>
              <FileSpreadsheet size={36} style={{ color: '#22c55e', marginBottom: '10px' }} />
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>{file.name}</div>
              <div style={{ fontSize: '12px', color: '#999' }}>{(file.size / 1024).toFixed(1)} KB</div>
            </div>
          ) : (
            <div>
              <Upload size={32} style={{ color: '#ccc', marginBottom: '10px' }} />
              <div style={{ fontWeight: '600', fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                Tarik file XLSX ke sini
              </div>
              <div style={{ fontSize: '11px', color: '#bbb' }}>atau klik untuk memilih file</div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(231,76,60,0.08)', color: '#e74c3c', fontSize: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {result && (
          <div style={{ background: '#f0fdf4', borderRadius: '10px', border: '1px solid #dcfce7', padding: '16px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <CheckCircle size={18} style={{ color: '#22c55e' }} />
              <span style={{ fontWeight: '700', fontSize: '14px', color: '#166534' }}>Import Berhasil!</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '12px' }}>
              <div style={{ background: '#fff', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#22c55e' }}>{result.created}</div>
                <div style={{ color: '#999' }}>Produk Baru</div>
              </div>
              <div style={{ background: '#fff', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#6366f1' }}>{result.updated}</div>
                <div style={{ color: '#999' }}>Diperbarui</div>
              </div>
              <div style={{ background: '#fff', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#f59e0b' }}>{result.total}</div>
                <div style={{ color: '#999' }}>Total</div>
              </div>
            </div>
          </div>
        )}

        <button onClick={handleUpload} disabled={!file || uploading}
          style={{
            width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
            background: !file ? '#e0e0e0' : '#e74c3c',
            color: !file ? '#999' : '#fff',
            fontSize: '13px', fontWeight: '700', cursor: !file ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
          {uploading ? <><RefreshCw size={16} className="spin" /> Mengimport...</> : <><Upload size={16} /> Import Produk</>}
        </button>
      </div>
    </div>
  );
}
