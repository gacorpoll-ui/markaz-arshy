import React from 'react';

export default function AdminAllOrders({ allOrders, loading }) {
    if (loading) return <div className="adm-loading">Memuat semua pesanan...</div>;

    return (
        <div className="glass-card">
            <div className="adm-card-header">Seluruh Order Transaksi Sistem</div>

            {allOrders.length === 0 ? (
                <div className="adm-empty">Belum ada order masuk.</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Pengguna</th>
                                <th>Produk</th>
                                <th>Tipe</th>
                                <th>Jml</th>
                                <th>Nominal</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allOrders.map(ord => (
                                <tr key={ord.id}>
                                    <td style={{ color: 'var(--text-muted)' }}>#{ord.id}</td>
                                    <td>
                                        <div className="adm-user-name">{ord.user.name}</div>
                                        <div className="adm-user-email">{ord.user.email}</div>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{ord.product.name}</td>
                                    <td>
                                        <span className={`badge ${ord.type === 'PREMIUM' ? 'badge-premium' : 'badge-smm'}`}>{ord.type}</span>
                                    </td>
                                    <td>{ord.quantity}</td>
                                    <td style={{ fontWeight: 700 }}>Rp {ord.amount.toLocaleString('id-ID')}</td>
                                    <td>
                                        <span className={`adm-status ${ord.status === 'COMPLETED' ? 'adm-status-success' : ord.status === 'PROCESSING' ? 'adm-status-pending' : 'adm-status-danger'}`}>
                                            {ord.status === 'COMPLETED' ? '✅ Selesai' : ord.status === 'PROCESSING' ? '⏳ Proses' : '❌ Gagal'}
                                        </span>
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
