import React, { useState, useEffect } from 'react';
import { PlusCircle, CheckCircle } from 'lucide-react';

export default function AdminProductStock({ products, handleUploadStock }) {
    const premiumProducts = products.filter(p => p.type === 'PREMIUM');
    const [productId, setProductId] = useState('');
    const [bulkData, setBulkData] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (premiumProducts.length > 0 && !productId) setProductId(premiumProducts[0].id);
    }, [premiumProducts, productId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        if (!productId) { alert('Pilih produk terlebih dahulu.'); return; }
        const lines = bulkData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const accounts = lines.map(line => {
            const parts = line.split('|').map(p => p.trim());
            return { email: parts[0] || '', password: parts[1] || '', extraInfo: parts[2] || null };
        });
        if (accounts.some(acc => !acc.email || !acc.password)) {
            alert('Format: email|password|info. Pastikan email dan password terisi.');
            return;
        }
        const success = await handleUploadStock(productId, accounts);
        if (success) {
            setSuccessMessage(`Berhasil menambahkan ${accounts.length} akun ke database.`);
            setBulkData('');
        }
    };

    return (
        <div className="glass-card" style={{ maxWidth: '640px' }}>
            <div className="adm-card-header">Upload Akun Premium</div>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Pilih Produk</label>
                    <select className="form-input" value={productId} onChange={e => setProductId(e.target.value)}>
                        {premiumProducts.map(prod => <option key={prod.id} value={prod.id}>{prod.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Data Akun (email|password|info)</label>
                    <textarea rows="6" className="form-input"
                        placeholder="netflix1@gmail.com|pass123|Profil A&#10;netflix2@gmail.com|pass456|Profil B"
                        value={bulkData} onChange={e => setBulkData(e.target.value)}
                        style={{ fontFamily: 'monospace', resize: 'vertical' }} required />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Satu akun per baris. Info tambahan opsional.</span>
                </div>
                {successMessage && (
                    <div style={{ padding: '12px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: '#047857', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <CheckCircle size={16} /> {successMessage}
                    </div>
                )}
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                    <PlusCircle size={16} /> Masukkan ke Stok
                </button>
            </form>
        </div>
    );
}
