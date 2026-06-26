import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Key, TrendingUp, DollarSign, Zap, MoreVertical, Eye, EyeOff, Copy, Settings, Trash2 } from 'lucide-react';

/**
 * AIKeyCard - Card component untuk menampilkan API key milik user
 * Digunakan di /dashboard/ai-keys page
 */
export default function AIKeyCard({ apiKey, onDelete, onToggleActive, userBalance }) {
  const [showFullKey, setShowFullKey] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey.apiKey);
    alert('API Key copied to clipboard!');
  };

  const handleViewUsage = () => {
    navigate('/dashboard/ai-keys/usage', { state: { selectedKeyId: apiKey.id } });
  };

  // Tier badge color
  const getTierColor = (tier) => {
    const colors = {
      'BASIC': '#6b7280',
      'PRO': '#4facfe',
      'ENTERPRISE': '#a855f7',
    };
    return colors[tier] || '#4facfe';
  };

  // Format balance
  const formatBalance = (balance) => {
    return `Rp ${Math.ceil(balance).toLocaleString('id-ID')}`;
  };

  return (
    <div 
      className="glass-card"
      style={{
        padding: '24px',
        marginBottom: '16px',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Key size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '700', 
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              {apiKey.keyName}
            </h3>
            <div 
              className="badge"
              style={{ 
                background: getTierColor(apiKey.tier),
                color: 'white',
                fontSize: '11px',
                padding: '4px 10px',
                fontWeight: '600',
              }}
            >
              {apiKey.tier}
            </div>
            {!apiKey.isActive && (
              <div 
                className="badge"
                style={{ 
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '11px',
                  padding: '4px 10px',
                }}
              >
                INACTIVE
              </div>
            )}
          </div>

          {/* API Key Display */}
          <div style={{
            background: 'var(--bg-muted)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            fontFamily: 'monospace',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <code style={{ flex: 1, color: 'var(--text-primary)' }}>
              {showFullKey ? apiKey.apiKey : apiKey.apiKey}
            </code>
            <button
              onClick={() => setShowFullKey(!showFullKey)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-muted)',
              }}
              title={showFullKey ? 'Hide key' : 'Show key'}
            >
              {showFullKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={handleCopy}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-muted)',
              }}
              title="Copy to clipboard"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>

        {/* Menu Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 8px 24px var(--bg-muted)',
              minWidth: '180px',
              zIndex: 10,
            }}>
              <button
                onClick={() => {
                  onToggleActive(apiKey.id, !apiKey.isActive);
                  setShowMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                }}
              >
                <Settings size={16} />
                {apiKey.isActive ? 'Disable Key' : 'Enable Key'}
              </button>
              <button
                onClick={() => {
                  onDelete(apiKey.id);
                  setShowMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '14px',
                  color: '#ef4444',
                }}
              >
                <Trash2 size={16} />
                Delete Key
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '16px',
      }}>
        {/* Credits Balance */}
        <div style={{
          background: 'rgba(79, 172, 254, 0.05)',
          border: '1px solid rgba(79, 172, 254, 0.15)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <DollarSign size={14} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Credits
            </span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {formatBalance(userBalance || 0)}
          </div>
        </div>

        {/* Rate Limit */}
        <div style={{
          background: 'rgba(168, 85, 247, 0.05)',
          border: '1px solid rgba(168, 85, 247, 0.15)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Zap size={14} style={{ color: 'var(--color-secondary)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Rate Limit
            </span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {apiKey.rateLimit} rpm
          </div>
        </div>

        {/* Model */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <TrendingUp size={14} style={{ color: 'var(--accent-success)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Model
            </span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {apiKey.model ? apiKey.model.name : 'All Models'}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleViewUsage}
          className="btn btn-secondary"
          style={{ flex: 1, padding: '10px', fontSize: '14px' }}
        >
          View Usage
        </button>
        <Link
          to="/deposit"
          className="btn btn-primary"
          style={{ flex: 1, padding: '10px', fontSize: '14px', textAlign: 'center', textDecoration: 'none' }}
        >
          Top Up Saldo
        </Link>
      </div>
    </div>
  );
}
