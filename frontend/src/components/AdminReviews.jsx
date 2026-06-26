import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Eye, Trash2, Star } from 'lucide-react';

export default function AdminReviews({ token }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/admin`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReviews(data.reviews);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleApproveReject = async (id, isApproved) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/admin/${id}/approve`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isApproved })
      });
      if (!res.ok) throw new Error('Gagal update.');
      fetchReviews();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Yakin hapus ulasan ini?')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/admin/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchReviews();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="adm-loading"><RefreshCw size={24} className="spin" /> Memuat ulasan...</div>;
  if (error) return <div className="adm-error">Error: {error}</div>;

  return (
    <div className="adm-card">
      <div className="adm-page-header" style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: 16, marginBottom: 20 }}>
        <div>
          <div className="adm-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Eye size={22} className="text-gradient" /> Manajemen Ulasan</div>
          <div className="adm-page-sub">Kelola ulasan pelanggan</div>
        </div>
        <button onClick={fetchReviews} className="btn btn-secondary"><RefreshCw size={16} /> Refresh</button>
      </div>
      {reviews.length === 0 ? <div className="adm-empty">Tidak ada ulasan.</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="adm-table">
            <thead><tr><th>Produk</th><th>User</th><th>Rating</th><th>Komentar</th><th>Status</th><th className="td-actions">Aksi</th></tr></thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id}>
                  <td className="td-name">{r.product ? r.product.name : 'N/A'}</td>
                  <td>{r.user ? r.user.name : 'N/A'}</td>
                  <td><div style={{ display: 'flex', gap: 2, color: 'var(--accent-warning)' }}>{[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < r.rating ? 'currentColor' : 'none'} color="currentColor" stroke="none" />)}</div></td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.comment || '-'}</td>
                  <td><span className={`adm-badge ${r.isApproved ? 'adm-badge-success' : 'adm-badge-pending'}`}>{r.isApproved ? 'Disetujui' : 'Pending'}</span></td>
                  <td className="td-actions">
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {!r.isApproved && <button onClick={() => handleApproveReject(r.id, true)} className="btn btn-primary" style={{ padding: '5px 10px', fontSize: '11px' }}><CheckCircle size={12} /> Setujui</button>}
                      {r.isApproved && <button onClick={() => handleApproveReject(r.id, false)} className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '11px' }}><XCircle size={12} /> Batalkan</button>}
                      <button onClick={() => handleDeleteReview(r.id)} className="btn btn-danger" style={{ padding: '5px 10px', fontSize: '11px' }}><Trash2 size={12} /> Hapus</button>
                    </div>
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
