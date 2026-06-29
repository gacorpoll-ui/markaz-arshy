import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, MapPin, Truck, CheckCircle, RefreshCw, AlertTriangle, Package } from 'lucide-react';

const STEPS = ['Alamat', 'Kurir', 'Konfirmasi'];

function formatRupiah(n) { return `Rp ${Math.round(n || 0).toLocaleString('id-ID')}`; }

export default function CheckoutPage({ user, token }) {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Step 1 state
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ label: 'Rumah', recipientName: '', phoneNumber: '', province: '', city: '', district: '', village: '', villageCode: '', fullAddress: '', postalCode: '', isDefault: false });
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [regionLoading, setRegionLoading] = useState(false);
  const [submittingAddress, setSubmittingAddress] = useState(false);

  // Step 2 state
  const [couriers, setCouriers] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState('');

  // Step 3 state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [lastOrderIds, setLastOrderIds] = useState([]);

  // Payment proof submission
  const submitPaymentProof = async () => {
    if (!paymentProofFile || !orderId) return;
    setSubmittingProof(true);
    try {
      const formData = new FormData();
      formData.append('paymentProof', paymentProofFile);
      formData.append('bankName', paymentInfo?.bank || '');
      formData.append('accountName', paymentInfo?.accountName || '');
      formData.append('amount', String(total));

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/orders/${orderId}/verify-payment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProofSubmitted(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleProofFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Ukuran maksimal 5MB'); return; }
    setPaymentProofFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPaymentProofPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Origin village (Jakmall warehouse) — configurable
  const ORIGIN_VILLAGE_CODE = '3204282001';

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const H = { headers: { 'Authorization': `Bearer ${token}` } };
      const [cartRes, addrRes, bankRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cart`, H),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/addresses`, H),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/deposits/payment-methods`, H),
      ]);
      const cartData = await cartRes.json();
      const addrData = await addrRes.json();
      const bankData = await bankRes.json();

      if (!cartRes.ok) throw new Error(cartData.error);

      setCart(cartData.cart);
      setAddresses(addrData.addresses || []);
      if (addrData.addresses?.length > 0) {
        const def = addrData.addresses.find(a => a.isDefault);
        setSelectedAddressId(def ? def.id : addrData.addresses[0].id);
      }
      setBankAccounts(bankData.paymentMethods || []);
      if ((bankData.paymentMethods || []).length > 0) {
        setSelectedBankId(bankData.paymentMethods[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Address ──
  const fetchProvinces = async () => {
    setRegionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/regional/provinces`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setProvinces(data.data || []);
    } catch {} finally { setRegionLoading(false); }
  };

  const fetchRegencies = async (code) => {
    setRegionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/regional/regencies?province_code=${code}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setRegencies(data.data || []);
    } catch {} finally { setRegionLoading(false); }
  };

  const fetchDistricts = async (code) => {
    setRegionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/regional/districts?regency_code=${code}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setDistricts(data.data || []);
    } catch {} finally { setRegionLoading(false); }
  };

  const fetchVillages = async (code) => {
    setRegionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/regional/villages?district_code=${code}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setVillages(data.data || []);
    } catch {} finally { setRegionLoading(false); }
  };

  const handleProvinceChange = (code) => {
    const p = provinces.find(x => x.code === code);
    setAddressForm(prev => ({ ...prev, province: p?.name || '', city: '', district: '', village: '', villageCode: '' }));
    setRegencies([]); setDistricts([]); setVillages([]);
    if (code) fetchRegencies(code);
  };

  const handleRegencyChange = (code) => {
    const r = regencies.find(x => x.code === code);
    setAddressForm(prev => ({ ...prev, city: r?.name || '', district: '', village: '', villageCode: '' }));
    setDistricts([]); setVillages([]);
    if (code) fetchDistricts(code);
  };

  const handleDistrictChange = (code) => {
    const d = districts.find(x => x.code === code);
    setAddressForm(prev => ({ ...prev, district: d?.name || '', village: '', villageCode: '' }));
    setVillages([]);
    if (code) fetchVillages(code);
  };

  const handleVillageChange = (code) => {
    const v = villages.find(x => x.code === code);
    setAddressForm(prev => ({ ...prev, village: v?.name || '', villageCode: code }));
  };

  const handleSaveAddress = async () => {
    const { label, recipientName, phoneNumber, province, city, district, village, fullAddress } = addressForm;
    if (!recipientName || !phoneNumber || !province || !city || !district || !village || !fullAddress) {
      alert('Lengkapi semua field alamat.'); return;
    }
    setSubmittingAddress(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(addressForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAddresses(prev => [...prev, data.address]);
      setSelectedAddressId(data.address.id);
      setShowAddressForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingAddress(false);
    }
  };

  const goToStep2 = () => {
    if (!selectedAddressId) { alert('Pilih alamat pengiriman.'); return; }
    setStep(1);
    fetchShippingCost();
  };

  // ── Step 2: Shipping ──
  const totalWeight = useMemo(() => {
    if (!cart?.items) return 1;
    const totalG = cart.items.reduce((sum, item) => {
      const w = item.product.weight || 0;
      return sum + (w * item.quantity);
    }, 0);
    return Math.max(1, Math.ceil(totalG / 1000)); // convert to kg, min 1
  }, [cart]);

  const fetchShippingCost = async () => {
    const addr = addresses.find(a => a.id === selectedAddressId);
    if (!addr?.villageCode) { setShippingError('Alamat belum memiliki kode kelurahan.'); return; }
    setShippingLoading(true);
    setShippingError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/shipping/cost?originVillageCode=${ORIGIN_VILLAGE_CODE}&destinationVillageCode=${addr.villageCode}&weight=${totalWeight}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCouriers(data.couriers || []);
      if (data.couriers?.length > 0) setSelectedCourier(data.couriers[0]);
    } catch (err) {
      setShippingError(err.message);
    } finally {
      setShippingLoading(false);
    }
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  const shippingCost = selectedCourier?.price || 0;
  const subtotal = cart?.items?.reduce((s, item) => s + (item.product.priceUser * item.quantity), 0) || 0;
  const total = subtotal + shippingCost;

  // ── Step 3: Confirm & Pay ──
  const handlePay = async () => {
    if (!selectedAddressId || !selectedCourier) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/orders/physical-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          cartId: cart.id,
          addressId: selectedAddressId,
          courier: selectedCourier.courier,
          courierService: selectedCourier.services?.[0]?.service || '',
          courierServiceName: selectedCourier.services?.[0]?.serviceName || selectedCourier.courierName,
          shippingCost,
          paymentMethod,
          bankId: paymentMethod === 'transfer' ? selectedBankId : null,
          selectedVariant: cart?.items?.reduce((acc, item) => {
            if (item.selectedVariant) acc[item.productId] = item.selectedVariant;
            return acc;
          }, {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.dispatchEvent(new Event('cart-update'));

      if (paymentMethod === 'transfer') {
        setPaymentInfo(data.paymentInfo);
        setLastOrderIds(data.orders?.map(o => o.id) || []);
        setOrderId(data.orders?.[0]?.id || null);
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/dashboard'), 3000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
      <RefreshCw size={32} className="spin" style={{ color: 'var(--text-muted)' }} />
    </div>
  );

  if (error && !cart) return (
    <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
      <AlertTriangle size={32} style={{ color: 'var(--accent-danger)', marginBottom: '12px' }} />
      <p style={{ marginBottom: '16px' }}>{error}</p>
      <button onClick={() => navigate('/cart')} className="btn btn-primary">Kembali ke Keranjang</button>
    </div>
  );

  if (success) return (
    <div className="container" style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '40px' }}>
        <CheckCircle size={64} style={{ color: 'var(--accent-success)', marginBottom: '20px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Pesanan Berhasil!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Pesanan Anda sedang diproses.</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>Mengalihkan ke Dashboard...</p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary">Ke Dashboard</button>
      </div>
    </div>
  );

  if (paymentInfo) return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '560px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: proofSubmitted ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
          margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {proofSubmitted ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M12 9v4" /><path d="M12 17h.01" />
            </svg>
          )}
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>
          {proofSubmitted ? 'Bukti Terkirim!' : 'Menunggu Pembayaran'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
          {proofSubmitted ? 'Bukti pembayaran Anda sedang diverifikasi admin.' : 'Silakan transfer ke rekening di bawah ini'}
        </p>

        {/* QRIS Image (if available) */}
        {paymentInfo.qrisImage && (
          <div style={{ marginBottom: '20px' }}>
            <img src={paymentInfo.qrisImage} alt="QRIS Code" style={{ maxWidth: '240px', width: '100%', borderRadius: '12px', border: '1px solid var(--border-default)' }} />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Scan QRIS untuk pembayaran</p>
          </div>
        )}

        {/* Bank Transfer Details */}
        <div style={{
          background: 'var(--bg-muted)', borderRadius: '12px', padding: '20px',
          marginBottom: '20px', textAlign: 'left',
        }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Bank</div>
            <div style={{ fontSize: '16px', fontWeight: '700' }}>{paymentInfo.bank}</div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Nomor Rekening</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'monospace', letterSpacing: '0.1em', color: 'var(--accent-primary)' }}>{paymentInfo.accountNumber}</span>
              <button onClick={() => { navigator.clipboard.writeText(paymentInfo.accountNumber); }}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-default)', background: '#fff', fontSize: '10px', fontWeight: '600', cursor: 'pointer', color: 'var(--text-muted)' }}>
                Salin
              </button>
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Atas Nama</div>
            <div style={{ fontSize: '15px', fontWeight: '600' }}>{paymentInfo.accountName}</div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total yang harus dibayar</span>
              <span style={{ fontSize: '20px', fontWeight: '900', color: 'var(--accent-primary)' }}>{formatRupiah(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Proof Upload */}
        {!proofSubmitted && (
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Upload Bukti Pembayaran</div>

            {paymentProofPreview ? (
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <img src={paymentProofPreview} alt="Bukti bayar" style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', borderRadius: '10px', border: '1px solid var(--border-default)' }} />
                <button onClick={() => { setPaymentProofFile(null); setPaymentProofPreview(''); }}
                  style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                  &times;
                </button>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{paymentProofFile?.name}</div>
              </div>
            ) : (
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '24px', borderRadius: '10px', border: '2px dashed var(--border-default)',
                cursor: 'pointer', transition: 'border-color 0.2s', marginBottom: '10px',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5" style={{ marginBottom: '8px' }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                </svg>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Klik untuk upload screenshot bukti transfer</span>
                <span style={{ fontSize: '10px', color: '#bbb', marginTop: '2px' }}>JPG, PNG, WEBP (maks 5MB)</span>
                <input type="file" accept="image/*" onChange={handleProofFileSelect} style={{ display: 'none' }} />
              </label>
            )}

            <button
              onClick={submitPaymentProof}
              disabled={submittingProof || !paymentProofFile}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                background: paymentProofFile ? '#10b981' : '#e0e0e0',
                color: '#fff', fontSize: '13px', fontWeight: '700', cursor: paymentProofFile ? 'pointer' : 'not-allowed',
              }}
            >
              {submittingProof ? 'Mengirim...' : 'Kirim Bukti Bayar'}
            </button>
          </div>
        )}

        {proofSubmitted && (
          <div style={{
            background: 'rgba(16,185,129,0.08)', borderRadius: '10px', padding: '14px',
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
            <span style={{ fontSize: '12px', color: '#065f46', lineHeight: 1.5 }}>
              Bukti pembayaran berhasil dikirim. Admin akan memverifikasi dalam 1×24 jam.
            </span>
          </div>
        )}

        <div style={{
          background: 'rgba(245,158,11,0.08)', borderRadius: '10px', padding: '14px',
          display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '20px', textAlign: 'left',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div style={{ fontSize: '12px', color: '#92400e', lineHeight: 1.5 }}>
            Pesanan akan diproses setelah pembayaran dikonfirmasi oleh admin.
          </div>
        </div>

        <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '800', borderRadius: '12px' }}>
          Ke Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '800px', padding: '40px 20px' }}>
      {/* Steps indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '40px' }}>
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i <= step ? 'var(--accent-primary)' : 'var(--bg-muted)',
              color: i <= step ? '#fff' : 'var(--text-muted)',
              fontWeight: '700', fontSize: '13px', transition: 'all 0.3s',
            }}>{i + 1}</div>
            <span style={{ fontSize: '13px', fontWeight: i === step ? '700' : '500', color: i <= step ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {s}
            </span>
            {i < STEPS.length - 1 && <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Address */}
      {step === 0 && (
        <div className="animate-fade-in">
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} style={{ color: 'var(--accent-primary)' }} /> Alamat Pengiriman
          </h3>

          {addresses.length === 0 && !showAddressForm && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Belum ada alamat tersimpan.</p>
              <button onClick={() => { setShowAddressForm(true); fetchProvinces(); }} className="btn btn-primary">Tambah Alamat</button>
            </div>
          )}

          {/* Address cards */}
          {addresses.length > 0 && !showAddressForm && (
            <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
              {addresses.map(addr => (
                <div key={addr.id} onClick={() => setSelectedAddressId(addr.id)}
                  style={{
                    padding: '16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                    border: selectedAddressId === addr.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                    background: selectedAddressId === addr.id ? 'var(--accent-primary-light)' : 'var(--bg-surface)',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{addr.recipientName}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {addr.province}, {addr.city}, {addr.district}, {addr.village}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{addr.fullAddress}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {addr.phoneNumber} {addr.isDefault && <span className="badge badge-primary">Utama</span>}
                      </div>
                    </div>
                    {selectedAddressId === addr.id && (
                      <CheckCircle size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add address form */}
          {showAddressForm ? (
            <div className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
              <h4 style={{ fontWeight: '700', marginBottom: '16px' }}>Alamat Baru</h4>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input className="form-input" placeholder="Label (Rumah/Kantor)" value={addressForm.label} onChange={e => setAddressForm(p => ({ ...p, label: e.target.value }))} />
                  <input className="form-input" placeholder="Nama Penerima" value={addressForm.recipientName} onChange={e => setAddressForm(p => ({ ...p, recipientName: e.target.value }))} />
                </div>
                <input className="form-input" placeholder="No. HP" value={addressForm.phoneNumber} onChange={e => setAddressForm(p => ({ ...p, phoneNumber: e.target.value }))} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <select className="form-input" value={addressForm.province ? provinces.find(p => p.name === addressForm.province)?.code || '' : ''} onChange={e => handleProvinceChange(e.target.value)} onClick={() => { if (provinces.length === 0) fetchProvinces(); }}>
                    <option value="">Provinsi</option>
                    {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                  </select>
                  <select className="form-input" value={addressForm.city ? regencies.find(r => r.name === addressForm.city)?.code || '' : ''} onChange={e => handleRegencyChange(e.target.value)} disabled={!addressForm.province}>
                    <option value="">Kota/Kab</option>
                    {regencies.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <select className="form-input" value={addressForm.district ? districts.find(d => d.name === addressForm.district)?.code || '' : ''} onChange={e => handleDistrictChange(e.target.value)} disabled={!addressForm.city}>
                    <option value="">Kecamatan</option>
                    {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                  </select>
                  <select className="form-input" value={addressForm.villageCode || ''} onChange={e => handleVillageChange(e.target.value)} disabled={!addressForm.district}>
                    <option value="">Kelurahan</option>
                    {villages.map(v => <option key={v.code} value={v.code}>{v.name}</option>)}
                  </select>
                </div>
                <textarea className="form-input" placeholder="Alamat lengkap (jalan, gang, no. rumah)" value={addressForm.fullAddress} onChange={e => setAddressForm(p => ({ ...p, fullAddress: e.target.value }))} rows={2} />
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input className="form-input" placeholder="Kode Pos (opsional)" value={addressForm.postalCode} onChange={e => setAddressForm(p => ({ ...p, postalCode: e.target.value }))} style={{ flex: 1 }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm(p => ({ ...p, isDefault: e.target.checked }))} />
                    Alamat utama
                  </label>
                </div>
                {regionLoading && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Memuat data wilayah...</p>}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button onClick={handleSaveAddress} className="btn btn-primary" disabled={submittingAddress} style={{ flex: 1, padding: '10px' }}>
                  {submittingAddress ? 'Menyimpan...' : 'Simpan Alamat'}
                </button>
                <button onClick={() => setShowAddressForm(false)} className="btn btn-secondary" style={{ padding: '10px' }}>Batal</button>
              </div>
            </div>
          ) : addresses.length > 0 && (
            <button onClick={() => { setShowAddressForm(true); fetchProvinces(); }} className="btn btn-secondary" style={{ width: '100%', padding: '10px', marginBottom: '16px' }}>
              + Tambah Alamat Baru
            </button>
          )}

          <button onClick={goToStep2} className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '800', borderRadius: '12px' }}>
            Lanjut ke Pengiriman <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Step 2: Courier */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={18} style={{ color: 'var(--accent-primary)' }} /> Metode Pengiriman
          </h3>

          {/* Address summary */}
          {selectedAddress && (
            <div className="glass-card" style={{ padding: '14px', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ fontWeight: '700', marginBottom: '4px' }}>{selectedAddress.recipientName}</div>
              <div style={{ color: 'var(--text-secondary)' }}>{selectedAddress.fullAddress}, {selectedAddress.village}, {selectedAddress.city}, {selectedAddress.province}</div>
            </div>
          )}

          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Berat total: <strong>{totalWeight} kg</strong>
          </div>

          {shippingLoading && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
              <RefreshCw size={24} className="spin" style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Menghitung ongkos kirim...</p>
            </div>
          )}

          {shippingError && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '20px' }}>
              <AlertTriangle size={24} style={{ color: 'var(--accent-warning)', marginBottom: '8px' }} />
              <p style={{ color: 'var(--accent-danger)', fontSize: '13px', marginBottom: '12px' }}>{shippingError}</p>
              <button onClick={fetchShippingCost} className="btn btn-secondary">Coba Lagi</button>
            </div>
          )}

          {!shippingLoading && !shippingError && couriers.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Tidak ada kurir tersedia untuk alamat ini.</p>
            </div>
          )}

          {!shippingLoading && couriers.length > 0 && (
            <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
              {couriers.map((c, i) => (
                <div key={c.courier} onClick={() => setSelectedCourier(c)}
                  style={{
                    padding: '14px', borderRadius: '12px', cursor: 'pointer',
                    border: selectedCourier?.courier === c.courier ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                    background: selectedCourier?.courier === c.courier ? 'var(--accent-primary-light)' : 'var(--bg-surface)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px' }}>{c.courierName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {c.services?.[0]?.serviceName || 'Regular'} {c.estimation && `• ${c.estimation}`}
                    </div>
                  </div>
                  <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--accent-primary)' }}>
                    {formatRupiah(c.price)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setStep(0)} className="btn btn-secondary" style={{ padding: '14px', fontSize: '14px', borderRadius: '12px' }}>
              <ChevronLeft size={16} /> Kembali
            </button>
            <button onClick={() => setStep(2)} className="btn btn-primary" style={{ flex: 1, padding: '14px', fontSize: '15px', fontWeight: '800', borderRadius: '12px' }}
              disabled={!selectedCourier || shippingLoading}>
              Lanjut ke Pembayaran <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 2 && (
        <div className="animate-fade-in">
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} style={{ color: 'var(--accent-primary)' }} /> Konfirmasi Pesanan
          </h3>

          <div className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
            <h4 style={{ fontWeight: '700', fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={14} /> Item Pesanan
            </h4>
            {cart?.items?.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600' }}>{item.product.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>× {item.quantity}</div>
                </div>
                <div style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>
                  {formatRupiah(item.product.priceUser * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
            <h4 style={{ fontWeight: '700', fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} /> Alamat
            </h4>
            {selectedAddress && (
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{selectedAddress.recipientName}</div>
                <div>{selectedAddress.fullAddress}, {selectedAddress.village}, {selectedAddress.city}, {selectedAddress.province}</div>
                <div>{selectedAddress.phoneNumber}</div>
              </div>
            )}
          </div>

          {selectedCourier && (
            <div className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
              <h4 style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={14} /> Kurir
              </h4>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {selectedCourier.courierName} — {selectedCourier.services?.[0]?.serviceName || 'Regular'}
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
            <h4 style={{ fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>Metode Pembayaran</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Wallet */}
              <button onClick={() => setPaymentMethod('wallet')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 16px', borderRadius: '10px',
                  border: paymentMethod === 'wallet' ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                  background: paymentMethod === 'wallet' ? 'var(--accent-primary-light)' : 'var(--bg-surface)',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M12 9v4" /><path d="M12 17h.01" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>Dompet Markaz-Arshy</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Saldo: {formatRupiah(user?.balance || 0)}</div>
                </div>
                {paymentMethod === 'wallet' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                )}
              </button>

              {/* Bank transfer options */}
              {bankAccounts.map(bank => (
                <button key={bank.id} onClick={() => { setPaymentMethod('transfer'); setSelectedBankId(bank.id); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 16px', borderRadius: '10px',
                    border: paymentMethod === 'transfer' && selectedBankId === bank.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                    background: paymentMethod === 'transfer' && selectedBankId === bank.id ? 'var(--accent-primary-light)' : 'var(--bg-surface)',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: bank.qrImage ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #f97316)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    fontSize: '11px', fontWeight: '800', color: '#fff', overflow: 'hidden',
                  }}>
                    {bank.qrImage ? <img src={bank.qrImage} alt="QRIS" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : bank.name?.substring(0, 3)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{bank.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {bank.accountName} — {bank.accountNumber}
                    </div>
                  </div>
                  {paymentMethod === 'transfer' && selectedBankId === bank.id && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Total Summary */}
          <div className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal produk</span>
              <span style={{ fontWeight: '600' }}>{formatRupiah(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Ongkos kirim</span>
              <span style={{ fontWeight: '600' }}>{formatRupiah(shippingCost)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-default)', fontSize: '18px' }}>
              <span style={{ fontWeight: '700' }}>Total</span>
              <span style={{ fontWeight: '900', color: 'var(--accent-primary)' }}>{formatRupiah(total)}</span>
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', color: 'var(--accent-danger)', fontSize: '13px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setStep(1)} className="btn btn-secondary" style={{ padding: '14px', fontSize: '14px', borderRadius: '12px' }}>
              <ChevronLeft size={16} /> Kembali
            </button>
            <button onClick={handlePay} disabled={submitting || (paymentMethod === 'wallet' && (user?.balance || 0) < total)}
              className="btn btn-primary" style={{ flex: 1, padding: '14px', fontSize: '16px', fontWeight: '800', borderRadius: '12px' }}>
              {submitting ? <><RefreshCw size={16} className="spin" /> Memproses...</> :
               paymentMethod === 'wallet' && (user?.balance || 0) < total ? 'Saldo Tidak Mencukupi' :
               paymentMethod === 'transfer' ? `Pesan — ${formatRupiah(total)}` :
               `Bayar — ${formatRupiah(total)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
