import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, NavLink } from 'react-router-dom';
import { ShoppingBag, ShieldAlert, LogIn, LogOut, User } from 'lucide-react';

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

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

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
  };

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070913', color: 'var(--text-secondary)' }}>Loading...</div>;
  }

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <nav className="navbar">
          <Link to="/" className="nav-logo">
            <ShoppingBag size={24} style={{ color: 'var(--color-primary)' }} />
            Markaz-Arshy
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <ul className="nav-links">
              <li><NavLink to="/catalog/smm" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Medsos Boost</NavLink></li>
              <li><NavLink to="/catalog/premium" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Akun Premium</NavLink></li>
              <li><NavLink to="/catalog/vps-rdp" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>RDP/VPS</NavLink></li>
              <li><NavLink to="/catalog/ai-router" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>AI Router</NavLink></li>
              <li><NavLink to="/docs/ai" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Panduan AI</NavLink></li>
              {user && <li><NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink></li>}
            </ul>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
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
