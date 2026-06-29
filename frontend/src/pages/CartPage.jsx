import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, RefreshCw, Package } from 'lucide-react';

export default function CartPage({ user, token }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cart`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCart(data.cart);
      window.dispatchEvent(new Event('cart-update'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateQty = async (itemId, newQty) => {
    if (newQty < 1) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cart/item/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ quantity: newQty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCart(data.cart);
    } catch (err) {
      console.error(err);
    }
  };

  const removeItem = async (itemId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cart/item/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCart(data.cart);
      window.dispatchEvent(new Event('cart-update'));
    } catch (err) {
      console.error(err);
    }
  };

  const clearCart = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cart`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setCart(null);
        window.dispatchEvent(new Event('cart-update'));
      }
    } catch {}
  };

  const subtotal = cart?.items?.reduce((sum, item) => sum + (item.product.priceUser * item.quantity), 0) || 0;

  if (loading) return (
    <div className="container animate-fade-in" style={{ padding: '60px 20px', textAlign: 'center' }}>
      <RefreshCw size={32} className="spin" style={{ color: 'var(--text-muted)' }} />
    </div>
  );

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 20px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ padding: '8px' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-display)' }}>Keranjang Belanja</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {cart?.items?.length || 0} item{cart?.items?.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {error && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--accent-danger)', marginBottom: '16px' }}>{error}</p>
          <button onClick={fetchCart} className="btn btn-primary">Coba Lagi</button>
        </div>
      )}

      {!error && (!cart?.items?.length) ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '80px 20px' }}>
          <ShoppingCart size={64} style={{ color: 'var(--text-muted)', marginBottom: '20px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Keranjang Kosong</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Belum ada barang fisik di keranjang Anda.</p>
          <Link to="/catalog/fisik" className="btn btn-primary" style={{ padding: '12px 24px' }}>
            <Package size={16} /> Lihat Barang Fisik
          </Link>
        </div>
      ) : !error && (
        <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
          {cart.items.map(item => (
            <div key={item.id} className="glass-card" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              {/* Image */}
              <div style={{
                width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0,
                background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.product.imageUrl ? (
                  <img src={item.product.imageUrl} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Package size={28} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>
                  {item.product.name}
                </h4>
                {item.selectedVariant && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {Object.entries(item.selectedVariant).map(([k, v]) => `${k}: ${v}`).join(', ')}
                  </div>
                )}
                <div style={{ fontWeight: '700', color: 'var(--accent-primary)', fontSize: '15px' }}>
                  Rp {(item.product.priceUser * item.quantity).toLocaleString('id-ID')}
                </div>
              </div>

              {/* Quantity controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => updateQty(item.id, item.quantity - 1)}
                  className="btn btn-secondary" style={{ padding: '6px', borderRadius: '8px', lineHeight: 1 }}
                  disabled={item.quantity <= 1}>
                  <Minus size={14} />
                </button>
                <span style={{ fontWeight: '700', fontSize: '16px', minWidth: '30px', textAlign: 'center' }}>
                  {item.quantity}
                </span>
                <button onClick={() => updateQty(item.id, item.quantity + 1)}
                  className="btn btn-secondary" style={{ padding: '6px', borderRadius: '8px', lineHeight: 1 }}>
                  <Plus size={14} />
                </button>
              </div>

              {/* Remove */}
              <button onClick={() => removeItem(item.id)}
                className="btn btn-secondary" style={{ padding: '8px', color: 'var(--accent-danger)', borderRadius: '8px' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {!error && cart?.items?.length > 0 && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
            <span style={{ fontWeight: '700' }}>Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            *Ongkos kirim dihitung saat checkout
          </div>
          <button onClick={() => navigate('/checkout')} className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: '800', borderRadius: '14px' }}>
            Lanjut ke Checkout
          </button>
        </div>
      )}
    </div>
  );
}
