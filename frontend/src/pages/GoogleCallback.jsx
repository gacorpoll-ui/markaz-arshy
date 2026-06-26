import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * Halaman ini menangkap token dari Google OAuth callback URL.
 * Backend meredirect ke: /auth/callback?token=JWT_TOKEN
 */
export default function GoogleCallback({ onLogin }) {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      const messages = {
        google_not_configured: 'Google OAuth belum dikonfigurasi di server.',
        google_denied:         'Login dengan Google dibatalkan.',
        google_token_failed:   'Gagal mendapatkan token dari Google.',
        google_no_email:       'Google tidak mengembalikan email.',
        google_server_error:   'Terjadi kesalahan di server.',
      };
      setErrorMsg(messages[error] || 'Login dengan Google gagal.');
      setStatus('error');
      return;
    }

    if (!token) {
      setErrorMsg('Token tidak ditemukan.');
      setStatus('error');
      return;
    }

    // Verifikasi token ke backend
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (!data.user) throw new Error('User tidak ditemukan.');
        onLogin(data.user, token);
        setStatus('success');
        setTimeout(() => navigate('/dashboard'), 1200);
      })
      .catch(err => {
        setErrorMsg(err.message || 'Gagal memverifikasi sesi.');
        setStatus('error');
      });
  }, []);

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card glass-card" style={{ textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <div className="auth-icon-wrap">
              <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
            <h2 className="auth-title">Menghubungkan dengan Google…</h2>
            <p className="auth-subtitle">Mohon tunggu sebentar.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="auth-icon-wrap" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent-success)' }}>
              <CheckCircle size={28} />
            </div>
            <h2 className="auth-title">Login Berhasil! ✅</h2>
            <p className="auth-subtitle">Mengarahkan ke dashboard…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="auth-icon-wrap" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-danger)' }}>
              <AlertTriangle size={28} />
            </div>
            <h2 className="auth-title">Login Gagal</h2>
            <p className="auth-subtitle" style={{ color: 'var(--accent-danger)' }}>{errorMsg}</p>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '20px', padding: '13px' }}
            >
              Kembali ke Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
