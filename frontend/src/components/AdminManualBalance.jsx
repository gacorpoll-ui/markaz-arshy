import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function AdminManualBalance({
    handleManualBalance,
}) {
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
            setUserId('');
            setAmount('');
            setAction('ADD');
        }
    };

    return (
        <div className="glass-card">
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                Sesuaikan Saldo Pengguna secara Manual
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">User ID Pengguna (Dapat dicari di tabel Approval/Order)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Contoh: 3"
                    value={userId}
                    onChange={e => setUserId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Aksi Saldo</label>
                  <select className="form-input" value={action} onChange={e => setAction(e.target.value)}>
                    <option value="ADD">Tambah Saldo (+)</option>
                    <option value="SUBTRACT">Kurangi Saldo (-)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nominal Penyesuaian Saldo (Rp)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Contoh: 50000"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                  />
                </div>

                {successMessage && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 15px',
                    color: '#a7f3d0',
                    fontSize: '13px',
                    marginBottom: '10px'
                  }}>
                    {successMessage}
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ padding: '12px', marginTop: '10px' }}>
                  <ArrowUpRight size={16} /> Eksekusi Penyesuaian Saldo
                </button>
              </form>
            </div>
    );
}
