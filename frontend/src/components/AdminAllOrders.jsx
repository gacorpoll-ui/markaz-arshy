import React from 'react';

export default function AdminAllOrders({ allOrders, loading }) {
    if (loading) return <div style={{ textAlign: 'center', padding: '50px 0' }}>Memuat semua pesanan...</div>;

    return (
        <div className="glass-card">
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                Seluruh Order Transaksi Sistem
            </h3>

            {allOrders.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Belum ada order masuk.</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '12px 10px' }}>ID</th>
                        <th style={{ padding: '12px 10px' }}>Pengguna</th>
                        <th style={{ padding: '12px 10px' }}>Produk</th>
                        <th style={{ padding: '12px 10px' }}>Tipe</th>
                        <th style={{ padding: '12px 10px' }}>Jumlah</th>
                        <th style={{ padding: '12px 10px' }}>Nominal</th>
                        <th style={{ padding: '12px 10px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allOrders.map(ord => (
                        <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>#{ord.id}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <strong style={{ color: '#fff' }}>{ord.user.name}</strong><br />
                            <span style={{ color: 'var(--text-muted)' }}>{ord.user.email}</span>
                          </td>
                          <td style={{ padding: '12px 10px', fontWeight: '600' }}>{ord.product.name}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span className={`badge ${ord.type === 'PREMIUM' ? 'badge-premium' : 'badge-smm'}`}>{ord.type}</span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>{ord.quantity}</td>
                          <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>Rp {ord.amount.toLocaleString('id-ID')}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span className={`badge ${ord.status === 'COMPLETED' ? 'badge-success' : ord.status === 'PROCESSING' ? 'badge-pending' : 'badge-danger'}`}>
                              {ord.status}
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
