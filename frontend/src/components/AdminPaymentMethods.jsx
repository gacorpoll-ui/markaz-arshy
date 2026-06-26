import React, { useState, useRef } from 'react';
import { Plus, Ban, Check } from 'lucide-react';

export default function AdminPaymentMethods({ paymentMethods, handleAddPaymentMethod, handleTogglePaymentMethod }) {
    const [name, setName] = useState('');
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [instructions, setInstructions] = useState('');
    const [qrFile, setQrFile] = useState(null);
    const fileRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', name);
        formData.append('accountName', accountName);
        formData.append('accountNumber', accountNumber);
        formData.append('instructions', instructions);
        if (qrFile) formData.append('qrImage', qrFile);
        const success = await handleAddPaymentMethod(formData);
        if (success) {
            setName(''); setAccountName(''); setAccountNumber(''); setInstructions(''); setQrFile(null);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    return (
        <div className="glass-card">
            <div className="adm-card-header">Manajemen Metode Pembayaran</div>
            <form onSubmit={handleSubmit} className="adm-form-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Bank / E-Wallet</label>
                    <input type="text" className="form-input" placeholder="DANA, Bank Mandiri" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nama Pemilik</label>
                    <input type="text" className="form-input" placeholder="Budi Santoso" value={accountName} onChange={e => setAccountName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">No. Rekening / No. HP</label>
                    <input type="text" className="form-input" placeholder="08123456789" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Instruksi (Opsional)</label>
                    <input type="text" className="form-input" placeholder="Sertakan kode unik" value={instructions} onChange={e => setInstructions(e.target.value)} />
                </div>
                <div className="adm-form-full form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">QRIS (opsional)</label>
                    <input ref={fileRef} type="file" accept="image/png, image/jpeg, image/webp" className="form-input" onChange={e => setQrFile(e.target.files[0])} />
                </div>
                <div className="adm-form-actions">
                    <button type="submit" className="btn btn-primary"><Plus size={16} /> Tambah Metode</button>
                </div>
            </form>

            <div className="adm-card-header-sm">Daftar Metode Pembayaran</div>
            {paymentMethods.length === 0 ? (
                <div className="adm-empty">Belum ada metode pembayaran.</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="adm-table">
                        <thead>
                            <tr><th>ID</th><th>Bank/Wallet</th><th>Pemilik</th><th>Nomor</th><th>QRIS</th><th>Status</th><th>Aksi</th></tr>
                        </thead>
                        <tbody>
                            {paymentMethods.map(pm => (
                                <tr key={pm.id}>
                                    <td style={{ color: 'var(--text-muted)' }}>#{pm.id}</td>
                                    <td style={{ fontWeight: 600 }}>{pm.name}</td>
                                    <td>{pm.accountName}</td>
                                    <td style={{ fontFamily: 'monospace' }}>{pm.accountNumber}</td>
                                    <td>{pm.qrImage ? <span className="badge badge-premium">Ada</span> : <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                                    <td><span className={`badge ${pm.isActive ? 'badge-success' : 'badge-danger'}`}>{pm.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
                                    <td>
                                        <button onClick={() => handleTogglePaymentMethod(pm.id)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '11px' }}>
                                            {pm.isActive ? <><Ban size={12} /> Matikan</> : <><Check size={12} /> Aktifkan</>}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
