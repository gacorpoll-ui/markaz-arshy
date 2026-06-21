import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, NavLink, useLocation } from 'react-router-dom';
import { ShoppingBag, ShieldAlert, LogIn, LogOut, User, Menu, X } from 'lucide-react';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import DepositPage from './pages/DepositPage';
import VerifyEmail from './pages/VerifyEmail';
import GoogleCallback from './pages/GoogleCallback';
import AIRouterCatalog from './pages/AIRouterCatalog';
import AIKeys from './pages/AIKeys';
import AIUsageAnalyticsPage from './pages/AIUsageAnalyticsPage';
import AIDocs from './pages/AIDocs';
import LiveChat from './components/LiveChat';

/* ═══════════════════════════════════════
   Mobile Menu Overlay — closes on navigate
   ═══════════════════════════════════════ */
function MobileMenu({ isOpen, onClose, user, handleLogout }) {
  const location = useLocation();

  // Close menu on navigation
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  if (!isOpen) return null;

  const navItems = [
    { to: '/catalog/smm', label: 'Medsos Boost' },
    { to: '/catalog/premium', label: 'Akun Premium' },
    { to: '/catalog/vps-rdp', label: 'RDP/VPS' },
    { to: '/catalog/ai-router', label: 'AI Router' },
    { to: '/docs/ai', label: 'Panduan AI' },
  ];

  if (user) {
    navItems.push({ to: '/dashboard', label: 'Dashboard' });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 998,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: '280px', maxWidth: '85vw',
        background: 'var(--bg-main)',
        borderRight: '1px solid var(--border-color)',
        zIndex: 999,
        display: 'flex', flexDirection: 'column',
        transform: 'translateX(0)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Drawer Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <ShoppingBag size={22} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
              Markaz-Arshy
            </span>
          </Link>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
              borderRadius: '8px', padding: '6px', cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav Links */}
        <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 20px', textDecoration: 'none',
                color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(0, 242, 254, 0.06)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                fontSize: '14px', fontWeight: isActive ? '600' : '500',
                transition: 'all 0.15s ease',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Drawer Footer — Auth */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-color)',
        }}>
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className={`badge ${user.role === 'ADMIN' ? 'badge-premium' : user.role === 'RESELLER' ? 'badge-smm' : 'badge-secondary'}`} style={{ fontSize: '10px', padding: '3px 8px' }}>
                  {user.role}
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  Rp {user.balance.toLocaleString('id-ID')}
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '10px', borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#ef4444', fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer', width: '100%',
                }}
              >
                <LogOut size={14} /> Keluar
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link
                to="/login"
                onClick={onClose}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '10px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600',
                  textDecoration: 'none',
                }}
              >
                <LogIn size={14} /> Masuk
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '10px', borderRadius: '8px',
                  background: 'var(--color-primary)',
                  color: '#070913', fontSize: '13px', fontWeight: '700',
                  textDecoration: 'none',
                }}
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

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
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070913', color: 'var(--text-secondary)' }}>Loading...</div>;
  }

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Mobile Menu Overlay */}
        <MobileMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          user={user}
          handleLogout={handleLogout}
        />

        <nav className="navbar">
          <Link to="/" className="nav-logo">
            <ShoppingBag size={24} style={{ color: 'var(--color-primary)' }} />
            Markaz-Arshy
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <ul className="nav-links">
              <li><NavLink to="/catalog/smm" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Medsos Boost</NavLink></li>
              <li><NavLink to="/catalog/premium" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Akun Premium</NavLink></li>
              <li><NavLink to="/catalog/vps-rdp" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>RDP/VPS</NavLink></li>
              <li><NavLink to="/catalog/ai-router" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>AI Router</NavLink></li>
              <li><NavLink to="/docs/ai" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Panduan AI</NavLink></li>
              {user && <li><NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink></li>}
            </ul>

            <div className="nav-auth" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
               {user ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={`badge ${user.role === 'ADMIN' ? 'badge-premium' : user.role === 'RESELLER' ? 'badge-smm' : 'badge-secondary'}`} style={{ fontSize: '10px', padding: '3px 8px' }}>
                      {user.role}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', padding: '6px 14px', borderRadius: '9999px', fontSize: '14px' }}>
                      <User size={14} style={{ color: 'var(--color-primary)' }} />
                      <span style={{ fontWeight: '600' }}>Rp {user.balance.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px' }}><LogOut size={14} /> Keluar</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 16px' }}><LogIn size={14} /> Masuk</Link>
                  <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px' }}>Daftar</Link>
                </>
              )}
            </div>
          </div>

          {/* Hamburger Button — visible on mobile via CSS */}
          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(true)}
            style={{
              display: 'none', background: 'none', border: 'none',
              color: 'var(--text-primary)', cursor: 'pointer',
              padding: '8px',
            }}
          >
            <Menu size={24} />
          </button>
        </nav>

        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/catalog/:categoryType" element={<CatalogPage user={user} token={token} />} />
            <Route path="/product/:slug" element={<ProductDetailPage user={user} token={token} />} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register onLogin={handleLogin} />} />
            <Route path="/verify-email" element={<VerifyEmail onLogin={handleLogin} />} />
            <Route path="/auth/google/callback" element={<GoogleCallback onLogin={handleLogin} />} />
            <Route path="/catalog/ai-router" element={<AIRouterCatalog user={user} token={token} />} />
            <Route path="/docs/ai" element={<AIDocs />} />
            <Route path="/ai-docs" element={<AIDocs />} />
            <Route path="/dashboard/ai-keys" element={user ? <AIKeys user={user} token={token} /> : <Navigate to="/login" />} />
            <Route path="/dashboard/ai-keys/usage" element={user ? <AIUsageAnalyticsPage user={user} token={token} /> : <Navigate to="/login" />} />
            <Route path="/dashboard/ai-keys/:id/usage" element={user ? <AIUsageAnalyticsPage user={user} token={token} /> : <Navigate to="/login" />} />

            {/* Dashboard User with Nested Routes — harus sudah terverifikasi */}
             <Route path="/dashboard/*" element={
              user
                ? (user.isVerified !== false
                    ? <Dashboard user={user} token={token} onUpdateUser={handleUpdateUser} />
                    : <Navigate to={`/verify-email?email=${encodeURIComponent(user.email)}`} />)
                : <Navigate to="/login" />
            } />
            <Route path="/deposit" element={user ? <DepositPage user={user} token={token} onUpdateUser={handleUpdateUser} /> : <Navigate to="/login" />} />

            {/* Admin Dashboard with Nested Routes */}
            <Route path="/admin/*" element={user && user.role === 'ADMIN' ? <AdminDashboard user={user} token={token} /> : <Navigate to="/" />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <LiveChat />
      </div>
    </Router>
  );
}
