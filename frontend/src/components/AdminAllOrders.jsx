import React, { useState, useEffect } from 'react';
import { BarChart2, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
const TYPE_OPTIONS = ['PREMIUM', 'SMM', 'PHYSICAL'];
const LIMIT = 20;

export default function AdminAllOrders({ token, showToast }) {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT) });
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat');
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter, typeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchOrders();
  };

  const totalPages = Math.ceil(total / LIMIT);

  if (loading && orders.length === 0) return <div className="adm-loading"><RefreshCw size={24} className="spin" /> Memuat pesanan...</div>;

  return (
    <div className="adm-card">
      <div className="adm-page-header" style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: 16, marginBottom: 20 }}>
        <div>
          <div className="adm-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart2 size={22} className="text-gradient" /> Semua Pesanan
          </div>
          <div className="adm-page-sub">{total} total pesanan dalam sistem</div>
        </div>
        <button onClick={fetchOrders} className="btn btn-secondary"><RefreshCw size={16} /> Refresh</button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <input type="text" className="form-input" placeholder="Cari ID, user, produk..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
        </div>
        <select className="form-input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} style={{ width: 140 }}>
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="form-input" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }} style={{ width: 140 }}>
          <option value="">Semua Tipe</option>
          {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Cari</button>
      </form>

      {/* Table */}
      {orders.length === 0 ? (
        <div className="adm-empty">Tidak ada pesanan ditemukan.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="adm-table">
            <thead>
              <tr><th>ID</th><th>Pengguna</th><th>Produk</th><th>Tipe</th><th>Jml</th><th>Nominal</th><th>Status</th></tr>
            </thead>
            <tbody>
              {orders.map(ord => (
                <tr key={ord.id}>
                  <td className="td-id">#{ord.id}</td>
                  <td><div className="adm-user-cell"><div className="name">{ord.user.name}</div><div className="email">{ord.user.email}</div></div></td>
                  <td className="td-name">{ord.product.name}</td>
                  <td><span className={`adm-badge ${ord.type === 'PREMIUM' ? 'adm-badge-info' : ord.type === 'PHYSICAL' ? 'adm-badge-neutral' : 'adm-badge-success'}`}>{ord.type}</span></td>
                  <td>{ord.quantity}</td>
                  <td className="td-amt">Rp {(ord.amount || 0).toLocaleString('id-ID')}</td>
                  <td>
                    <span className={`adm-badge ${ord.status === 'COMPLETED' ? 'adm-badge-success' : ord.status === 'PROCESSING' ? 'adm-badge-pending' : ord.status === 'PENDING' ? 'adm-badge-neutral' : 'adm-badge-danger'}`}>
                      {ord.status === 'COMPLETED' ? '✅ Selesai' : ord.status === 'PROCESSING' ? '⏳ Proses' : ord.status === 'PENDING' ? '🕐 Pending' : '❌ Gagal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--border-default)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Halaman {page + 1} dari {totalPages} ({total} pesanan)</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 10px' }}><ChevronLeft size={14} /></button>
            <button className="btn btn-secondary" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 10px' }}><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
