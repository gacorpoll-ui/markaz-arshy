import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertTriangle, RefreshCw } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/auth/google`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.requireVerification) {
          navigate(`/verify-email?email=${encodeURIComponent(data.email || email)}`);
          return;
        }
        throw new Error(data.error || 'Login gagal.');
      }
      onLogin(data.user, data.token);
      navigate(data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon"><LogIn size={26} /></div>
          <h2 className="auth-title">Masuk Akun</h2>
          <p className="auth-subtitle">Silakan masuk untuk mulai berbelanja followers dan akun premium.</p>
        </div>

        {error && (
          <div className="auth-error"><AlertTriangle size={16} /><span>{error}</span></div>
        )}

        <button onClick={handleGoogleLogin} type="button" className="btn btn-secondary" style={{ width: '100%', padding: '12px', fontSize: '14px', marginBottom: '20px' }}>
          <GoogleIcon /> Masuk dengan Google
        </button>

        <div className="auth-divider">atau</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Alamat Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9CA3AF' }} />
              <input type="email" className="form-input" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ paddingLeft: '38px' }} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Kata Sandi</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9CA3AF' }} />
              <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingLeft: '38px' }} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '14px', marginTop: '4px' }} disabled={loading}>
            {loading ? <><RefreshCw size={14} className="spin" /> Menghubungkan...</> : 'Masuk ke Dashboard'}
          </button>
        </form>

        <div className="auth-link">
          Belum punya akun? <Link to="/register">Daftar Sekarang</Link>
        </div>
      </div>
    </div>
  );
}
