import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';

export default function AdminProductStock({
    products,
    handleUploadStock,
}) {
    const premiumProducts = products.filter(p => p.type === 'PREMIUM');
    const [productId, setProductId] = useState('');
    const [bulkData, setBulkData] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (premiumProducts.length > 0 && !productId) {
            setProductId(premiumProducts[0].id);
        }
    }, [premiumProducts, productId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage('');

        if (!productId) {
            alert('Pilih produk terlebih dahulu.');
            return;
        }

        // Parse bulk stock data: lines separated by \n, fields separated by |
        const lines = bulkData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const accounts = lines.map(line => {
            const parts = line.split('|').map(p => p.trim());
            return {
                email: parts[0] || '',
                password: parts[1] || '',
                extraInfo: parts[2] || null
            };
        });

        if (accounts.some(acc => !acc.email || !acc.password)) {
            alert('Format tidak valid. Pastikan setiap baris memiliki email dan password dipisah dengan karakter |');
            return;
        }

        const success = await handleUploadStock(productId, accounts);
        if (success) {
            setSuccessMessage(`Berhasil menambahkan ${accounts.length} akun ke database stok.`);
            setBulkData('');
        }
    };

    return (
        <div className="glass-card">
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                Upload Akun Premium (Automatic Delivery)
            </h3>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Pilih Produk Premium</label>
                  <select className="form-input" value={productId} onChange={e => setProductId(e.target.value)}>
                    {premiumProducts.map(prod => (
                      <option key={prod.id} value={prod.id}>{prod.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Data Akun (Format: email|password|informasi_tambahan)</label>
                  <textarea
                    rows="6"
                    className="form-input"
                    placeholder="Contoh:&#10;netflix1@gmail.com|passnet123|Profil A - PIN 1122&#10;netflix2@gmail.com|passnet456|Profil B - PIN 5566"
                    value={bulkData}
                    onChange={e => setBulkData(e.target.value)}
                    style={{ fontFamily: 'monospace', resize: 'vertical' }}
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Pisahkan tiap akun baru menggunakan baris baru. Informasi tambahan (opsional) bisa berupa PIN profil / masa aktif.
                  </span>
                </div>

                {successMessage && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 15px',
                    color: '#a7f3d0',
                    fontSize: '13px',
                    marginBottom: '20px'
                  }}>
                    {successMessage}
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                  <PlusCircle size={16} /> Masukkan ke Database Stok
                </button>
              </form>
            </div>
    );
}
