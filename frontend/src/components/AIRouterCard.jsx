import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Clock, Layers } from 'lucide-react';

/**
 * AIRouterCard - Card component untuk menampilkan AI model
 * Digunakan di /catalog/ai-router page
 */
export default function AIRouterCard({ model, provider }) {
  const navigate = useNavigate();

  const handleBuyClick = () => {
    // Navigate ke halaman create API key dengan model pre-selected
    navigate('/dashboard/ai-keys', { 
      state: { modelId: model.id, modelName: model.name } 
    });
  };

  // Harga disimpan di DB sebagai Rp per 1K tokens
  const formatPrice = (pricePer1K) => {
    return `Rp ${Math.ceil(pricePer1K).toLocaleString('id-ID')} / 1K`;
  };

  // Get provider color
  const getProviderColor = (slug) => {
    const colors = {
      'openai': '#10a37f',
      'anthropic': '#d97757',
      'google-ai': '#4285f4',
    };
    return colors[slug] || '#4facfe';
  };

  return (
    <div 
      className="glass-card"
      style={{
        padding: '24px',
        marginBottom: '16px',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        border: '1px solid var(--border-color)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--color-primary)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(79, 172, 254, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        {/* Model Name & Provider */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              {model.name}
            </h3>
            <div 
              className="badge"
              style={{ 
                background: getProviderColor(provider.slug),
                color: 'white',
                fontSize: '11px',
                padding: '4px 10px',
                fontWeight: '600',
              }}
            >
              {provider.name}
            </div>
          </div>
          <p style={{ 
            fontSize: '13px', 
            color: 'var(--text-secondary)', 
            margin: 0,
          }}>
            {model.modelId}
          </p>
        </div>

        {/* Pricing */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-primary)' }}>
            {formatPrice(model.inputPricePer1K)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            input token
          </div>
        </div>
      </div>

      {/* Model Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '12px',
        marginBottom: '20px',
      }}>
        {/* Context Window */}
        <div style={{
          background: 'rgba(79, 172, 254, 0.05)',
          border: '1px solid rgba(79, 172, 254, 0.15)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Layers size={14} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Context
            </span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {(model.contextWindow / 1000).toFixed(0)}K
          </div>
        </div>

        {/* Output Price */}
        <div style={{
          background: 'rgba(168, 85, 247, 0.05)',
          border: '1px solid rgba(168, 85, 247, 0.15)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Zap size={14} style={{ color: 'var(--color-secondary)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Output
            </span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            {formatPrice(model.outputPricePer1K)}
          </div>
        </div>

        {/* Speed Indicator */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Clock size={14} style={{ color: 'var(--color-success)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Speed
            </span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {model.name.includes('mini') || model.name.includes('flash') || model.name.includes('haiku') ? 'Fast' : 'Balanced'}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleBuyClick}
        className="btn btn-primary"
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '14px',
          fontWeight: '600',
        }}
      >
        Buat API Key →
      </button>
    </div>
  );
}
