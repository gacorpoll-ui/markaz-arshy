import React, { useState, useEffect } from 'react';
import { Package, Search, RefreshCw, ChevronDown, ChevronUp, Truck, CheckCircle, X, Eye, Copy, ExternalLink } from 'lucide-react';

const STATUS = {
  AWAITING_PAYMENT: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Menunggu Bayar' },
  PENDING: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Menunggu' },
  PROCESSING: { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', label: 'Diproses' },
  SHIPPING: { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', label: 'Dikirim' },
  DELIVERED: { color: '#22c55e', bg: 'rgba(16,185,129,0.1)', label: 'Selesai' },
};

function formatRupiah(n) { return `Rp ${Math.round(n || 0).toLocaleString('id-ID')}`; }

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.PENDING;
  return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: s.bg, color: s.color }}>{s.label}</span>;
}

export default function AdminPhysicalOrders({ token }) {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);

  // Ship modal
  const [shipModal, setShipModal] = useState(null);
  const [resi, setResi] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ limit: '200' });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/physical-orders?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat');
      setOrders(data.orders);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const handleSearch = (e) => { e.preventDefault(); fetchOrders(); };

  const doAction = async (id, action, body = {}) => {
    setActionLoading(`${id}-${action}`);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/physical-orders/${id}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchOrders();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleShip = () => {
    if (!resi.trim()) return;
    doAction(shipModal.id, 'ship', { resi: resi.trim() });
    setShipModal(null);
    setResi('');
  };

  const renderActions = (order) => {
    switch (order.status) {
      case 'AWAITING_PAYMENT':
        return <span style={{ fontSize: '11px', color: '#999' }}>—</span>;
      case 'PENDING':
        return (
          <button onClick={() => doAction(order.id, 'process')} disabled={actionLoading === `${order.id}-process`}
            className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px' }}>
            {actionLoading === `${order.id}-process` ? <RefreshCw size={12} className="spin" /> : null} Proses
          </button>
        );
      case 'PROCESSING':
        return (
          <button onClick={() => setShipModal(order)} className="btn btn-primary"
            style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px', background: '#06b6d4', borderColor: '#06b6d4' }}>
            <Truck size={12} /> Kirim
          </button>
        );
      case 'SHIPPING':
        return (
          <button onClick={() => doAction(order.id, 'deliver')} disabled={actionLoading === `${order.id}-deliver`}
            className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px', background: '#22c55e', borderColor: '#22c55e' }}>
            {actionLoading === `${order.id}-deliver` ? <RefreshCw size={12} className="spin" /> : <CheckCircle size={12} />} Selesai
          </button>
        );
      default:
        return <span style={{ fontSize: '12px', color: '#999' }}>—</span>;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
  };

  /* ── Detail Modal ── */
  if (detailOrder) {
    const o = detailOrder;
    const variant = o.selectedVariant ? (() => { try { return JSON.parse(o.selectedVariant); } catch { return null; } })() : null;
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, background: 'rgba(0,0,0,0.3)', padding: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Detail Pesanan #{o.id}</h3>
              <span style={{ fontSize: '12px', color: '#999' }}>Dibuat {new Date(o.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <button onClick={() => setDetailOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}><X size={20} /></button>
          </div>
          <div style={{ padding: '24px' }}>
            {/* Product Info */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: '#f5f5f5' }}>
                {o.product?.imageUrl ? <img src={o.product.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={28} style={{ margin: '22px', color: '#ccc' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>{o.product?.name}</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '12px', flexWrap: 'wrap' }}>
                  {o.product?.brand && <span style={{ color: '#999' }}>Brand: <strong style={{ color: '#333' }}>{o.product.brand}</strong></span>}
                  {o.product?.jakmallProductId && <span style={{ color: '#999' }}>SKU: <strong style={{ color: '#333' }}>{o.product.jakmallProductId}</strong></span>}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {variant && Object.entries(variant).map(([k, v]) => (
                    <span key={k} style={{ padding: '2px 8px', borderRadius: '4px', background: '#f5f5f5', fontSize: '11px', color: '#555' }}>
                      {k}: <strong>{String(v)}</strong>
                    </span>
                  ))}
                  <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#fff7ed', fontSize: '11px', color: '#c2410c', fontWeight: '600' }}>x{o.quantity}</span>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '20px', fontSize: '11px', color: '#999' }}>
              <StatusBadge status={o.status} />
              {o.courierServiceName && <><span style={{ color: '#ddd' }}>|</span> Kurir: <strong style={{ color: '#333' }}>{o.courierServiceName}</strong></>}
              {o.shippingCost > 0 && <><span style={{ color: '#ddd' }}>|</span> Ongkir: <strong style={{ color: '#333' }}>{formatRupiah(o.shippingCost)}</strong></>}
              <span style={{ color: '#ddd' }}>|</span> <strong style={{ color: '#333' }}>{formatRupiah(o.amount)}</strong>
            </div>

            {/* Shipping Info */}
            <div style={{ background: '#fafafa', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Alamat Pengiriman</div>
              {o.shippingAddress ? (
                <>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>{o.shippingAddress.recipientName}</div>
                  <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.6 }}>
                    <div>{o.shippingAddress.fullAddress}</div>
                    <div>{o.shippingAddress.village}, {o.shippingAddress.district}</div>
                    <div>{o.shippingAddress.city}, {o.shippingAddress.province}</div>
                    <div style={{ marginTop: '4px' }}>{o.shippingAddress.phoneNumber}</div>
                  </div>
                </>
              ) : <span style={{ fontSize: '12px', color: '#999' }}>Tidak tersedia</span>}
            </div>

            {/* Resi Input (if PROCESSING) */}
            {o.status === 'PROCESSING' && (
              <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '16px', border: '1px solid #dbeafe' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#1d4ed8', marginBottom: '10px' }}>Input Nomor Resi</div>
                <input type="text" id={`resi-input-${o.id}`} placeholder="Masukkan nomor resi..."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #93c5fd', fontSize: '14px', marginBottom: '10px', background: '#fff', color: '#333' }} />
                <button onClick={() => {
                  const resiVal = document.getElementById(`resi-input-${o.id}`).value.trim();
                  if (!resiVal) return;
                  doAction(o.id, 'ship', { resi: resiVal });
                  setDetailOrder(null);
                }}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                  <Truck size={14} /> Simpan Resi & Kirim
                </button>
              </div>
            )}

            {/* Resi (if SHIPPING/DELIVERED) */}
            {o.resi && (
              <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '16px', marginBottom: '16px', border: '1px solid #dcfce7' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', marginBottom: '6px' }}>Nomor Resi</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#166534', fontFamily: 'monospace', letterSpacing: '0.5px' }}>{o.resi}</span>
                  <button onClick={() => copyToClipboard(o.resi)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', padding: '4px' }}>
                    <Copy size={14} />
                  </button>
                </div>
                {o.courierServiceName && <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px' }}>Kurir: {o.courierServiceName}</div>}
                {o.shippedAt && <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>Dikirim: {new Date(o.shippedAt).toLocaleDateString('id-ID')}</div>}
              </div>
            )}

            {/* Total */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
              <span style={{ fontWeight: '700' }}>Total</span>
              <span style={{ fontWeight: '900', color: '#e74c3c' }}>{formatRupiah(o.amount)}</span>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              {o.status !== 'PROCESSING' && renderActions(o)}
              <button onClick={() => setDetailOrder(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Ship Modal ── */
  if (shipModal) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Input Resi</h3>
            <button onClick={() => { setShipModal(null); setResi(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}><X size={20} /></button>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', padding: '12px', background: '#fafafa', borderRadius: '10px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#eee' }}>
              {shipModal.product?.imageUrl ? <img src={shipModal.product.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={18} style={{ margin: '13px', color: '#ccc' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>#{shipModal.id} — {shipModal.product?.name}</div>
              <div style={{ fontSize: '11px', color: '#999' }}>x{shipModal.quantity} | {shipModal.courierServiceName || shipModal.courier}</div>
            </div>
          </div>
          <input type="text" value={resi} onChange={e => setResi(e.target.value)} placeholder="Masukkan nomor resi..."
            autoFocus
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px', marginBottom: '14px', background: '#fff', color: '#333' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setShipModal(null); setResi(''); }} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Batal</button>
            <button onClick={handleShip} disabled={!resi.trim()}
              style={{ flex: 1, padding: '11px', borderRadius: '8px', border: 'none', background: !resi.trim() ? '#ddd' : '#06b6d4', color: !resi.trim() ? '#999' : '#fff', fontSize: '13px', fontWeight: '700', cursor: !resi.trim() ? 'not-allowed' : 'pointer' }}>
              <Truck size={14} /> Simpan Resi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-display)' }}>Pesanan Fisik</h2>
          <p style={{ fontSize: '13px', color: '#999' }}>{total} total pesanan</p>
        </div>
        <button onClick={fetchOrders} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #ddd', background: '#fff', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '200px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari ID, produk, atau pengguna..."
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '13px', background: '#fff', color: '#333' }} />
            </div>
            <button style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#e74c3c', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cari</button>
          </form>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '13px', background: '#fff', color: '#333' }}>
            <option value="">Semua Status</option>
            <option value="AWAITING_PAYMENT">Menunggu Bayar</option>
            <option value="PENDING">Menunggu</option>
            <option value="PROCESSING">Diproses</option>
            <option value="SHIPPING">Dikirim</option>
            <option value="DELIVERED">Selesai</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <RefreshCw size={28} className="spin" style={{ color: '#999' }} />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#e74c3c', marginBottom: '16px' }}>{error}</p>
          <button onClick={fetchOrders} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#e74c3c', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Coba Lagi</button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && orders.length === 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', textAlign: 'center', padding: '80px 20px' }}>
          <Package size={48} style={{ color: '#ddd', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Tidak Ada Pesanan Fisik</h3>
          <p style={{ color: '#999', fontSize: '14px' }}>{statusFilter ? 'Tidak ada pesanan dengan filter ini.' : 'Belum ada transaksi barang fisik.'}</p>
        </div>
      )}

      {/* Orders Table */}
      {!loading && !error && orders.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: '12px 14px', fontSize: '10px', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>ID</th>
                  <th style={{ padding: '12px 14px', fontSize: '10px', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>Produk</th>
                  <th style={{ padding: '12px 14px', fontSize: '10px', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>SKU / Varian</th>
                  <th style={{ padding: '12px 14px', fontSize: '10px', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>Qty</th>
                  <th style={{ padding: '12px 14px', fontSize: '10px', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>Pembeli</th>
                  <th style={{ padding: '12px 14px', fontSize: '10px', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>Total</th>
                  <th style={{ padding: '12px 14px', fontSize: '10px', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 14px', fontSize: '10px', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>Aksi</th>
                  <th style={{ padding: '12px 14px', width: '36px' }}></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const st = STATUS[order.status] || STATUS.PENDING;
                  const isExpanded = expanded === order.id;
                  const variant = order.selectedVariant ? (() => { try { return JSON.parse(order.selectedVariant); } catch { return null; } })() : null;
                  return (
                    <React.Fragment key={order.id}>
                      <tr style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.15s' }}>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: '#999', fontWeight: '600' }}>#{order.id}</td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#f5f5f5' }}>
                              {order.product?.imageUrl ? (
                                <img src={order.product.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : <Package size={16} style={{ margin: '10px', color: '#ccc' }} />}
                            </div>
                            <div style={{ minWidth: 0, maxWidth: '160px' }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.product?.name}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '12px' }}>
                          {order.product?.jakmallProductId ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
                              <code style={{ background: '#f5f5f5', padding: '1px 6px', borderRadius: '3px', fontSize: '11px', color: '#6366f1' }}>{order.product.jakmallProductId}</code>
                            </div>
                          ) : <span style={{ color: '#ccc' }}>—</span>}
                          {variant && Object.entries(variant).map(([k, v]) => (
                            <div key={k} style={{ fontSize: '10px', color: '#888' }}>{k}: <strong>{String(v)}</strong></div>
                          ))}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600' }}>x{order.quantity}</td>
                        <td style={{ padding: '12px 14px', fontSize: '12px' }}>
                          <div style={{ fontWeight: '600', color: '#333' }}>{order.user?.name}</div>
                          <div style={{ fontSize: '10px', color: '#999' }}>{order.user?.email}</div>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700', color: '#e74c3c' }}>
                          {formatRupiah(order.amount)}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <StatusBadge status={order.status} />
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
                            <button onClick={() => setDetailOrder(order)} title="Lihat Detail"
                              style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center' }}>
                              <Eye size={13} />
                            </button>
                            {renderActions(order)}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button onClick={() => setExpanded(isExpanded ? null : order.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: '4px' }}>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} style={{ padding: '0', background: '#fafafa' }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontSize: '12px' }}>
                              <div>
                                <div style={{ fontSize: '10px', fontWeight: '700', color: '#999', textTransform: 'uppercase', marginBottom: '6px' }}>Alamat Pengiriman</div>
                                <div style={{ color: '#666', lineHeight: 1.6 }}>
                                  {order.shippingAddress ? (
                                    <>
                                      <div><strong>{order.shippingAddress.recipientName}</strong></div>
                                      <div>{order.shippingAddress.fullAddress}</div>
                                      <div>{order.shippingAddress.village}, {order.shippingAddress.district}</div>
                                      <div>{order.shippingAddress.city}, {order.shippingAddress.province}</div>
                                      <div>{order.shippingAddress.phoneNumber}</div>
                                    </>
                                  ) : <span style={{ color: '#ccc' }}>Tidak tersedia</span>}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '10px', fontWeight: '700', color: '#999', textTransform: 'uppercase', marginBottom: '6px' }}>Pengiriman</div>
                                <div style={{ color: '#666', lineHeight: 1.6 }}>
                                  <div>Kurir: <strong>{order.courierServiceName || order.courier || '—'}</strong></div>
                                  <div>Ongkir: <strong>{formatRupiah(order.shippingCost || 0)}</strong></div>
                                  {order.resi && <div>Resi: <strong style={{ color: '#6366f1' }}>{order.resi}</strong></div>}
                                  {order.shippedAt && <div>Dikirim: {new Date(order.shippedAt).toLocaleDateString('id-ID')}</div>}
                                  {order.deliveredAt && <div>Selesai: {new Date(order.deliveredAt).toLocaleDateString('id-ID')}</div>}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '10px', fontWeight: '700', color: '#999', textTransform: 'uppercase', marginBottom: '6px' }}>Info Pesanan</div>
                                <div style={{ color: '#666', lineHeight: 1.6 }}>
                                  <div>Dibuat: {new Date(order.createdAt).toLocaleDateString('id-ID')}</div>
                                  <div>Qty: {order.quantity}</div>
                                  <div>Subtotal: {formatRupiah(order.amount)}</div>
                                  {order.notes && <div style={{ color: '#f59e0b', marginTop: '4px' }}>{order.notes}</div>}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
