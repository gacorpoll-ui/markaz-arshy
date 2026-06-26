import React from 'react';
import { Check, X, ExternalLink } from 'lucide-react';

export default function AdminDeposits({ pendingDeposits, handleConfirmDeposit, handleRejectDeposit, loading }) {
    if (loading) return <div style={{ textAlign: 'center', padding: '50px 0' }}>Memuat data deposit...</div>;

    const getStatusBadge = (status) => {
        switch (status) {
          case 'COMPLETED':
          case 'CONFIRMED':
            return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Selesai</span>;
          case 'PENDING':
          case 'PROCESSING':
            return <span className="badge badge-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Diproses</span>;
          default:
            return <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Gagal</span>;
        }
      };

    return (
        <div className="glass-card">
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-default)', paddingBottom: '10px' }}>
                Menunggu Persetujuan Transfer Manual
            </h3>

            {pendingDeposits.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>
                    Tidak ada permohonan deposit baru yang pending.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {pendingDeposits.map(dep => (
                        <div key={dep.id} className="flex-between" style={{ padding: '16px', background: 'var(--bg-page)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}>
                            <div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Deposit ID: #{dep.id} &bull; User ID: {dep.userId}</div>
                                <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>{dep.user.name} ({dep.user.email})</h4>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-primary)', marginTop: '4px' }}>
                                    Rp {dep.amount.toLocaleString('id-ID')}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                    Metode: <strong style={{ color: '#fff' }}>{dep.paymentMethod}</strong>
                                </div>
                                {dep.paymentProof && (
                                    <div style={{ marginTop: '10px' }}>
                                        <a href={`${import.meta.env.VITE_API_BASE_URL}${dep.paymentProof}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <ExternalLink size={12} /> Lihat Bukti Transfer
                                        </a>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => handleRejectDeposit(dep.id)} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
                                    <X size={16} /> Tolak
                                </button>
                                <button onClick={() => handleConfirmDeposit(dep.id)} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                                    <Check size={16} /> Setujui
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
