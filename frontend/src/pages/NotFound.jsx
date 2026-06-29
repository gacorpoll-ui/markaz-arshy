import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Home, Search } from 'lucide-react';

/**
 * NotFound — beautiful 404 page that replaces the generic redirect.
 */
export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <div className="not-found-icon-wrap">
          <Search size={32} style={{ color: '#3B82F6' }} />
        </div>

        <h1 className="not-found-title">404</h1>
        <p className="not-found-subtitle">Halaman Tidak Ditemukan</p>
        <p className="not-found-desc">
          Maaf, halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
        </p>

        <div className="not-found-actions">
          <Link to="/" className="not-found-btn not-found-btn-primary">
            <Home size={16} />
            Kembali ke Beranda
          </Link>
          <Link to="/catalog/smm" className="not-found-btn not-found-btn-secondary">
            <ShoppingBag size={16} />
            Lihat Katalog
          </Link>
        </div>
      </div>
    </div>
  );
}
