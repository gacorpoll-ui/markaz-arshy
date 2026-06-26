import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function AdminProducts({ products, categories, handleAddProduct, loading }) {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [desc, setDesc] = useState('');
    const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
    const [priceUser, setPriceUser] = useState('');
    const [priceReseller, setPriceReseller] = useState('');
    const [type, setType] = useState('PREMIUM');
    const [smmId, setSmmId] = useState('');
    const [durations, setDurations] = useState([]);
    const [oss, setOss] = useState([]);

    if (loading) return <div style={{ textAlign: 'center', padding: '50px 0' }}>Memuat data produk...</div>;

    // Handler Durasi
    const addDuration = () => setDurations([...durations, { label: '', months: 1, priceMultiplier: 1.0, price: '' }]);
    const removeDuration = (index) => setDurations(durations.filter((_, i) => i !== index));
    const updateDuration = (index, field, value) => {
        const newDurations = [...durations];
        newDurations[index][field] = field === 'label' ? value : parseFloat(value) || 0;
        setDurations(newDurations);
    };

    // Handler OS
    const addOs = () => setOss([...oss, '']);
    const removeOs = (index) => setOss(oss.filter((_, i) => i !== index));
    const updateOs = (index, value) => {
        const newOss = [...oss];
        newOss[index] = value;
        setOss(newOss);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        const productData = {
            categoryId, name, slug, description: desc,
            priceUser, priceReseller, type,
            providerServiceId: smmId || undefined,
            durationOptions: durations.length > 0 ? JSON.stringify(durations) : undefined,
            osOptions: oss.length > 0 ? JSON.stringify(oss) : undefined,
        };
        const success = await handleAddProduct(productData);
        if (success) {
            setName(''); setSlug(''); setDesc('');
            setPriceUser(''); setPriceReseller('');
            setSmmId(''); setDurations([]); setOss([]);
        }
    };

    return (
        <div className="glass-card">
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-default)', paddingBottom: '10px' }}>
                Kelola Produk & Layanan
            </h3>

            <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '40px' }}>
                <div className="form-group">
                  <label className="form-label">Nama Produk</label>
                  <input type="text" className="form-input" placeholder="Spotify 1 Bulan Sharing" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Slug URL (Unik)</label>
                  <input type="text" className="form-input" placeholder="spotify-1b-sharing" value={slug} onChange={e => setSlug(e.target.value)} required />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Deskripsi Layanan</label>
                  <input type="text" className="form-input" placeholder="Tuliskan deskripsi lengkap produk..." value={desc} onChange={e => setDesc(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select className="form-input" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Jenis Produk</label>
                  <select className="form-input" value={type} onChange={e => setType(e.target.value)}>
                    <option value="PREMIUM">Premium Account (Auto Delivery)</option>
                    <option value="SMM">Sosial Media (Followers/Likes/Views)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Harga Member (Rp / qty)</label>
                  <input type="number" className="form-input" placeholder="Contoh: 15000" value={priceUser} onChange={e => setPriceUser(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Harga Reseller (Rp / qty)</label>
                  <input type="number" className="form-input" placeholder="Contoh: 12000" value={priceReseller} onChange={e => setPriceReseller(e.target.value)} required />
                </div>

                {type === 'SMM' && (
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">SMM Service API ID (Optional)</label>
                    <input type="text" className="form-input" placeholder="Contoh: 412" value={smmId} onChange={e => setSmmId(e.target.value)} />
                  </div>
                )}

                {type === 'PREMIUM' && (
                  <>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>Pilihan Durasi (Opsional)</label>
                        <button type="button" onClick={addDuration} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                          + Tambah Durasi
                        </button>
                      </div>
                      
                        {durations.map((dur, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Label (e.g. 14 Hari, 1 Bulan)"
                              value={dur.label}
                              onChange={e => updateDuration(idx, 'label', e.target.value)}
                              style={{ flex: 2 }}
                            />
                            <input
                              type="number"
                              className="form-input"
                              placeholder="Harga (Rp)"
                              value={dur.price}
                              onChange={e => updateDuration(idx, 'price', e.target.value)}
                              style={{ flex: 1 }}
                            />
                            <button type="button" onClick={() => removeDuration(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}>
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      {durations.length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-sm)' }}>Belum ada pilihan durasi.</div>}
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>Pilihan OS (Untuk VPS/RDP)</label>
                        <button type="button" onClick={addOs} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                          + Tambah OS
                        </button>
                      </div>

                      {oss.map((os, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Windows Server 2022"
                            value={os}
                            onChange={e => updateOs(idx, e.target.value)}
                            style={{ flex: 1 }}
                          />
                          <button type="button" onClick={() => removeOs(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                      {oss.length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-sm)' }}>Belum ada pilihan OS.</div>}
                    </div>
                  </>
                )}

                <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>
                    <Plus size={16} /> Buat Produk
                  </button>
                </div>
              </form>

              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '15px' }}>Daftar Produk Aktif</h3>
              <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border-default)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 10px' }}>ID</th>
                    <th style={{ padding: '12px 10px' }}>Nama</th>
                    <th style={{ padding: '12px 10px' }}>Kategori</th>
                    <th style={{ padding: '12px 10px' }}>Tipe</th>
                    <th style={{ padding: '12px 10px' }}>Harga Member</th>
                    <th style={{ padding: '12px 10px' }}>Harga Reseller</th>
                    <th style={{ padding: '12px 10px' }}>Durasi/OS</th>
                    <th style={{ padding: '12px 10px', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(prod => {
                    let durInfo = '';
                    let osInfo = '';
                    try {
                      if (prod.durationOptions) {
                        const d = JSON.parse(prod.durationOptions);
                        durInfo = d.map(x => x.label).join(', ');
                      }
                    } catch(e) {}
                    try {
                      if (prod.osOptions) {
                        const o = JSON.parse(prod.osOptions);
                        osInfo = o.join(', ');
                      }
                    } catch(e) {}

                    return (
                      <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                        <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>#{prod.id}</td>
                        <td style={{ padding: '12px 10px', fontWeight: '600' }}>{prod.name}</td>
                        <td style={{ padding: '12px 10px' }}>{prod.category.name}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span className={`badge ${prod.type === 'PREMIUM' ? 'badge-premium' : 'badge-smm'}`}>{prod.type}</span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>Rp {prod.priceUser.toLocaleString('id-ID')}</td>
                        <td style={{ padding: '12px 10px' }}>Rp {prod.priceReseller.toLocaleString('id-ID')}</td>
                        <td style={{ padding: '12px 10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          {durInfo && <div>⏱ {durInfo}</div>}
                          {osInfo && <div>💻 {osInfo}</div>}
                          {!durInfo && !osInfo && '—'}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '6px', borderRadius: '8px' }}
                            onClick={() => {
                              if (window.confirm('Yakin ingin menghapus produk ini? Jika ada pesanan terhubung, produk akan di-arsip.')) {
                                // Kita bisa kirim ID ini ke parent atau handle langsung
                                fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products/${prod.id}`, {
                                  method: 'DELETE',
                                  headers: { 'Authorization': `Bearer ${window.localStorage.getItem('token')}` }
                                }).then(res => {
                                  if (res.ok) window.location.reload();
                                  else alert('Gagal menghapus produk.');
                                });
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
    );
}
