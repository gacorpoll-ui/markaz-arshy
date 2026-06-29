import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, NavLink, useLocation } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, ShieldAlert, LogIn, LogOut, User, Menu, X } from 'lucide-react';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductFisikPage from './pages/ProductFisikPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import DepositPage from './pages/DepositPage';
import VerifyEmail from './pages/VerifyEmail';
import GoogleCallback from './pages/GoogleCallback';
import AIRouterCatalog from './pages/AIRouterCatalog';
import AIKeys from './pages/AIKeys';
import AddressPage from './pages/AddressPage';
import AIUsageAnalyticsPage from './pages/AIUsageAnalyticsPage';
import AIDocs from './pages/AIDocs';
import LiveChat from './components/LiveChat';
import MarketplacePage from './pages/MarketplacePage';
import JakmallMarketplace from './pages/JakmallMarketplace';
import MarketplaceCategory from './pages/MarketplaceCategory';

/* ═══════════════════════════════════════
   Mobile Menu Overlay
   ═══════════════════════════════════════ */
function MobileMenu({ isOpen, onClose, user, handleLogout }) {
  const location = useLocation();

  useEffect(() => { onClose(); }, [location.pathname]);

  if (!isOpen) return null;

  const navItems = [
    { to: '/catalog/smm', label: 'Medsos Boost' },
    { to: '/catalog/premium', label: 'Akun Premium' },
    { to: '/catalog/vps-rdp', label: 'RDP/VPS' },
    { to: '/catalog/ai-router', label: 'AI Router' },
    { to: '/marketplace', label: 'Mall' },
  ];

  if (user) navItems.push({ to: '/dashboard', label: 'Dashboard' });

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.3)' }} />
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px', maxWidth: '85vw',
        background: '#FFFFFF', borderRight: '1px solid #E5E7EB',
        zIndex: 999, display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <ShoppingBag size={20} style={{ color: '#3B82F6' }} />
            <span style={{ fontSize: '17px', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#111827' }}>Markaz-Arshy</span>
          </Link>
          <button onClick={onClose} style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#6B7280', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', textDecoration: 'none',
              color: isActive ? '#3B82F6' : '#6B7280', background: isActive ? '#EFF6FF' : 'transparent',
              borderLeft: isActive ? '3px solid #3B82F6' : '3px solid transparent',
              fontSize: '14px', fontWeight: isActive ? '600' : '500',
            })}>{item.label}</NavLink>
          ))}
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #E5E7EB' }}>
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge ${user.role === 'ADMIN' ? 'badge-premium' : user.role === 'RESELLER' ? 'badge-smm' : 'badge-secondary'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>{user.role}</span>
                <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Rp {user.balance.toLocaleString('id-ID')}</span>
              </div>
              <button onClick={handleLogout} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '9px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.15)',
                color: '#DC2626', fontSize: '13px', fontWeight: '600', cursor: 'pointer', width: '100%',
              }}><LogOut size={14} /> Keluar</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login" onClick={onClose} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', borderRadius: '8px', background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#6B7280', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}><LogIn size={14} /> Masuk</Link>
              <Link to="/register" onClick={onClose} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '9px', borderRadius: '8px', background: '#3B82F6', color: '#FFFFFF', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>Daftar</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════
   Main App
   ═══════════════════════════════════════ */
export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  const fetchCartCount = async () => {
    if (!token) { setCartCount(0); return; }
    try {
      const r = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await r.json();
      setCartCount(d.cart?.items?.length || 0);
    } catch {}
  };

  // Fetch cart count when user changes
  useEffect(() => { fetchCartCount(); }, [token]);

  // Listen for cart-update events (from CartPage, CheckoutPage, etc.)
  useEffect(() => {
    const handler = () => fetchCartCount();
    window.addEventListener('cart-update', handler);
    return () => window.removeEventListener('cart-update', handler);
  }, [token]);

  const handleLogin = (newUser, newToken) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('token', newToken);
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken('');
    setMobileMenuOpen(false);
  };

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA', color: '#9CA3AF' }}>Loading...</div>;
  }

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} user={user} handleLogout={handleLogout} />

        {/* ── Navbar ── */}
        <nav className="navbar">
          <Link to="/" className="nav-logo">
            <ShoppingBag size={22} style={{ color: '#3B82F6' }} />
            Markaz-Arshy
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <ul className="nav-links">
              <li><NavLink to="/catalog/smm" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Medsos Boost</NavLink></li>
              <li><NavLink to="/catalog/premium" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Akun Premium</NavLink></li>
              <li><NavLink to="/catalog/vps-rdp" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>RDP/VPS</NavLink></li>
              <li><NavLink to="/catalog/ai-router" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>AI Router</NavLink></li>
              <li><NavLink to="/marketplace" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Mall</NavLink></li>
              {user && <li><NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink></li>}
            </ul>

            <div className="nav-auth" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {user && (
                <Link to="/cart" style={{ position: 'relative', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span style={{
                      position: 'absolute', top: '-8px', right: '-8px', background: 'var(--color-primary)',
                      color: '#fff', fontSize: '10px', fontWeight: '700', minWidth: '18px', height: '18px',
                      borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 4px',
                    }}>{cartCount}</span>
                  )}
                </Link>
              )}
              {user ? (
                <>
                  <span className={`badge ${user.role === 'ADMIN' ? 'badge-premium' : user.role === 'RESELLER' ? 'badge-smm' : 'badge-secondary'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>{user.role}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '6px 14px', borderRadius: '9999px', fontSize: '14px' }}>
                    <User size={14} style={{ color: '#3B82F6' }} />
                    <span style={{ fontWeight: '600' }}>Rp {user.balance.toLocaleString('id-ID')}</span>
                  </div>
                  <button onClick={handleLogout} className="btn btn-secondary btn-sm"><LogOut size={14} /> Keluar</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-secondary btn-sm"><LogIn size={14} /> Masuk</Link>
                  <Link to="/register" className="btn btn-primary btn-sm">Daftar</Link>
                </>
              )}
            </div>
          </div>

          <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)} style={{ display: 'none', background: 'none', border: 'none', color: '#111827', cursor: 'pointer', padding: '8px' }}>
            <Menu size={24} />
          </button>
        </nav>

        {/* ── Routes ── */}
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/catalog/:categoryType" element={<CatalogPage user={user} token={token} />} />
            <Route path="/catalog/fisik/:slug" element={<ProductFisikPage user={user} token={token} />} />
            <Route path="/catalog/fisik" element={<Navigate to="/marketplace" />} />
            <Route path="/product/:slug" element={<ProductDetailPage user={user} token={token} />} />
            <Route path="/cart" element={user ? <CartPage user={user} token={token} /> : <Navigate to="/login" />} />
            <Route path="/checkout" element={user ? <CheckoutPage user={user} token={token} /> : <Navigate to="/login" />} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register onLogin={handleLogin} />} />
            <Route path="/verify-email" element={<VerifyEmail onLogin={handleLogin} />} />
            <Route path="/auth/google/callback" element={<GoogleCallback onLogin={handleLogin} />} />
            <Route path="/catalog/ai-router" element={<AIRouterCatalog user={user} token={token} />} />
            <Route path="/docs/ai" element={<AIDocs />} />
            <Route path="/ai-docs" element={<AIDocs />} />
            <Route path="/dashboard/ai-keys" element={user ? <AIKeys user={user} token={token} onUpdateUser={handleUpdateUser} /> : <Navigate to="/login" />} />
            <Route path="/dashboard/ai-keys/usage" element={user ? <AIUsageAnalyticsPage user={user} token={token} /> : <Navigate to="/login" />} />
            <Route path="/dashboard/ai-keys/:id/usage" element={user ? <AIUsageAnalyticsPage user={user} token={token} /> : <Navigate to="/login" />} />
            <Route path="/dashboard/*" element={
              user
                ? (user.isVerified !== false
                    ? <Dashboard user={user} token={token} onUpdateUser={handleUpdateUser} />
                    : <Navigate to={`/verify-email?email=${encodeURIComponent(user.email)}`} />)
                : <Navigate to="/login" />
            } />
            <Route path="/deposit" element={user ? <DepositPage user={user} token={token} onUpdateUser={handleUpdateUser} /> : <Navigate to="/login" />} />
            <Route path="/account/addresses" element={user ? <AddressPage user={user} token={token} /> : <Navigate to="/login" />} />
            <Route path="/admin/*" element={user && user.role === 'ADMIN' ? <AdminDashboard user={user} token={token} /> : <Navigate to="/" />} />
            <Route path="/marketplace" element={<JakmallMarketplace />} />
            <Route path="/marketplace/:slug" element={<MarketplaceCategory />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <LiveChat />
      </div>
    </Router>
  );
}
