import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap, Star, ShieldCheck, TrendingUp } from 'lucide-react';

const SmmServiceRow = ({ product, user }) => {
  const navigate = useNavigate();

  const getFeatureIcon = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('fast') || lowerName.includes('cepat')) return <Zap size={15} className="text-blue-400" title="Pengiriman Cepat" />;
    if (lowerName.includes('best') || lowerName.includes('terlaris')) return <Star size={15} className="text-yellow-400" title="Best Seller" />;
    if (lowerName.includes('garansi') || lowerName.includes('refill')) return <ShieldCheck size={15} className="text-green-400" title="Garansi/Refill" />;
    if (lowerName.includes('high quality') || lowerName.includes('hq')) return <TrendingUp size={15} className="text-purple-400" title="Kualitas Tinggi" />;
    return null;
  };

  const price = user?.role === 'RESELLER' ? product.priceReseller : product.priceUser;

  return (
    <div className="smm-service-row glass-card-nested">
      <div className="smm-service-id">
        #{product.id}
      </div>
      <div className="smm-service-name">
        {product.name}
        <div className="smm-service-features">
            {getFeatureIcon(product.name)}
        </div>
      </div>
      <div className="smm-service-price">
        <span className="price-value">
          Rp {price.toLocaleString('id-ID')}
        </span>
        <span className="price-unit">/ 1k</span>
      </div>
      <div className="smm-service-minmax">
        <span>Min: {product.minOrder}</span>
        <span>Max: {product.maxOrder}</span>
      </div>
      <div className="smm-service-action">
        <button
          onClick={() => navigate(`/product/${product.slug}`)}
          className="btn btn-primary btn-sm"
        >
          <ShoppingCart size={14} />
          <span>Pesan</span>
        </button>
      </div>
    </div>
  );
};

export default SmmServiceRow;
