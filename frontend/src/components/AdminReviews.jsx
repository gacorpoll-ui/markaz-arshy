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
      if (!res.ok) throw new Error(data.error || 'Failed to fetch reviews.');
      setReviews(data.reviews);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleApproveReject = async (id, isApproved) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/admin/${id}/approve`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isApproved })
      });
      if (!res.ok) throw new Error('Failed to update.');
      fetchReviews();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Yakin ingin menghapus ulasan ini?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/admin/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to delete.');
      fetchReviews();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="adm-loading"><RefreshCw size={24} className="spin" /> Memuat ulasan...</div>;
  if (error) return <div className="adm-empty" style={{ color: 'var(--accent-danger)' }}>Error: {error}</div>;

  return (
    <div className="glass-card">
      <div className="adm-page-header" style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <div className="adm-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Eye size={22} className="text-gradient" /> Manajemen Ulasan
          </div>
          <div className="adm-page-sub">Kelola ulasan pelanggan</div>
        </div>
        <button onClick={fetchReviews} className="btn btn-secondary"><RefreshCw size={16} /> Refresh</button>
      </div>

      {reviews.length === 0 ? (
        <div className="adm-empty">Tidak ada ulasan yang tersedia.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="adm-table">
            <thead>
              <tr><th>Produk</th><th>User</th><th>Rating</th><th>Komentar</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {reviews.map(review => (
                <tr key={review.id}>
                  <td style={{ fontWeight: 600 }}>{review.product ? review.product.name : 'N/A'}</td>
                  <td>{review.user ? review.user.name : 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '2px', color: 'var(--accent-warning)' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} color="currentColor" stroke="none" />
                      ))}
                    </div>
                  </td>
                  <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{review.comment || '-'}</td>
                  <td><span className={`badge ${review.isApproved ? 'badge-success' : 'badge-pending'}`}>{review.isApproved ? 'Disetujui' : 'Pending'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {!review.isApproved && <button onClick={() => handleApproveReject(review.id, true)} className="btn btn-primary" style={{ padding: '5px 10px', fontSize: '11px' }}><CheckCircle size={12} /> Setujui</button>}
                      {review.isApproved && <button onClick={() => handleApproveReject(review.id, false)} className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '11px' }}><XCircle size={12} /> Batalkan</button>}
                      <button onClick={() => handleDeleteReview(review.id)} className="btn btn-danger" style={{ padding: '5px 10px', fontSize: '11px' }}><Trash2 size={12} /> Hapus</button>
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
