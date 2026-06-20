import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, Mail, RefreshCw, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function VerifyEmail({ onLogin }) {
  const [searchParams] = useSearchParams();
  const emailFromUrl   = searchParams.get('email') || '';

  const [email,          setEmail]         = useState(emailFromUrl);
  const [digits,         setDigits]        = useState(['', '', '', '', '', '']);
  const [error,          setError]         = useState('');
  const [loading,        setLoading]       = useState(false);
  const [resending,      setResending]     = useState(false);
  const [resendSuccess,  setResendSuccess] = useState('');
  const [verified,       setVerified]      = useState(false);
  const [countdown,      setCountdown]     = useState(0);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => { if (emailFromUrl) setEmail(emailFromUrl); }, [emailFromUrl]);

  /* ── Countdown timer for resend ── */
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  /* ── OTP digit input handler ── */
  const handleDigitChange = (idx, val) => {
    const cleaned = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[idx] = cleaned;
    setDigits(newDigits);
    if (cleaned && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  /* Support paste — e.g. paste "123456" fills all boxes */
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newDigits = ['', '', '', '', '', ''];
    pasted.split('').forEach((ch, i) => { newDigits[i] = ch; });
    setDigits(newDigits);
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();
  };

  const code = digits.join('');

  /* ── Submit ── */
  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setVerified(true);
      if (data.token && data.user) {
        setTimeout(() => { onLogin(data.user, data.token); navigate('/dashboard'); }, 1800);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend ── */
  const handleResend = async () => {
    if (!email) { setError('Masukkan alamat email terlebih dahulu.'); return; }
    if (countdown > 0) return;
    setResending(true);
    setResendSuccess('');
    setError('');
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResendSuccess(data.message);
      setCountdown(60); // cooldown 60 detik
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  /* ── Success state ── */
  if (verified) {
    return (
      <div className="verify-page-container animate-fade-in">
        <div className="verify-glow-1"></div>
        <div className="verify-glow-2"></div>
        <div className="verify-card">
          <div className="verify-success-icon-box">
            <CheckCircle size={36} />
          </div>
          <h2 className="verify-title" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Email Terverifikasi!
          </h2>
          <p className="verify-subtitle" style={{ marginTop: '8px' }}>
            Selamat, akun Anda telah aktif dan siap digunakan. Mengarahkan Anda ke Dashboard…
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
            <RefreshCw size={24} style={{ color: 'var(--color-success)', animation: 'spin 1s linear infinite' }} />
          </div>

          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            .verify-page-container {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: calc(100vh - 120px);
              position: relative;
              overflow: hidden;
              padding: 20px;
            }
            .verify-glow-1 {
              position: absolute;
              top: -150px;
              left: -150px;
              width: 400px;
              height: 400px;
              background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0) 70%);
              border-radius: 50%;
              pointer-events: none;
              z-index: 0;
            }
            .verify-glow-2 {
              position: absolute;
              bottom: -150px;
              right: -150px;
              width: 400px;
              height: 400px;
              background: radial-gradient(circle, rgba(0, 242, 254, 0.08) 0%, rgba(0, 242, 254, 0) 70%);
              border-radius: 50%;
              pointer-events: none;
              z-index: 0;
            }
            .verify-card {
              position: relative;
              z-index: 1;
              width: 100%;
              max-width: 460px;
              padding: 40px;
              background: rgba(15, 22, 42, 0.45);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 24px;
              box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);
              transition: all 0.3s ease;
              text-align: center;
            }
            .verify-success-icon-box {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 76px;
              height: 76px;
              background: rgba(16, 185, 129, 0.15);
              border: 1px solid rgba(16, 185, 129, 0.3);
              color: var(--color-success);
              border-radius: 50%;
              margin-bottom: 24px;
              box-shadow: 0 8px 24px -6px rgba(16, 185, 129, 0.25);
              animation: scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
            @keyframes scaleUp {
              from { transform: scale(0.8); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-page-container animate-fade-in">
      <div className="verify-glow-1"></div>
      <div className="verify-glow-2"></div>
      
      <div className="verify-card">
        {/* Icon + Title */}
        <div className="verify-icon-box">
          <Mail size={30} />
        </div>
        <h2 className="verify-title">Verifikasi Akun</h2>
        <p className="verify-subtitle">
          Kami telah mengirimkan 6 digit kode verifikasi ke alamat email:{' '}
          <span className="verify-email-highlight">{email || 'email Anda'}</span>.
        </p>

        {/* Manual Email Input if not provided */}
        {!emailFromUrl && (
          <div className="form-group" style={{ marginBottom: '24px', textAlign: 'left' }}>
            <label className="form-label">Konfirmasi Email Anda</label>
            <input
              type="email"
              className="form-input"
              placeholder="nama@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ background: 'rgba(10, 15, 30, 0.4)', borderRadius: '12px' }}
            />
          </div>
        )}

        {/* Errors / Success Alerts */}
        {error && (
          <div className="pd-alert pd-alert-error" style={{ marginBottom: '20px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', textAlign: 'left' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        
        {resendSuccess && (
          <div className="pd-alert pd-alert-success" style={{ marginBottom: '20px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', textAlign: 'left' }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>{resendSuccess}</span>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleVerify}>
          <div style={{ textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Masukkan Kode 6 Digit
          </div>
          
          <div className="verify-otp-container" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`verify-otp-input ${d ? 'filled' : ''}`}
                value={d}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleDigitKeyDown(i, e)}
                autoFocus={i === 0}
              />
            ))}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '16px', borderRadius: '14px', fontSize: '16px', fontWeight: '800', marginTop: '24px', transition: 'all 0.25s ease' }}
            disabled={loading || code.length !== 6}
          >
            {loading ? (
              <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Memproses…</>
            ) : (
              <><ShieldCheck size={18} /> Verifikasi & Aktifkan</>
            )}
          </button>
        </form>

        {/* Resend Action */}
        <div className="verify-resend-container">
          <span>Tidak menerima kode?</span>
          <button
            onClick={handleResend}
            disabled={resending || countdown > 0}
            className="verify-resend-btn"
          >
            {resending
              ? 'Mengirim…'
              : countdown > 0
                ? `Kirim ulang dalam ${countdown}s`
                : 'Kirim Ulang Kode'
            }
          </button>
        </div>

        {/* Back navigation */}
        <div style={{ marginTop: '24px' }}>
          <Link to="/login" className="verify-back-btn">
            <ArrowLeft size={14} /> Kembali ke Login
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .verify-page-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 120px);
          position: relative;
          overflow: hidden;
          padding: 20px;
        }
        .verify-glow-1 {
          position: absolute;
          top: -150px;
          left: -150px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(127, 0, 255, 0.12) 0%, rgba(127, 0, 255, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .verify-glow-2 {
          position: absolute;
          bottom: -150px;
          right: -150px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(0, 242, 254, 0.08) 0%, rgba(0, 242, 254, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .verify-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 460px;
          padding: 40px;
          background: rgba(15, 22, 42, 0.45);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);
          transition: all 0.3s ease;
          text-align: center;
        }
        .verify-card:hover {
          border-color: rgba(0, 242, 254, 0.25);
          box-shadow: 0 20px 40px -15px rgba(0, 242, 254, 0.1);
        }
        .verify-icon-box {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 68px;
          height: 68px;
          background: linear-gradient(135deg, rgba(0, 242, 254, 0.1) 0%, rgba(79, 172, 254, 0.1) 100%);
          border: 1px solid rgba(0, 242, 254, 0.2);
          color: var(--color-primary);
          border-radius: 20px;
          margin-bottom: 24px;
          box-shadow: 0 8px 24px -6px rgba(0, 242, 254, 0.25);
        }
        .verify-title {
          font-family: var(--font-title);
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 12px;
        }
        .verify-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .verify-email-highlight {
          color: var(--color-primary);
          font-weight: 700;
        }
        .verify-otp-container {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          margin: 20px 0;
        }
        .verify-otp-input {
          width: 100%;
          aspect-ratio: 1;
          background: rgba(10, 15, 30, 0.5);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          font-size: 24px;
          font-weight: 800;
          color: #fff;
          text-align: center;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
        }
        .verify-otp-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 15px rgba(0, 242, 254, 0.25);
          background: rgba(15, 22, 42, 0.8);
          transform: scale(1.05);
        }
        .verify-otp-input.filled {
          border-color: rgba(0, 242, 254, 0.4);
          color: var(--color-primary);
          background: rgba(15, 22, 42, 0.8);
        }
        .verify-resend-container {
          margin-top: 24px;
          font-size: 13px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .verify-resend-btn {
          background: none;
          border: none;
          color: var(--color-primary);
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          font-size: 13px;
          transition: all 0.2s ease;
        }
        .verify-resend-btn:hover:not(:disabled) {
          text-decoration: underline;
          text-shadow: 0 0 8px rgba(0, 242, 254, 0.4);
        }
        .verify-resend-btn:disabled {
          color: var(--text-muted);
          cursor: not-allowed;
        }
        .verify-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .verify-back-btn:hover {
          color: #fff;
        }
      `}</style>
    </div>
  );
}
