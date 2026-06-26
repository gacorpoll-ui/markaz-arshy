import React, { useState } from 'react';
import { ArrowUpRight, CheckCircle } from 'lucide-react';

export default function AdminManualBalance({ handleManualBalance }) {
    const [userId, setUserId] = useState('');
    const [action, setAction] = useState('ADD');
    const [amount, setAmount] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        const success = await handleManualBalance(userId, amount, action);
        if (success) {
            setSuccessMessage(`Berhasil memperbarui saldo User #${userId} sebesar Rp ${parseFloat(amount).toLocaleString('id-ID')} (${action === 'ADD' ? 'Penambahan' : 'Pengurangan'}).`);
            setUserId(''); setAmount(''); setAction('ADD');
        }
    };

    return (
        <div className="glass-card" style={{ maxWidth: '560px' }}>
            <div className="adm-card-header">Sesuaikan Saldo Pengguna</div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">User ID</label>
                    <input type="number" className="form-input" placeholder="Contoh: 3" value={userId} onChange={e => setUserId(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Aksi</label>
                    <select className="form-input" value={action} onChange={e => setAction(e.target.value)}>
                        <option value="ADD">Tambah Saldo (+)</option>
                        <option value="SUBTRACT">Kurangi Saldo (-)</option>
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nominal (Rp)</label>
                    <input type="number" className="form-input" placeholder="Contoh: 50000" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                {successMessage && (
                    <div style={{ padding: '12px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: '#047857', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={16} /> {successMessage}
                    </div>
                )}
                <button type="submit" className="btn btn-primary" style={{ padding: '12px' }}>
                    <ArrowUpRight size={16} /> Eksekusi
                </button>
            </form>
        </div>
    );
}
