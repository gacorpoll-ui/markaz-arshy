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

    if (loading) return <div className="adm-loading">Memuat data produk...</div>;

    const addDuration = () => setDurations([...durations, { label: '', months: 1, priceMultiplier: 1.0, price: '' }]);
    const removeDuration = (i) => setDurations(durations.filter((_, idx) => idx !== i));
    const updateDuration = (i, field, value) => {
        const next = [...durations];
        next[i][field] = field === 'label' ? value : parseFloat(value) || 0;
        setDurations(next);
    };
    const addOs = () => setOss([...oss, '']);
    const removeOs = (i) => setOss(oss.filter((_, idx) => idx !== i));
    const updateOs = (i, value) => { const next = [...oss]; next[i] = value; setOss(next); };

    const onSubmit = async (e) => {
        e.preventDefault();
        const ok = await handleAddProduct({ categoryId, name, slug, description: desc, priceUser, priceReseller, type, providerServiceId: smmId || undefined, durationOptions: durations.length > 0 ? JSON.stringify(durations) : undefined, osOptions: oss.length > 0 ? JSON.stringify(oss) : undefined });
        if (ok) { setName(''); setSlug(''); setDesc(''); setPriceUser(''); setPriceReseller(''); setSmmId(''); setDurations([]); setOss([]); }
    };

    return (
        <div className="glass-card">
            <div className="adm-card-header">Tambah Produk Baru</div>

            <form onSubmit={onSubmit} className="adm-form-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nama Produk</label>
                    <input type="text" className="form-input" placeholder="Spotify 1 Bulan" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Slug URL</label>
                    <input type="text" className="form-input" placeholder="spotify-1b" value={slug} onChange={e => setSlug(e.target.value)} required />
                </div>
                <div className="adm-form-full form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Deskripsi</label>
                    <input type="text" className="form-input" placeholder="Deskripsi produk..." value={desc} onChange={e => setDesc(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Kategori</label>
                    <select className="form-input" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Jenis</label>
                    <select className="form-input" value={type} onChange={e => setType(e.target.value)}>
                        <option value="PREMIUM">Premium Account</option>
                        <option value="SMM">Sosial Media</option>
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Harga User</label>
                    <input type="number" className="form-input" placeholder="15000" value={priceUser} onChange={e => setPriceUser(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Harga Reseller</label>
                    <input type="number" className="form-input" placeholder="12000" value={priceReseller} onChange={e => setPriceReseller(e.target.value)} required />
                </div>

                {type === 'SMM' && (
                    <div className="adm-form-full form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Provider Service ID</label>
                        <input type="text" className="form-input" placeholder="412" value={smmId} onChange={e => setSmmId(e.target.value)} />
                    </div>
                )}

                {type === 'PREMIUM' && (
                    <>
                        <div className="adm-form-full" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>Durasi (opsional)</label>
                                <button type="button" onClick={addDuration} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>+ Tambah</button>
                            </div>
                            {durations.length === 0 && <div className="adm-empty" style={{ padding: '12px', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-sm)' }}>Belum ada durasi</div>}
                            {durations.map((dur, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input type="text" className="form-input" placeholder="Label" value={dur.label} onChange={e => updateDuration(idx, 'label', e.target.value)} style={{ flex: 2 }} />
                                    <input type="number" className="form-input" placeholder="Harga Rp" value={dur.price} onChange={e => updateDuration(idx, 'price', e.target.value)} style={{ flex: 1 }} />
                                    <button type="button" onClick={() => removeDuration(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                        <div className="adm-form-full" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>OS (untuk VPS/RDP)</label>
                                <button type="button" onClick={addOs} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>+ Tambah</button>
                            </div>
                            {oss.length === 0 && <div className="adm-empty" style={{ padding: '12px', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-sm)' }}>Belum ada OS</div>}
                            {oss.map((os, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input type="text" className="form-input" placeholder="Windows Server 2022" value={os} onChange={e => updateOs(idx, e.target.value)} style={{ flex: 1 }} />
                                    <button type="button" onClick={() => removeOs(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <div className="adm-form-actions">
                    <button type="submit" className="btn btn-primary"><Plus size={16} /> Buat Produk</button>
                </div>
            </form>

            <div className="adm-card-header-sm" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Daftar Produk</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>{products.length} produk aktif</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table className="adm-table">
                    <thead>
                        <tr><th>ID</th><th>Nama</th><th>Kategori</th><th>Tipe</th><th>Harga User</th><th>Harga Reseller</th><th>Opsi</th><th style={{ textAlign: 'right' }}>Aksi</th></tr>
                    </thead>
                    <tbody>
                        {products.map(prod => {
                            let durInfo = '', osInfo = '';
                            try { if (prod.durationOptions) { durInfo = JSON.parse(prod.durationOptions).map(x => x.label).join(', '); } } catch {}
                            try { if (prod.osOptions) { osInfo = JSON.parse(prod.osOptions).join(', '); } } catch {}
                            return (
                                <tr key={prod.id}>
                                    <td style={{ color: 'var(--text-muted)' }}>#{prod.id}</td>
                                    <td style={{ fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod.name}</td>
                                    <td>{prod.category.name}</td>
                                    <td><span className={`badge ${prod.type === 'PREMIUM' ? 'badge-premium' : 'badge-smm'}`}>{prod.type}</span></td>
                                    <td>Rp {prod.priceUser.toLocaleString('id-ID')}</td>
                                    <td>Rp {prod.priceReseller.toLocaleString('id-ID')}</td>
                                    <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{durInfo && <div>⏱ {durInfo}</div>}{osInfo && <div>💻 {osInfo}</div>}{!durInfo && !osInfo && '—'}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-danger" style={{ padding: '5px', borderRadius: '6px' }}
                                            onClick={() => {
                                                if (window.confirm('Yakin hapus produk ini?')) {
                                                    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products/${prod.id}`, {
                                                        method: 'DELETE', headers: { Authorization: `Bearer ${window.localStorage.getItem('token')}` }
                                                    }).then(r => { if (r.ok) window.location.reload(); else alert('Gagal.'); });
                                                }
                                            }}>
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
