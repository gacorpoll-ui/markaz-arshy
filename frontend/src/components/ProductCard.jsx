import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product, user, getUnitName }) {
  const navigate = useNavigate();
  const price = user?.role === 'RESELLER' ? product.priceReseller : product.priceUser;

  const getFeatureBadge = (productName) => {
    const nameLower = productName.toLowerCase();
    if (nameLower.includes('fast') || nameLower.includes('cepat')) return <span className="badge badge-success" style={{ fontSize: '9px', padding: '2px 8px' }}>Fast Delivery</span>;
    if (nameLower.includes('garansi') || nameLower.includes('jaminan')) return <span className="badge badge-info" style={{ fontSize: '9px', padding: '2px 8px' }}>Garansi</span>;
    if (nameLower.includes('promo') || nameLower.includes('diskon')) return <span className="badge badge-danger" style={{ fontSize: '9px', padding: '2px 8px' }}>Promo!</span>;
    if (nameLower.includes('best') || nameLower.includes('terlaris')) return <span className="badge badge-success" style={{ fontSize: '9px', padding: '2px 8px' }}>Best Seller</span>;
    return null;
  };

  return (
    <div className="product-card">
      <div className="product-card-body">
        <div className="product-card-header">
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-info" style={{ fontSize: '9px', padding: '2px 8px' }}>{product.category.name}</span>
            {getFeatureBadge(product.name)}
          </div>
          {product.type === 'PREMIUM' && (
            product.providerStatus === 'Gangguan' ? (
              <span className="badge badge-danger" style={{ fontSize: '9px', padding: '3px 8px' }}>Gangguan</span>
            ) : product.providerServiceId ? (
              <span className="product-card-stock-status" style={{ color: '#047857' }}>Tersedia</span>
            ) : (
              <span className="product-card-stock-status" style={{ color: product.stockCount > 0 ? '#047857' : '#DC2626' }}>
                Stok: {product.stockCount}
              </span>
            )
          )}
        </div>
        <h4 className="product-card-title">{product.name}</h4>
        <p className="product-card-description">{product.description?.substring(0, 100)}...</p>
      </div>

      <div className="product-card-footer">
        <div className="product-card-price">
          <span className="product-card-price-label">Mulai Dari</span>
          <span className="product-card-price-value">
            Rp {price.toLocaleString('id-ID')}
          </span>
          {product.type === 'SMM' && (
            <span className="product-card-price-unit">{getUnitName(product.name)} / 1k</span>
          )}
        </div>
        <button
          onClick={() => navigate(`/product/${product.slug}`)}
          className="btn btn-primary btn-md product-card-btn"
        >
          <ShoppingCart size={16} /> Beli
        </button>
      </div>
    </div>
  );
}
