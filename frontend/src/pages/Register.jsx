import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Mail, Phone, Lock, AlertTriangle, CheckCircle } from 'lucide-react';

/* ── Google Icon SVG ── */
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
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      // Registrasi berhasil — tampilkan pesan verifikasi
      setRegistrationSuccess(true);

      // Redirect ke halaman verifikasi setelah 3 detik
      setTimeout(() => {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Tampilan sukses registrasi
  if (registrationSuccess) {
    return (
      <div className="container animate-fade-in" style={{ maxWidth: '480px', marginTop: '60px' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            padding: '16px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--color-success)',
            marginBottom: '15px'
          }}>
            <CheckCircle size={36} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>
            Registrasi Berhasil! 🎉
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
            Kode verifikasi telah dikirim ke <strong style={{ color: 'var(--color-primary)' }}>{email}</strong>.
            <br />Silakan cek email Anda dan masukkan kode 6 digit untuk mengaktifkan akun.
          </p>
          <div style={{
            background: 'rgba(79, 172, 254, 0.05)',
            border: '1px solid rgba(79, 172, 254, 0.15)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginBottom: '25px'
          }}>
            ⏳ Anda akan otomatis dialihkan ke halaman verifikasi dalam 3 detik...
          </div>
          <button
            onClick={() => navigate(`/verify-email?email=${encodeURIComponent(email)}`)}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
          >
            Verifikasi Sekarang →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '480px', marginTop: '60px' }}>
      <div className="glass-card">
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            display: 'inline-flex',
            padding: '16px',
            borderRadius: '50%',
            background: 'var(--grad-primary)',
            color: '#070913',
            marginBottom: '15px'
          }}>
            <UserPlus size={28} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            Daftar Akun Baru
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Bergabunglah dan dapatkan harga khusus untuk layanan SMM & Premium.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            color: '#fca5a5',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px'
          }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleRegister}
          type="button"
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'rgba(255, 255, 255, 0.97)',
            color: '#1f2937',
            fontSize: '15px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '24px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.97)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <GoogleIcon />
          Daftar dengan Google
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '24px 0',
          color: 'var(--text-muted)',
          fontSize: '13px'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          atau
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Budi Santoso"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ paddingLeft: '45px' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Alamat Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-input"
                placeholder="budi@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '45px' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nomor WhatsApp (Opsional)</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                type="tel"
                className="form-input"
                placeholder="08123456789"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                style={{ paddingLeft: '45px' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label className="form-label">Kata Sandi</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-input"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '45px' }}
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
            disabled={loading}
          >
            {loading ? 'Mendaftarkan...' : 'Daftar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '25px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Sudah punya akun?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '600' }}>
            Masuk Disini
          </Link>
        </div>
      </div>
    </div>
  );
}
