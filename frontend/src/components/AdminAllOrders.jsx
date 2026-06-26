import React from 'react';

export default function AdminAllOrders({ allOrders, loading }) {
    if (loading) return <div className="adm-loading"><span>Memuat semua pesanan...</span></div>;

    return (
        <div className="adm-card">
            <div className="adm-card-header">Seluruh Order Transaksi Sistem</div>
            {allOrders.length === 0 ? (
                <div className="adm-empty">Belum ada order masuk.</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="adm-table">
                        <thead>
                            <tr><th>ID</th><th>Pengguna</th><th>Produk</th><th>Tipe</th><th>Jml</th><th>Nominal</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {allOrders.map(ord => (
                                <tr key={ord.id}>
                                    <td className="td-id">#{ord.id}</td>
                                    <td><div className="adm-user-cell"><div className="name">{ord.user.name}</div><div className="email">{ord.user.email}</div></div></td>
                                    <td className="td-name">{ord.product.name}</td>
                                    <td><span className={`adm-badge ${ord.type === 'PREMIUM' ? 'adm-badge-info' : 'adm-badge-success'}`}>{ord.type}</span></td>
                                    <td>{ord.quantity}</td>
                                    <td className="td-amt">Rp {ord.amount.toLocaleString('id-ID')}</td>
                                    <td>
                                        <span className={`adm-badge ${ord.status === 'COMPLETED' ? 'adm-badge-success' : ord.status === 'PROCESSING' ? 'adm-badge-pending' : 'adm-badge-danger'}`}>
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
