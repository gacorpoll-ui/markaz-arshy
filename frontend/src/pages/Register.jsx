import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Mail, Phone, Lock, AlertTriangle, CheckCircle } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function Register({ onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const navigate = useNavigate();

  const handleGoogleRegister = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/auth/google`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, whatsapp, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed.');
      setRegistrationSuccess(true);
      setTimeout(() => navigate(`/verify-email?email=${encodeURIComponent(email)}`), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="auth-page animate-fade-in">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-icon" style={{ background: 'var(--accent-success-light)', color: 'var(--accent-success)' }}>
            <CheckCircle size={32} />
          </div>
          <h2 className="auth-title">Registrasi Berhasil!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
            Kode verifikasi telah dikirim ke <strong style={{ color: 'var(--accent-primary)' }}>{email}</strong>.
            <br />Silakan cek email Anda dan masukkan kode 6 digit.
          </p>
          <div style={{ background: 'var(--accent-primary-light)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '8px', padding: '12px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Anda akan otomatis dialihkan ke halaman verifikasi dalam 3 detik...
          </div>
          <button onClick={() => navigate(`/verify-email?email=${encodeURIComponent(email)}`)} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
            Verifikasi Sekarang &rarr;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon"><UserPlus size={26} /></div>
          <h2 className="auth-title">Daftar Akun Baru</h2>
          <p className="auth-subtitle">Bergabunglah dan dapatkan harga khusus untuk layanan SMM & Premium.</p>
        </div>

        {error && <div className="auth-error"><AlertTriangle size={16} /><span>{error}</span></div>}

        <button onClick={handleGoogleRegister} type="button" className="btn btn-secondary" style={{ width: '100%', padding: '12px', fontSize: '14px', marginBottom: '20px' }}>
          <GoogleIcon /> Daftar dengan Google
        </button>

        <div className="auth-divider">atau</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9CA3AF' }} />
              <input type="text" className="form-input" placeholder="Budi Santoso" value={name} onChange={(e) => setName(e.target.value)} style={{ paddingLeft: '38px' }} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Alamat Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9CA3AF' }} />
              <input type="email" className="form-input" placeholder="budi@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ paddingLeft: '38px' }} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Nomor WhatsApp (Opsional)</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9CA3AF' }} />
              <input type="tel" className="form-input" placeholder="08123456789" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} style={{ paddingLeft: '38px' }} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Kata Sandi</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9CA3AF' }} />
              <input type="password" className="form-input" placeholder="Minimal 6 karakter" value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingLeft: '38px' }} required minLength={6} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '14px', marginTop: '4px' }} disabled={loading}>
            {loading ? 'Mendaftarkan...' : 'Daftar'}
          </button>
        </form>

        <div className="auth-link">
          Sudah punya akun? <Link to="/login">Masuk Disini</Link>
        </div>
      </div>
    </div>
  );
}
