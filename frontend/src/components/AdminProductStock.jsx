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
        if (!productId) { alert('Pilih produk.'); return; }
        const lines = bulkData.split('\n').map(l => l.trim()).filter(l => l.length);
        const accounts = lines.map(l => { const p = l.split('|').map(x => x.trim()); return { email: p[0] || '', password: p[1] || '', extraInfo: p[2] || null }; });
        if (accounts.some(a => !a.email || !a.password)) { alert('Format: email|password|info.'); return; }
        const ok = await handleUploadStock(productId, accounts);
        if (ok) { setSuccessMessage(`✅ ${accounts.length} akun ditambahkan.`); setBulkData(''); }
    };

    return (
        <div className="adm-card" style={{ maxWidth: 600 }}>
            <div className="adm-card-header">Upload Akun Premium</div>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Pilih Produk</label>
                    <select className="form-input" value={productId} onChange={e => setProductId(e.target.value)}>
                        {premiumProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Data Akun (email|password|info)</label>
                    <textarea rows={6} className="form-input"
                        placeholder="email1@gmail.com|pass123|Info&#10;email2@gmail.com|pass456|Info"
                        value={bulkData} onChange={e => setBulkData(e.target.value)}
                        style={{ fontFamily: 'monospace', resize: 'vertical' }} required />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Satu akun per baris.</span>
                </div>
                {successMessage && <div className="adm-alert adm-alert-success" style={{ marginBottom: 16 }}><CheckCircle size={16} /> {successMessage}</div>}
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 12 }}><PlusCircle size={16} /> Masukkan ke Stok</button>
            </form>
        </div>
    );
}
