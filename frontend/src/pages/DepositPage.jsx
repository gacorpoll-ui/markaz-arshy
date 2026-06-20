import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Upload, AlertCircle, CheckCircle } from 'lucide-react';

export default function DepositPage({ user, token, onUpdateUser }) {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [amount, setAmount] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPaymentMethods();
  }, [user]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/deposits/payment-methods`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPaymentMethods(data.paymentMethods || []);
      if (data.paymentMethods && data.paymentMethods.length > 0) {
        setSelectedMethodId(data.paymentMethods[0].id.toString());
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat metode pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB.');
        return;
      }
      setProofFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!amount || parseInt(amount) < 10000) {
      setError('Minimal deposit adalah Rp 10.000');
      return;
    }

    if (!proofFile) {
      setError('Bukti transfer wajib diunggah.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('paymentMethodId', selectedMethodId);
      formData.append('paymentProof', proofFile);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/deposits/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Jangan set Content-Type secara manual saat menggunakan FormData
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengajukan deposit.');
      }

      setSuccess(true);
      setAmount('');
      setProofFile(null);
      setPreviewUrl('');

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMethod = paymentMethods.find(m => m.id.toString() === selectedMethodId);

  if (loading) {
     return <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>Memuat halaman deposit...</div>;
  }

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '100px' }}>
      
      {/* --- HERO DEPOSIT --- */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.05) 0%, rgba(225, 48, 108, 0.05) 100%)',
        borderRadius: '24px',
        padding: '40px',
        marginBottom: '40px',
        border: '1px solid var(--border-color)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '36px', fontWeight: '900', color: '#fff' }}>
            Isi Ulang <span className="text-gradient">Saldo Wallet</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '10px', maxWidth: '600px', margin: '10px auto 0 auto' }}>
            Gunakan saldo Anda untuk melakukan transaksi instan 24/7 di seluruh katalog SMM dan Akun Premium kami.
          </p>
        </div>
      </div>

      {success ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)', marginBottom: '15px' }}>
            <CheckCircle size={40} />
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '10px' }}>Pengajuan Deposit Berhasil!</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
            Bukti transfer Anda telah kami terima dan sedang mengantre untuk divalidasi oleh Admin.
            Saldo akan otomatis bertambah setelah disetujui.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ padding: '12px 24px' }}>
            Kembali ke Dashboard
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '30px' }} className="grid-cols-2">

          {/* Formulir Kiri */}
          <div className="glass-card">
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Form Pengajuan Deposit</h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nominal Deposit</label>
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 'bold' }}>Rp</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ paddingLeft: '45px' }}
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="Minimal 10.000"
                      min="10000"
                      required
                    />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Metode Pembayaran</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {paymentMethods.map(method => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSelectedMethodId(method.id.toString())}
                          style={{
                              padding: '15px',
                              textAlign: 'left',
                              background: selectedMethodId === method.id.toString() ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${selectedMethodId === method.id.toString() ? 'var(--color-primary)' : 'var(--border-color)'}`,
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              fontWeight: '600',
                              transition: 'all 0.2s'
                          }}
                        >
                            {method.name}
                        </button>
                    ))}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '25px' }}>
                  <label className="form-label">Upload Bukti Transfer</label>
                  <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '30px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '2px dashed var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                  }}>
                      <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Klik untuk upload gambar</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>(Format JPG/PNG, Max 5MB)</span>
                      <input
                         type="file"
                         accept="image/png, image/jpeg, image/webp"
                         onChange={handleFileChange}
                         style={{ display: 'none' }}
                      />
                  </label>
              </div>

              {previewUrl && (
                  <div style={{ marginBottom: '20px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img src={previewUrl} alt="Preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
              )}

              {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: 'var(--radius-sm)', color: '#fca5a5', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={submitting}>
                {submitting ? 'Mengirim Pengajuan...' : 'Ajukan Deposit Sekarang'}
              </button>
            </form>
          </div>

          {/* Instruksi Kanan */}
          <div>
              <div className="glass-card" style={{ position: 'sticky', top: '100px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '15px', color: 'var(--text-primary)' }}>Instruksi Pembayaran</h3>
                  {selectedMethod ? (
                      <div>
                          {selectedMethod.qrImage && (
                              <div style={{ marginBottom: '20px', textAlign: 'center', background: '#fff', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                                  <img src={`${import.meta.env.VITE_API_BASE_URL}${selectedMethod.qrImage}`} alt="QRIS" style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }} />
                              </div>
                          )}
                          <div style={{ marginBottom: '15px' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Penerima:</span>
                              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-primary)' }}>{selectedMethod.accountName}</div>
                          </div>
                          <div style={{ marginBottom: '15px' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nomor Rekening / Tujuan:</span>
                              <div style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '1px' }}>{selectedMethod.accountNumber}</div>
                          </div>
                          <div style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Catatan:</span>
                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                  {selectedMethod.instructions}
                              </p>
                          </div>
                      </div>
                  ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Pilih metode pembayaran terlebih dahulu untuk melihat instruksi.</p>
                  )}
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
