import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function AdminCategories({ categories, handleAddCategory, handleDeleteCategory }) {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [type, setType] = useState('SMM');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await handleAddCategory(name, slug, type);
        if (success) { setName(''); setSlug(''); setType('SMM'); }
    };

    return (
        <div className="glass-card">
            <div className="adm-card-header">Kelola Kategori Produk</div>

            <form onSubmit={handleSubmit} className="adm-form-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nama Kategori</label>
                    <input type="text" className="form-input" placeholder="Contoh: Instagram Followers"
                        value={name} onChange={e => { setName(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }} required />
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
                <button type="submit" className="btn btn-primary" style={{ height: '44px', alignSelf: 'flex-end' }}>
                    <Plus size={16} /> Tambah
                </button>
            </form>

            <div style={{ overflowX: 'auto' }}>
                <table className="adm-table">
                    <thead>
                        <tr><th>ID</th><th>Nama</th><th>Slug</th><th>Tipe</th><th>Aksi</th></tr>
                    </thead>
                    <tbody>
                        {categories.map(cat => (
                            <tr key={cat.id}>
                                <td style={{ color: 'var(--text-muted)' }}>#{cat.id}</td>
                                <td style={{ fontWeight: 600 }}>{cat.name}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{cat.slug}</td>
                                <td>
                                    <span className={`badge ${cat.type === 'PREMIUM' ? 'badge-premium' : 'badge-smm'}`}>{cat.type}</span>
                                </td>
                                <td>
                                    <button onClick={() => handleDeleteCategory(cat.id)} className="btn btn-secondary" style={{ padding: '6px 10px', color: 'var(--accent-danger)' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
