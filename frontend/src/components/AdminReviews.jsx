import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Eye, Trash2 } from 'lucide-react';

export default function AdminReviews({ token }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch reviews.');
      setReviews(data.reviews);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching admin reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (id, isApproved) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/admin/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isApproved })
      });
      if (!res.ok) throw new Error('Failed to update approval status.');
      fetchReviews();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/admin/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete review.');
      fetchReviews();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} />
        <p style={{ marginTop: '15px' }}>Memuat ulasan...</p>
      </div>
    );
  }

  if (error) {
    return <div style={{ color: 'var(--color-error)', textAlign: 'center', padding: '50px' }}>Error: {error}</div>;
  }

  return (
    <div className="glass-card" style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Eye size={24} className="text-gradient" /> Manajemen Ulasan
        </h2>
        <button onClick={fetchReviews} className="btn btn-secondary">
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {reviews.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px' }}>
          Tidak ada ulasan yang tersedia.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '15px 20px' }}>Produk</th>
              <th style={{ padding: '15px 20px' }}>User</th>
              <th style={{ padding: '15px 20px' }}>Rating</th>
              <th style={{ padding: '15px 20px' }}>Komentar</th>
              <th style={{ padding: '15px 20px' }}>Status</th>
              <th style={{ padding: '15px 20px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(review => (
              <tr key={review.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '15px 20px', color: 'var(--text-primary)' }}>
                  {review.product ? review.product.name : 'N/A'}
                </td>
                <td style={{ padding: '15px 20px', color: 'var(--text-primary)' }}>
                  {review.user ? review.user.name : 'N/A'}
                </td>
                <td style={{ padding: '15px 20px' }}>
                  <div style={{ display: 'flex', gap: '2px', color: 'var(--color-warning)' }}>
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} fill={i < review.rating ? 'currentColor' : 'none'} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                        <path d="M12 2l3.09 6.31L22 9.27l-5 4.87 1.18 6.88L12 17.25l-6.18 3.27L7 14.14l-5-4.87 7.91-1.01L12 2z"></path>
                      </svg>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '15px 20px', color: 'var(--text-secondary)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {review.comment || '-'}
                </td>
                <td style={{ padding: '15px 20px' }}>
                  {review.isApproved ? (
                    <span className="badge badge-success">Disetujui</span>
                  ) : (
                    <span className="badge badge-pending">Pending</span>
                  )}
                </td>
                <td style={{ padding: '15px 20px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!review.isApproved && (
                      <button onClick={() => handleApproveReject(review.id, true)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        <CheckCircle size={14} /> Setujui
                      </button>
                    )}
                    {review.isApproved && (
                      <button onClick={() => handleApproveReject(review.id, false)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        <XCircle size={14} /> Batalkan
                      </button>
                    )}
                    <button onClick={() => handleDeleteReview(review.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-error)' }}>
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
