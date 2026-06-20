import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, History, Send, Shield, Key, ExternalLink, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function Dashboard({ user, token, onUpdateUser }) {
  const [orders, setOrders] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [topupAmount, setTopupAmount] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingDeposits, setLoadingDeposits] = useState(true);
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
        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(225, 48, 108, 0.08) 100%)',
        borderRadius: '30px',
        padding: '40px',
        marginBottom: '40px',
        border: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '30px' }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
              <div className={`badge ${user.role === 'ADMIN' ? 'badge-premium' : user.role === 'RESELLER' ? 'badge-smm' : 'badge-secondary'}`} style={{ padding: '8px 20px', fontSize: '12px', borderRadius: '50px', fontWeight: '800', letterSpacing: '1px' }}>
                 ✨ {user.role === 'ADMIN' ? 'ADMINISTRATOR' : user.role === 'RESELLER' ? 'RESELLER PARTNER' : 'MEMBER PREMIUM'}
              </div>
              {user.isVerified && <span style={{ color: 'var(--color-success)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}><CheckCircle size={16} /> Verified</span>}
            </div>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '42px', fontWeight: '900', color: '#fff', lineHeight: '1.1' }}>
              Hello, <span className="text-gradient">{user.name.split(' ')[0]}!</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginTop: '12px', maxWidth: '450px' }}>
              Selamat datang kembali. Semua sistem berjalan normal. Anda siap untuk meledakkan interaksi sosial media hari ini?
            </p>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {/* Balance Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '25px',
              minWidth: '280px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Saldo Wallet</div>
              <div style={{ fontSize: '36px', fontWeight: '900', fontFamily: 'var(--font-title)', color: 'var(--color-primary)', display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                <span style={{ fontSize: '18px', fontWeight: '600' }}>Rp</span>
                {user.balance.toLocaleString('id-ID')}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => navigate('/deposit')} className="btn btn-primary" style={{ flex: 1, padding: '10px', fontSize: '13px', borderRadius: '10px' }}>
                   Top Up
                </button>
                <button onClick={fetchDashboardData} className="btn btn-secondary" style={{ padding: '10px', borderRadius: '10px' }}>
                   <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '25px',
              minWidth: '200px',
            }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Total Pesanan</div>
              <div style={{ fontSize: '36px', fontWeight: '900', fontFamily: 'var(--font-title)', color: '#fff' }}>
                {orders.length}
              </div>
              <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--color-success)', fontWeight: '600' }}>
                +{orders.filter(o => o.status === 'COMPLETED').length} Berhasil
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border-color)', width: 'fit-content', marginBottom: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '8px', color: activeTab === 'orders' ? '#070913' : 'var(--text-secondary)', background: activeTab === 'orders' ? 'var(--color-primary)' : 'transparent' }}
          >
            <History size={17} /> Riwayat Pesanan
          </button>
          <button
            onClick={() => setActiveTab('deposits')}
            style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '8px', color: activeTab === 'deposits' ? '#070913' : 'var(--text-secondary)', background: activeTab === 'deposits' ? 'var(--color-primary)' : 'transparent' }}
          >
            <Wallet size={17} /> Riwayat Deposit
          </button>
          <button
            onClick={() => navigate('/dashboard/ai-keys')}
            style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', background: 'transparent' }}
          >
            <Key size={17} /> My API Keys ↗
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
                  <div key={order.id} className="glass-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    {/* Card Header */}
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>#{order.id} &bull; {new Date(order.createdAt).toLocaleDateString('id-ID')}</span>
                        <h4 style={{ fontSize: '16px', fontWeight: '800', marginTop: '4px' }}>{order.product.name}</h4>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    {/* Card Content */}
                    <div style={{ padding: '20px' }}>
                      {order.type === 'SMM' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Link Target</div>
                            <a href={order.targetUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                               {order.targetUrl.substring(0, 40)}... <ExternalLink size={12} />
                            </a>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                               <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Jumlah</div>
                               <div style={{ fontSize: '15px', fontWeight: '700' }}>{order.quantity.toLocaleString('id-ID')} Unit</div>
                            </div>
                            <div>
                               <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Biaya</div>
                               <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-primary)' }}>Rp {order.amount.toLocaleString('id-ID')}</div>
                            </div>
                          </div>
                          {order.notes && (
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                               💡 {order.notes}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* PREMIUM LAYOUT */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                           {order.account ? (
                             <div style={{ background: 'rgba(0, 242, 254, 0.05)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(0, 242, 254, 0.1)' }}>
                                <div style={{ marginBottom: '15px' }}>
                                   <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>Email / Username</div>
                                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontWeight: '700', color: '#fff', fontSize: '15px' }}>{order.account.email}</span>
                                      <button onClick={() => { navigator.clipboard.writeText(order.account.email); alert('Email disalin!'); }} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}><Key size={16} /></button>
                                   </div>
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                   <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>Password</div>
                                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontWeight: '700', color: '#fff', fontSize: '15px' }}>{order.account.password}</span>
                                      <button onClick={() => { navigator.clipboard.writeText(order.account.password); alert('Password disalin!'); }} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}><Key size={16} /></button>
                                   </div>
                                </div>
                                {order.account.extraInfo && (
                                   <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>Informasi Tambahan / Catatan</div>
                                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                         {order.account.extraInfo}
                                      </div>
                                   </div>
                                )}
                             </div>
                           ) : order.notes && order.status === 'COMPLETED' ? (
                             <div style={{ background: 'rgba(0, 242, 254, 0.05)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(0, 242, 254, 0.1)' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>Detail Akun / Kode SN</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                                   <span style={{ fontWeight: '700', color: '#fff', fontSize: '15px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', flex: 1 }}>{order.notes}</span>
                                   <button onClick={() => { navigator.clipboard.writeText(order.notes); alert('Detail akun disalin!'); }} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', flexShrink: 0 }}><Key size={16} /></button>
                                </div>
                             </div>
                           ) : (
                             <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                                <Clock size={24} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Akun sedang disiapkan oleh sistem...</div>
                                {order.notes && (
                                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic', background: 'rgba(0,0,0,0.1)', padding: '5px 10px', borderRadius: '6px' }}>
                                    {order.notes}
                                  </div>
                                )}
                             </div>
                           )}
                           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                              {order.selectedDuration && (
                                <div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Durasi</div>
                                  <div style={{ fontSize: '14px', fontWeight: '700' }}>{order.selectedDuration}</div>
                                </div>
                              )}
                              {order.selectedOs && (
                                <div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>OS</div>
                                  <div style={{ fontSize: '14px', fontWeight: '700' }}>{order.selectedOs}</div>
                                </div>
                              )}
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* DEPOSIT HISTORY TAB */
          <div className="animate-fade-in glass-card" style={{ padding: '0', overflow: 'hidden' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '20px' }}>ID DEPOSIT</th>
                    <th style={{ padding: '20px' }}>NOMINAL</th>
                    <th style={{ padding: '20px' }}>METODE</th>
                    <th style={{ padding: '20px' }}>STATUS</th>
                    <th style={{ padding: '20px' }}>TANGGAL</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map(dep => (
                    <tr key={dep.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
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
        )}
      </div>
    </div>
  );
}
