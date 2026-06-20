import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Cpu, HardDrive, Globe, Zap, Monitor } from 'lucide-react';

const VpsRdpCard = ({ product, user }) => {
  const navigate = useNavigate();
  const price = user?.role === 'RESELLER' ? product.priceReseller : product.priceUser;
  const isRdp = product.name.toLowerCase().includes('rdp');
  const isVps = product.name.toLowerCase().includes('vps');

  // Parse spesifikasi dari nama produk (misal: "VPS 4 Core 8GB RAM 100GB SSD")
  const parseSpecs = (name) => {
    const specs = [];
    const lowerName = name.toLowerCase();

    // CPU Core
    const coreMatch = name.match(/(\d+)\s*(?:core|cores|vcpu|cpu)/i);
    if (coreMatch) specs.push({ icon: <Cpu size={13} />, label: `${coreMatch[1]} vCPU` });

    // RAM
    const ramMatch = name.match(/(\d+)\s*(?:gb|mb)\s*(?:ram|memory|mem)/i);
    if (ramMatch) specs.push({ icon: <Monitor size={13} />, label: `${ramMatch[1]}GB RAM` });

    // Storage
    const storageMatch = name.match(/(\d+)\s*(?:gb|tb)\s*(?:ssd|hdd|nvme|storage|disk)/i);
    if (storageMatch) specs.push({ icon: <HardDrive size={13} />, label: `${storageMatch[1]}GB SSD` });

    // Bandwidth / Speed
    const bwMatch = name.match(/(\d+)\s*(?:mbps|gbps|tb\s*bw|bandwidth)/i);
    if (bwMatch) specs.push({ icon: <Globe size={13} />, label: `${bwMatch[1]}Mbps` });

    // Durasi (1 Bulan, 3 Bulan, dst)
    const durasiMatch = name.match(/(\d+)\s*(?:bulan|month|bln)/i);
    if (durasiMatch) specs.push({ icon: <Zap size={13} />, label: `${durasiMatch[1]} Bulan` });

    return specs;
  };

  const specs = parseSpecs(product.name);
  const typeLabel = isRdp ? 'RDP' : isVps ? 'VPS' : 'Server';
  const typeColor = isRdp
    ? { bg: 'rgba(0, 242, 254, 0.12)', color: '#a5f3fc', border: 'rgba(0, 242, 254, 0.3)' }
    : { bg: 'rgba(127, 0, 255, 0.12)', color: '#d8b4fe', border: 'rgba(127, 0, 255, 0.3)' };

  return (
    <div className="vps-rdp-card glass-card">
      {/* Header */}
      <div className="vps-rdp-card-header">
        <span
          className="vps-rdp-type-badge"
          style={{ background: typeColor.bg, color: typeColor.color, border: `1px solid ${typeColor.border}` }}
        >
          {typeLabel}
        </span>
        <span className="vps-rdp-card-stock" style={{ color: 'var(--color-primary)' }}>
          ∞ Unlimited
        </span>
      </div>

      {/* Nama Produk */}
      <h4 className="vps-rdp-card-title">{product.name}</h4>

      {/* Specs Grid */}
      {specs.length > 0 && (
        <div className="vps-rdp-specs-grid">
          {specs.map((spec, i) => (
            <div key={i} className="vps-rdp-spec-item">
              <span className="vps-rdp-spec-icon">{spec.icon}</span>
              <span className="vps-rdp-spec-label">{spec.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Deskripsi singkat */}
      {product.description && (
        <p className="vps-rdp-card-description">
          {product.description.substring(0, 90)}...
        </p>
      )}

      {/* Footer: Harga & Tombol */}
      <div className="vps-rdp-card-footer">
        <div className="vps-rdp-card-price-group">
          <span className="vps-rdp-price-label">Mulai Dari</span>
          <span className="vps-rdp-price-value">
            Rp {price.toLocaleString('id-ID')}
          </span>
        </div>
        <button
          onClick={() => navigate(`/product/${product.slug}`)}
          className="btn btn-primary"
        >
          <ShoppingCart size={15} />
          Pesan
        </button>
      </div>
    </div>
  );
};

export default VpsRdpCard;
