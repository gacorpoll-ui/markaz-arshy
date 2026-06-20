import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product, user, getUnitName }) {
  const navigate = useNavigate();

  // Helper untuk menentukan badge keunggulan
  const getFeatureBadge = (productName) => {
    const nameLower = productName.toLowerCase();
    if (nameLower.includes('fast') || nameLower.includes('cepat')) return <span className="badge badge-success" style={{ fontSize: '9px' }}>🚀 Fast Delivery</span>;
    if (nameLower.includes('garansi') || nameLower.includes('jaminan')) return <span className="badge badge-premium" style={{ fontSize: '9px' }}>✅ Garansi</span>;
    if (nameLower.includes('promo') || nameLower.includes('diskon')) return <span className="badge badge-danger" style={{ fontSize: '9px' }}>💰 Promo!</span>;
    if (nameLower.includes('best') || nameLower.includes('terlaris')) return <span className="badge badge-smm" style={{ fontSize: '9px' }}>⭐ Best Seller</span>;
    return null;
  };

  return (
    <div className="glass-card product-card">
      <div>
        <div className="product-card-header">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="badge badge-smm" style={{ fontSize: '9px' }}>{product.category.name}</span>
            {getFeatureBadge(product.name)}
          </div>
          {product.type === 'PREMIUM' && (
            product.providerStatus === 'Gangguan' ? (
              <span className="badge badge-danger" style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                🚫 Gangguan
              </span>
            ) : product.providerServiceId ? (
              <span className="product-card-stock-status" style={{ color: 'var(--color-success)', fontWeight: '700' }}>
                🟢 Tersedia
              </span>
            ) : (
              <span className="product-card-stock-status" style={{ color: product.stockCount > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                Stok: {product.stockCount}
              </span>
            )
          )}
        </div>
        <h4 className="product-card-title">{product.name}</h4>
        <p className="product-card-description">{product.description?.substring(0, 100)}...</p>
      </div>

      <div className="product-card-footer">
        <div>
          <span className="product-card-price-label">Mulai Dari</span>
          <span className="product-card-price-value">
            Rp {(user?.role === 'RESELLER' ? product.priceReseller : product.priceUser).toLocaleString('id-ID')}
            <small className="product-card-price-unit">
              {product.type === 'SMM' ? ` ${getUnitName(product.name)} / 1k` : ''}
            </small>
          </span>
        </div>
        <button onClick={() => navigate(`/product/${product.slug}`)} className="btn btn-primary">
          <ShoppingCart size={16} /> Beli
        </button>
      </div>
    </div>
  );
}
