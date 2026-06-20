import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function AdminCategories({
    categories,
    handleAddCategory,
    handleDeleteCategory,
}) {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [type, setType] = useState('SMM');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await handleAddCategory(name, slug, type);
        if (success) {
            setName('');
            setSlug('');
            setType('SMM');
        }
    };

    return (
        <div className="glass-card">
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                Kelola Kategori Produk
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '15px', alignItems: 'flex-end', marginBottom: '40px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nama Kategori</label>
                    <input type="text" className="form-input" placeholder="Contoh: Instagram Followers" value={name} onChange={e => {setName(e.target.value); if(!slug) setSlug(e.target.value.toLowerCase().replace(/ /g, '-'))}} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Slug (URL)</label>
                    <input type="text" className="form-input" placeholder="ig-followers" value={slug} onChange={e => setSlug(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Tipe</label>
                    <select className="form-input" value={type} onChange={e => setType(e.target.value)}>
                        <option value="SMM">SMM (Medsos)</option>
                        <option value="PREMIUM">PREMIUM (Akun/VPS)</option>
                    </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ height: '45px' }}>
                    <Plus size={18} /> Tambah
                </button>
            </form>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>ID</th>
                        <th style={{ padding: '12px' }}>Nama</th>
                        <th style={{ padding: '12px' }}>Slug</th>
                        <th style={{ padding: '12px' }}>Tipe</th>
                        <th style={{ padding: '12px' }}>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(cat => (
                        <tr key={cat.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '12px', color: 'var(--text-muted)' }}>#{cat.id}</td>
                            <td style={{ padding: '12px', fontWeight: '600' }}>{cat.name}</td>
                            <td style={{ padding: '12px', fontFamily: 'monospace' }}>{cat.slug}</td>
                            <td style={{ padding: '12px' }}>
                                <span className={`badge ${cat.type === 'PREMIUM' ? 'badge-premium' : 'badge-smm'}`}>{cat.type}</span>
                            </td>
                            <td style={{ padding: '12px' }}>
                                <button onClick={() => handleDeleteCategory(cat.id)} className="btn btn-secondary" style={{ padding: '6px', color: 'var(--color-error)' }}>
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}