import React, { useState } from 'react';
import { Plus } from 'lucide-react';

export default function AdminPaymentMethods({
    paymentMethods,
    handleAddPaymentMethod,
    handleTogglePaymentMethod,
}) {
    const [name, setName] = useState('');
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [instructions, setInstructions] = useState('');
    const [qrFile, setQrFile] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('name', name);
        formData.append('accountName', accountName);
        formData.append('accountNumber', accountNumber);
        formData.append('instructions', instructions);
        if (qrFile) {
            formData.append('qrImage', qrFile);
        }

        const success = await handleAddPaymentMethod(formData);
        if (success) {
            setName('');
            setAccountName('');
            setAccountNumber('');
            setInstructions('');
            setQrFile(null);
            const fileInput = document.getElementById('qr-file-input');
            if (fileInput) fileInput.value = '';
        }
    };

    return (
        <div className="glass-card">
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                Manajemen Metode Pembayaran & Wallet
              </h3>

              <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '40px' }}>
                <div className="form-group">
                  <label className="form-label">Nama Bank / E-Wallet</label>
                  <input type="text" className="form-input" placeholder="Contoh: DANA, Bank Mandiri" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Pemilik Akun / Rekening</label>
                  <input type="text" className="form-input" placeholder="Atas Nama: Budi Santoso" value={accountName} onChange={e => setAccountName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Nomor Rekening / No. HP</label>
                  <input type="text" className="form-input" placeholder="Contoh: 08123456789" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Instruksi Tambahan (Opsional)</label>
                  <input type="text" className="form-input" placeholder="Contoh: Wajib sertakan kode unik." value={instructions} onChange={e => setInstructions(e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Upload Gambar QRIS (Jika ada)</label>
                  <input id="qr-file-input" type="file" accept="image/png, image/jpeg, image/webp" className="form-input" onChange={e => setQrFile(e.target.files[0])} />
                </div>
                <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>
                    <Plus size={16} /> Tambah Metode
                  </button>
                </div>
              </form>

              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '15px' }}>Daftar Metode Pembayaran</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 10px' }}>ID</th>
                    <th style={{ padding: '12px 10px' }}>Bank/Wallet</th>
                    <th style={{ padding: '12px 10px' }}>A.N (Pemilik)</th>
                    <th style={{ padding: '12px 10px' }}>Nomor/Rekening</th>
                    <th style={{ padding: '12px 10px' }}>QRIS</th>
                    <th style={{ padding: '12px 10px' }}>Status</th>
                    <th style={{ padding: '12px 10px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentMethods.map(pm => (
                    <tr key={pm.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>#{pm.id}</td>
                      <td style={{ padding: '12px 10px', fontWeight: '600', color: '#fff' }}>{pm.name}</td>
                      <td style={{ padding: '12px 10px' }}>{pm.accountName}</td>
                      <td style={{ padding: '12px 10px', fontFamily: 'monospace' }}>{pm.accountNumber}</td>
                      <td style={{ padding: '12px 10px' }}>
                         {pm.qrImage ? <span className="badge badge-premium">Tersedia</span> : <span style={{color: 'var(--text-muted)'}}>-</span>}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                         <span className={`badge ${pm.isActive ? 'badge-success' : 'badge-danger'}`}>
                            {pm.isActive ? 'Aktif' : 'Nonaktif'}
                         </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                         <button onClick={() => handleTogglePaymentMethod(pm.id)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '11px' }}>
                            {pm.isActive ? 'Matikan' : 'Aktifkan'}
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
    );
}
