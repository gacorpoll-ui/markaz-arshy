import React from 'react';
import { Check, X, ExternalLink } from 'lucide-react';

export default function AdminDeposits({ pendingDeposits, handleConfirmDeposit, handleRejectDeposit, loading }) {
    if (loading) return <div className="adm-loading">Memuat data deposit...</div>;
    if (pendingDeposits.length === 0) return <div className="glass-card"><div className="adm-empty">Tidak ada permohonan deposit baru yang pending.</div></div>;

    return (
        <div className="glass-card">
            <div className="adm-card-header">Menunggu Persetujuan Transfer Manual</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingDeposits.map(dep => (
                    <div key={dep.id} className="adm-deposit-item">
                        <div>
                            <div className="adm-deposit-meta">Deposit #{dep.id} &bull; User #{dep.userId}</div>
                            <div className="adm-deposit-user">{dep.user.name} ({dep.user.email})</div>
                            <div className="adm-deposit-amount">Rp {dep.amount.toLocaleString('id-ID')}</div>
                            <div className="adm-deposit-method">Metode: <strong>{dep.paymentMethod}</strong></div>
                            {dep.paymentProof && (
                                <a href={`${import.meta.env.VITE_API_BASE_URL}${dep.paymentProof}`} target="_blank" className="adm-proof-link">
                                    <ExternalLink size={12} /> Lihat Bukti Transfer
                                </a>
                            )}
                        </div>
                        <div className="adm-deposit-actions">
                            <button onClick={() => handleRejectDeposit(dep.id)} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize:'12px' }}>
                                <X size={14} /> Tolak
                            </button>
                            <button onClick={() => handleConfirmDeposit(dep.id)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize:'12px' }}>
                                <Check size={14} /> Setujui
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
