import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Trash2, Star, RefreshCw, ArrowLeft } from 'lucide-react';

export default function AddressPage({ user, token }) {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ label: 'Rumah', recipientName: '', phoneNumber: '', province: '', city: '', district: '', village: '', villageCode: '', fullAddress: '', postalCode: '', isDefault: false });
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [regionLoading, setRegionLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/addresses`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAddresses(data.addresses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Regional API helpers ──
  const fetchProvinces = async () => {
    setRegionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/regional/provinces`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setProvinces(data.data || []);
    } catch {} finally { setRegionLoading(false); }
  };

  const fetchRegencies = async (code) => {
    setRegionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/regional/regencies?province_code=${code}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setRegencies(data.data || []);
    } catch {} finally { setRegionLoading(false); }
  };

  const fetchDistricts = async (code) => {
    setRegionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/regional/districts?regency_code=${code}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setDistricts(data.data || []);
    } catch {} finally { setRegionLoading(false); }
  };

  const fetchVillages = async (code) => {
    setRegionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/regional/villages?district_code=${code}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setVillages(data.data || []);
    } catch {} finally { setRegionLoading(false); }
  };

  const handleProvinceChange = (code) => {
    const p = provinces.find(x => x.code === code);
    setForm(prev => ({ ...prev, province: p?.name || '', city: '', district: '', village: '', villageCode: '' }));
    setRegencies([]); setDistricts([]); setVillages([]);
    if (code) fetchRegencies(code);
  };

  const handleRegencyChange = (code) => {
    const r = regencies.find(x => x.code === code);
    setForm(prev => ({ ...prev, city: r?.name || '', district: '', village: '', villageCode: '' }));
    setDistricts([]); setVillages([]);
    if (code) fetchDistricts(code);
  };

  const handleDistrictChange = (code) => {
    const d = districts.find(x => x.code === code);
    setForm(prev => ({ ...prev, district: d?.name || '', village: '', villageCode: '' }));
    setVillages([]);
    if (code) fetchVillages(code);
  };

  const handleVillageChange = (code) => {
    const v = villages.find(x => x.code === code);
    setForm(prev => ({ ...prev, village: v?.name || '', villageCode: code }));
  };

  // ── CRUD ──
  const openAddForm = () => {
    setEditId(null);
    setForm({ label: 'Rumah', recipientName: '', phoneNumber: '', province: '', city: '', district: '', village: '', villageCode: '', fullAddress: '', postalCode: '', isDefault: false });
    setShowForm(true);
    fetchProvinces();
  };

  const openEditForm = (addr) => {
    setEditId(addr.id);
    setForm({
      label: addr.label || 'Alamat',
      recipientName: addr.recipientName,
      phoneNumber: addr.phoneNumber,
      province: addr.province || '',
      city: addr.city || '',
      district: addr.district || '',
      village: addr.village || '',
      villageCode: addr.villageCode || '',
      fullAddress: addr.fullAddress || '',
      postalCode: addr.postalCode || '',
      isDefault: addr.isDefault || false,
    });
    setShowForm(true);
    fetchProvinces();
    // fetch cascading selectors for pre-fill (simplified: re-fetch all)
  };

  const handleSave = async () => {
    const { label, recipientName, phoneNumber, province, city, district, village, fullAddress } = form;
    if (!recipientName || !phoneNumber || !province || !city || !district || !village || !fullAddress) {
      alert('Lengkapi semua field alamat.'); return;
    }
    setSaving(true);
    try {
      const url = editId
        ? `${import.meta.env.VITE_API_BASE_URL}/api/addresses/${editId}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/addresses`;
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowForm(false);
      setEditId(null);
      fetchAddresses();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus alamat ini?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal menghapus');
      fetchAddresses();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/addresses/${id}/default`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      fetchAddresses();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return (
    <div className="container animate-fade-in" style={{ padding: '60px 20px', textAlign: 'center' }}>
      <RefreshCw size={32} className="spin" style={{ color: 'var(--text-muted)' }} />
    </div>
  );

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 20px', maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ padding: '8px' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-display)' }}>Alamat Saya</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{addresses.length} alamat tersimpan</p>
        </div>
      </div>

      {error && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--accent-danger)', marginBottom: '16px' }}>{error}</p>
          <button onClick={fetchAddresses} className="btn btn-primary">Coba Lagi</button>
        </div>
      )}

      {/* Address list */}
      {!error && !showForm && (
        <>
          {addresses.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '80px 20px' }}>
              <MapPin size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Belum Ada Alamat</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Tambahkan alamat pengiriman Anda.</p>
              <button onClick={openAddForm} className="btn btn-primary"><Plus size={16} /> Tambah Alamat</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
                {addresses.map(addr => (
                  <div key={addr.id} className="glass-card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{addr.label || 'Alamat'}</span>
                          {addr.isDefault && <span className="badge badge-primary" style={{ fontSize: '10px' }}>Utama</span>}
                        </div>
                        <div style={{ fontWeight: '700', fontSize: '15px' }}>{addr.recipientName}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.6' }}>
                          {addr.fullAddress}<br />
                          {addr.village}, {addr.district}, {addr.city}, {addr.province}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{addr.phoneNumber}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                      {!addr.isDefault && (
                        <button onClick={() => handleSetDefault(addr.id)} className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Star size={12} /> Jadikan Utama
                        </button>
                      )}
                      <button onClick={() => openEditForm(addr)} className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(addr.id)} className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', color: 'var(--accent-danger)' }}>
                        <Trash2 size={12} /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={openAddForm} className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '700' }}>
                <Plus size={16} /> Tambah Alamat Baru
              </button>
            </>
          )}
        </>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>
            {editId ? 'Edit Alamat' : 'Alamat Baru'}
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input className="form-input" placeholder="Label (Rumah/Kantor)" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} />
              <input className="form-input" placeholder="Nama Penerima" value={form.recipientName} onChange={e => setForm(p => ({ ...p, recipientName: e.target.value }))} />
            </div>
            <input className="form-input" placeholder="No. HP" value={form.phoneNumber} onChange={e => setForm(p => ({ ...p, phoneNumber: e.target.value }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select className="form-input" value={provinces.find(p => p.name === form.province)?.code || ''} onChange={e => handleProvinceChange(e.target.value)} onClick={() => { if (provinces.length === 0) fetchProvinces(); }}>
                <option value="">Provinsi</option>
                {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
              <select className="form-input" value={regencies.find(r => r.name === form.city)?.code || ''} onChange={e => handleRegencyChange(e.target.value)} disabled={!form.province}>
                <option value="">Kota/Kab</option>
                {regencies.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select className="form-input" value={districts.find(d => d.name === form.district)?.code || ''} onChange={e => handleDistrictChange(e.target.value)} disabled={!form.city}>
                <option value="">Kecamatan</option>
                {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
              </select>
              <select className="form-input" value={form.villageCode || ''} onChange={e => handleVillageChange(e.target.value)} disabled={!form.district}>
                <option value="">Kelurahan</option>
                {villages.map(v => <option key={v.code} value={v.code}>{v.name}</option>)}
              </select>
            </div>
            <textarea className="form-input" placeholder="Alamat lengkap (jalan, gang, no. rumah)" value={form.fullAddress} onChange={e => setForm(p => ({ ...p, fullAddress: e.target.value }))} rows={2} />
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input className="form-input" placeholder="Kode Pos (opsional)" value={form.postalCode} onChange={e => setForm(p => ({ ...p, postalCode: e.target.value }))} style={{ flex: 1 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={form.isDefault} onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))} />
                Alamat utama
              </label>
            </div>
            {regionLoading && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Memuat data wilayah...</p>}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={handleSave} className="btn btn-primary" disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: '10px' }}>
              {saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Simpan Alamat'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="btn btn-secondary" style={{ padding: '10px', borderRadius: '10px' }}>Batal</button>
          </div>
        </div>
      )}
    </div>
  );
}
