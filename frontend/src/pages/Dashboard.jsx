import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, History, Send, Shield, Key, ExternalLink, RefreshCw, CheckCircle, Clock, XCircle, Package, Truck } from 'lucide-react';

export default function Dashboard({ user, token, onUpdateUser }) {
  const [orders, setOrders] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [topupAmount, setTopupAmount] = useState('');
  const [physicalOrders, setPhysicalOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingDeposits, setLoadingDeposits] = useState(true);
  const [loadingPhysical, setLoadingPhysical] = useState(true);
  const [topupSuccess, setTopupSuccess] = useState('');
  const [topupError, setTopupError] = useState('');
  const [submittingTopup, setSubmittingTopup] = useState(false);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Hapus [user] untuk mencegah infinite loop

  const fetchDashboardData = async () => {
    try {
      setLoadingOrders(true);
      setLoadingDeposits(true);
      setLoadingPhysical(true);

      // Refresh profile to get updated balance
      const meRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        onUpdateUser(meData.user);
      }

      // Fetch order history
      const ordRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/orders/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordData = await ordRes.json();
      setOrders(ordData.orders || []);
      setLoadingOrders(false);

      // Fetch deposit history
      const depRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/deposits/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const depData = await depRes.json();
      setDeposits(depData.deposits || []);
      setLoadingDeposits(false);

      // Fetch physical orders
      const physRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/orders/history?type=PHYSICAL`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const physData = await physRes.json();
      setPhysicalOrders(physData.orders || []);
      setLoadingPhysical(false);

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  const handleTopupSubmit = async (e) => {
    e.preventDefault();
    setTopupError('');
    setTopupSuccess('');
    setSubmittingTopup(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/deposits/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(topupAmount),
          paymentMethod: 'MANUAL'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit topup.');
      }

      setTopupSuccess(data.instructions);
      setTopupAmount('');
      fetchDashboardData();
    } catch (err) {
      setTopupError(err.message);
    } finally {
      setSubmittingTopup(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'CONFIRMED':
        return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Selesai</span>;
      case 'PENDING':
      case 'PROCESSING':
        return <span className="badge badge-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Diproses</span>;
      default:
        return <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={12} /> Gagal</span>;
    }
  };

  if (!user) return null;

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '100px' }}>
      
      {/* --- HERO DASHBOARD & STATS --- */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: '16px',
        padding: '40px',
        marginBottom: '40px',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div className={`badge ${user.role === 'ADMIN' ? 'badge-premium' : user.role === 'RESELLER' ? 'badge-smm' : 'badge-secondary'}`} style={{ padding: '4px 14px', fontSize: '11px', borderRadius: '99px', fontWeight: '700' }}>
                 {user.role === 'ADMIN' ? 'ADMINISTRATOR' : user.role === 'RESELLER' ? 'RESELLER PARTNER' : 'MEMBER'}
              </div>
              {user.isVerified && <span style={{ color: 'var(--accent-success)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}><CheckCircle size={14} /> Verified</span>}
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.1' }}>
              Hello, <span style={{ color: 'var(--accent-primary)' }}>{user.name.split(' ')[0]}</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '8px', maxWidth: '450px' }}>
              Selamat datang kembali. Semua sistem berjalan normal.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {/* Balance Card */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: '14px',
              padding: '24px',
              minWidth: '260px',
              boxShadow: 'var(--shadow-xs)',
            }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Saldo Wallet</div>
              <div style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '16px', fontWeight: '600' }}>Rp</span>
                {user.balance.toLocaleString('id-ID')}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button onClick={() => navigate('/deposit')} className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '13px' }}>Top Up</button>
                <button onClick={fetchDashboardData} className="btn btn-secondary" style={{ padding: '8px' }}><RefreshCw size={15} /></button>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: '14px',
              padding: '24px',
              minWidth: '180px',
              boxShadow: 'var(--shadow-xs)',
            }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Total Pesanan</div>
              <div style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{orders.length}</div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--accent-success)', fontWeight: '600' }}>
                +{orders.filter(o => o.status === 'COMPLETED').length} Berhasil
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-muted)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-default)', width: 'fit-content', marginBottom: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', color: activeTab === 'orders' ? 'var(--accent-primary)' : 'var(--text-secondary)', background: activeTab === 'orders' ? 'var(--bg-surface)' : 'transparent', boxShadow: activeTab === 'orders' ? 'var(--shadow-sm)' : 'none' }}
          >
            <History size={15} /> Riwayat Pesanan
          </button>
          <button
            onClick={() => setActiveTab('deposits')}
            style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', color: activeTab === 'deposits' ? 'var(--accent-primary)' : 'var(--text-secondary)', background: activeTab === 'deposits' ? 'var(--bg-surface)' : 'transparent', boxShadow: activeTab === 'deposits' ? 'var(--shadow-sm)' : 'none' }}
          >
            <Wallet size={15} /> Riwayat Deposit
          </button>
          <button
            onClick={() => navigate('/dashboard/ai-keys')}
            style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', background: 'transparent' }}
          >
            <Key size={15} /> My API Keys ↗
          </button>
          <button
            onClick={() => setActiveTab('fisik')}
            style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', color: activeTab === 'fisik' ? 'var(--accent-primary)' : 'var(--text-secondary)', background: activeTab === 'fisik' ? 'var(--bg-surface)' : 'transparent', boxShadow: activeTab === 'fisik' ? 'var(--shadow-sm)' : 'none' }}
          >
            <Package size={15} /> Pesanan Fisik
          </button>
        </div>

        {activeTab === 'orders' ? (
          <div className="animate-fade-in">
            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: '100px 0' }}><RefreshCw className="animate-spin" size={32} /></div>
            ) : orders.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '80px 20px' }}>
                <History size={48} style={{ color: 'var(--text-muted)', marginBottom: '20px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>Belum Ada Pesanan</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Jelajahi katalog kami dan mulai tingkatkan kehadiran media sosial Anda.</p>
                <button onClick={() => navigate('/catalog/smm')} className="btn btn-primary">Buka Katalog SMM</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
                {orders.map(order => (
                  <div key={order.id} className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>#{order.id} &bull; {new Date(order.createdAt).toLocaleDateString('id-ID')}</span>
                        <h4 style={{ fontSize: '15px', fontWeight: '700', marginTop: '2px', color: 'var(--text-primary)' }}>{order.product.name}</h4>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div style={{ padding: '20px' }}>
                      {order.type === 'SMM' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          <div style={{ padding: '12px', background: 'var(--bg-page)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Link Target</div>
                            <a href={order.targetUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                               {order.targetUrl.substring(0, 40)}... <ExternalLink size={12} />
                            </a>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Jumlah</div><div style={{ fontSize: '15px', fontWeight: '700' }}>{order.quantity.toLocaleString('id-ID')} Unit</div></div>
                            <div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Biaya</div><div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--accent-primary)' }}>Rp {order.amount.toLocaleString('id-ID')}</div></div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                           {order.account ? (
                             <div style={{ background: 'var(--accent-primary-light)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                <div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Email</div><span style={{ fontWeight: '700' }}>{order.account.email}</span></div>
                                <div style={{ marginTop: '10px' }}><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Password</div><span style={{ fontWeight: '700' }}>{order.account.password}</span></div>
                             </div>
                           ) : (
                             <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-page)', borderRadius: '16px', border: '1px dashed var(--border-default)' }}>
                                <Clock size={24} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Akun sedang disiapkan...</div>
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'deposits' ? (
          /* DEPOSIT HISTORY TAB */
          <div className="animate-fade-in glass-card" style={{ padding: '0', overflow: 'hidden' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border-default)' }}>
                    <th style={{ padding: '20px' }}>ID DEPOSIT</th>
                    <th style={{ padding: '20px' }}>NOMINAL</th>
                    <th style={{ padding: '20px' }}>METODE</th>
                    <th style={{ padding: '20px' }}>STATUS</th>
                    <th style={{ padding: '20px' }}>TANGGAL</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map(dep => (
                    <tr key={dep.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                      <td style={{ padding: '20px', color: 'var(--text-muted)' }}>#{dep.id}</td>
                      <td style={{ padding: '20px', fontWeight: '800', fontSize: '16px', color: 'var(--color-primary)' }}>Rp {dep.amount.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '20px' }}><span className="badge badge-secondary">{dep.paymentMethod}</span></td>
                      <td style={{ padding: '20px' }}>{getStatusBadge(dep.status)}</td>
                      <td style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        {new Date(dep.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        ) : (
          /* PHYSICAL ORDERS TAB */
          <div className="animate-fade-in">
            {loadingPhysical ? (
              <div style={{ textAlign: 'center', padding: '100px 0' }}><RefreshCw className="animate-spin" size={32} /></div>
            ) : physicalOrders.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '80px 20px' }}>
                <Package size={48} style={{ color: 'var(--text-muted)', marginBottom: '20px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>Belum Ada Pesanan Fisik</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Anda belum memesan barang fisik.</p>
                <button onClick={() => navigate('/catalog/fisik')} className="btn btn-primary"><Package size={16} /> Belanja Barang Fisik</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {physicalOrders.map(order => {
                  const ship = order.shippingSnapshot || {};
                  const statusStyles = {
                    PENDING: { color: 'var(--accent-warning)', bg: 'rgba(245,158,11,0.1)', label: 'Menunggu' },
                    PROCESSING: { color: 'var(--accent-primary)', bg: 'var(--accent-primary-light)', label: 'Diproses' },
                    SHIPPING: { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', label: 'Dikirim' },
                    DELIVERED: { color: 'var(--accent-success)', bg: 'rgba(16,185,129,0.1)', label: 'Selesai' },
                  };
                  const st = statusStyles[order.status] || statusStyles.PENDING;
                  return (
                    <div key={order.id} className="glass-card" style={{ padding: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>
                          Pesanan #{order.id} &bull; {new Date(order.createdAt).toLocaleDateString('id-ID')}
                        </div>
                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '6px' }}>{order.product.name}</h4>

                      {/* variant display */}
                      {(() => {
                        try {
                          if (order.selectedVariant) {
                            const v = JSON.parse(order.selectedVariant);
                            return Object.entries(v).map(([k, val]) => (
                              <span key={k} style={{ display: 'inline-block', padding: '1px 8px', borderRadius: '4px', background: '#f5f5f5', fontSize: '11px', color: '#666', marginRight: '6px', marginBottom: '6px' }}>
                                {k}: <strong>{String(val)}</strong>
                              </span>
                            ));
                          }
                        } catch {}
                        return null;
                      })()}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                        <div>Jumlah: <strong>{order.quantity}</strong></div>
                        <div>Total: <strong style={{ color: 'var(--accent-primary)' }}>Rp {order.amount.toLocaleString('id-ID')}</strong></div>
                        {order.courier && <div>Kurir: <strong>{order.courierServiceName || order.courier}</strong></div>}
                        {order.shippingCost > 0 && <div>Ongkir: <strong>Rp {order.shippingCost.toLocaleString('id-ID')}</strong></div>}
                        {order.resi && <div style={{ gridColumn: '1 / -1', background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', color: '#166534' }}>No. Resi: <strong style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}>{order.resi}</strong></span>
                          {order.courierServiceName && <span style={{ fontSize: '11px', color: '#16a34a' }}>({order.courierServiceName})</span>}
                        </div>}
                      </div>

                      {/* Shipping timeline */}
                      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#bbb' }}>
                        <span style={{ color: order.status !== 'PENDING' ? '#22c55e' : '#bbb' }}>✓ Diproses</span>
                        <span style={{ color: '#ddd' }}>—</span>
                        <span style={{ color: order.status === 'SHIPPING' || order.status === 'DELIVERED' ? '#22c55e' : '#bbb' }}>📦 Dikirim{order.shippedAt ? ` ${new Date(order.shippedAt).toLocaleDateString('id-ID')}` : ''}</span>
                        <span style={{ color: '#ddd' }}>—</span>
                        <span style={{ color: order.status === 'DELIVERED' ? '#22c55e' : '#bbb' }}>✅ Selesai</span>
                      </div>

                      {ship.recipientName && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-muted)' }}>
                          Kirim ke: {ship.recipientName} — {ship.fullAddress}, {ship.province}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
