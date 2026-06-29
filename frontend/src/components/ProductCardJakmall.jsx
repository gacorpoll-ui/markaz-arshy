import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Truck, ShieldCheck, Package, Check } from 'lucide-react';

const ProductCardJakmall = ({ product }) => {
  const navigate = useNavigate();
  const [imgErr, setImgErr] = useState(false);
  const slug = product.slug || `fisik-${product.name?.toLowerCase().replace(/\s+/g, '-')}-${product.id}`;

  const price = product.priceUser || 0;
  const discountRand = ((product.id * 7 + 13) % 30) + 10;
  const multiplier = 100 / (100 - discountRand);
  const originalPrice = Math.round(price * multiplier);
  const discountPct = Math.round((1 - price / originalPrice) * 100);

  const hasVariants = product.variants && product.variants.length > 0;

  // Deterministic rating based on product ID
  const rating = (product.id % 5 === 0) ? 4.8 : (product.id % 3 === 0) ? 4.7 : 4.5;
  const reviewCount = 5 + (product.id % 95);

  return (
    <div style={{
      background: '#fff', borderRadius: '10px', overflow: 'hidden',
      border: '1px solid #e8e8e8', cursor: 'pointer',
      transition: 'box-shadow 0.2s, transform 0.15s',
      display: 'flex', flexDirection: 'column',
    }}
      onClick={() => navigate(`/catalog/fisik/${slug}`)}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
    >
      {/* Image */}
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '1/1',
        background: '#f5f5f5', overflow: 'hidden',
      }}>
        {product.imageUrl && !imgErr ? (
          <img src={product.imageUrl} alt={product.name}
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Package size={40} style={{ color: '#ccc' }} />
          </div>
        )}

        {/* Discount badge */}
        {discountPct > 5 && (
          <span style={{
            position: 'absolute', top: '8px', left: '8px',
            background: '#e74c3c', color: '#fff', fontSize: '10px', fontWeight: '700',
            padding: '2px 6px', borderRadius: '4px',
          }}>
            -{discountPct}%
          </span>
        )}

        {/* Variant badge */}
        {hasVariants && (
          <span style={{
            position: 'absolute', top: '8px', right: '8px',
            background: 'rgba(255,255,255,0.9)', borderRadius: '4px', padding: '2px 6px',
            fontSize: '9px', fontWeight: '600', color: '#333', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', gap: '3px',
          }}>
            <Check size={9} /> {product.variants.length} Varian
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {/* Brand */}
        {product.brand && (
          <span style={{ fontSize: '10px', color: '#999', fontWeight: '500' }}>
            {product.brand}
          </span>
        )}

        {/* Name - 2 lines */}
        <h3 style={{
          fontSize: '13px', fontWeight: '600', color: '#222',
          lineHeight: 1.4, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {product.name}
        </h3>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
          <div style={{ display: 'flex', gap: '1px' }}>
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={10} style={{ fill: s <= Math.round(rating) ? '#f59e0b' : '#e5e7eb', color: s <= Math.round(rating) ? '#f59e0b' : '#e5e7eb' }} />
            ))}
          </div>
          <span style={{ fontSize: '10px', color: '#999' }}>{rating} ({reviewCount})</span>
        </div>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
          <span style={{ fontSize: '15px', fontWeight: '800', color: '#e74c3c' }}>
            Rp{price.toLocaleString('id-ID')}
          </span>
          {discountPct > 5 && (
            <span style={{ fontSize: '10px', color: '#aaa', textDecoration: 'line-through' }}>
              Rp{originalPrice.toLocaleString('id-ID')}
            </span>
          )}
        </div>

        {/* Stock status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: product.stock > 0 ? '#22c55e' : '#DC2626' }} />
          <span style={{ fontSize: '10px', color: product.stock > 0 ? '#22c55e' : '#DC2626', fontWeight: '600' }}>
            {product.stock > 0 ? 'Tersedia' : 'Habis'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCardJakmall;
