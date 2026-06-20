import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink, Routes, Route } from 'react-router-dom';
import {
  Shield, RefreshCw, LayoutDashboard, Wallet, Settings,
  Tags, Package, PlusCircle, BarChart2, Users, Eye,
  ChevronRight, LogOut, Bell, User
} from 'lucide-react';

import AdminOverview        from '../components/AdminOverview';
import AdminDeposits        from '../components/AdminDeposits';
import AdminProducts        from '../components/AdminProducts';
import AdminProductStock    from '../components/AdminProductStock';
import AdminAllOrders       from '../components/AdminAllOrders';
import AdminManualBalance   from '../components/AdminManualBalance';
import AdminPaymentMethods  from '../components/AdminPaymentMethods';
import AdminCategories      from '../components/AdminCategories';
import AdminUsers           from '../components/AdminUsers';
import AdminReviews         from '../components/AdminReviews';
import AdminAIProviders     from '../components/AdminAIProviders';
import AdminCombos           from '../components/AdminCombos';
import AdminSkeleton        from '../components/AdminSkeleton';

const NAV_ITEMS = [
  { to: '/admin',                end: true,  icon: LayoutDashboard, label: 'Overview',      badge: null },
  { to: '/admin/deposits',       end: false, icon: Wallet,          label: 'Approval',       badgeKey: 'deposits' },
  { to: '/admin/orders',         end: false, icon: BarChart2,        label: 'Pesanan',        badge: null },
  { to: '/admin/products',       end: false, icon: Package,          label: 'Produk',         badge: null },
  { to: '/admin/categories',     end: false, icon: Tags,             label: 'Kategori',       badge: null },
  { to: '/admin/stock',          end: false, icon: PlusCircle,       label: 'Stok Premium',   badge: null },
  { to: '/admin/balance',        end: false, icon: Wallet,           label: 'Saldo Manual',   badge: null },
  { to: '/admin/payment-methods',end: false, icon: Settings,         label: 'Pembayaran',     badge: null },
  { to: '/admin/users',          end: false, icon: Users,            label: 'Pengguna',       badge: null },
  { to: '/admin/reviews',        end: false, icon: Eye,              label: 'Ulasan',         badgeKey: 'reviews' },
  { to: '/admin/ai-providers',   end: false, icon: Shield,           label: 'AI Providers',   badge: null },
  { to: '/admin/ai-combos',      end: false, icon: Shield,           label: 'AI Combos',      badge: null },
];

export default function AdminDashboard({ user, token }) {
  const [stats, setStats]                   = useState(null);
  const [pendingDeposits, setPendingDeposits]= useState([]);
  const [pendingReviews, setPendingReviews]  = useState(0);
  const [allOrders, setAllOrders]            = useState([]);
  const [products, setProducts]              = useState([]);
  const [categories, setCategories]          = useState([]);
  const [paymentMethods, setPaymentMethods]  = useState([]);
  const [loading, setLoading]                = useState(true);
  const [syncing, setSyncing]                = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { navigate('/'); return; }
    fetchAdminData();
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setSyncing(true);
      const H = { 'Authorization': `Bearer ${token}` };

      const [statsR, pendR, ordR, catR, prodR, pmR] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/stats`,            { headers: H }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/deposits/pending`, { headers: H }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/orders`,           { headers: H }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/catalog/categories`),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/catalog/products`),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/deposits/payment-methods`, { headers: H }),
      ]);

      const [sD, pD, oD, cD, prD, pmD] = await Promise.all([
        statsR.json(), pendR.json(), ordR.json(),
        catR.json(),  prodR.json(), pmR.json(),
      ]);

      const revR = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/admin`, { headers: H });
      const revD = await revR.json();

      setStats(sD.stats);
      setPendingDeposits(pD.deposits || []);
      setPendingReviews((revD.reviews || []).filter(r => !r.isApproved).length);
      setAllOrders(oD.orders || []);
      setCategories(cD.categories || []);
      setProducts(prD.products || []);
      setPaymentMethods(pmD.paymentMethods || []);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  /* ── Handler helpers ── */
  const api = async (url, opts = {}) => {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, ...opts.headers }, ...opts });
    return res;
  };

  const handleConfirmDeposit      = async (id) => { const r = await api(`${import.meta.env.VITE_API_BASE_URL}/api/admin/deposits/${id}/confirm`, { method: 'POST' }); if (r.ok) fetchAdminData(); };
  const handleRejectDeposit       = async (id) => { const r = await api(`${import.meta.env.VITE_API_BASE_URL}/api/admin/deposits/${id}/reject`,  { method: 'POST' }); if (r.ok) fetchAdminData(); };

  const handleAddProduct = async (data) => {
    const r = await api(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (r.ok) { fetchAdminData(); return true; } return false;
  };

  const handleUploadStock = async (productId, accounts) => {
    const r = await api(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products/${productId}/accounts/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accounts }) });
    if (r.ok) { fetchAdminData(); return true; } return false;
  };

  const handleManualBalance = async (userId, amount, action) => {
    const r = await api(`${import.meta.env.VITE_API_BASE_URL}/api/admin/users/${userId}/balance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: parseFloat(amount), action }) });
    if (r.ok) { fetchAdminData(); return true; } return false;
  };

  const handleAddPaymentMethod = async (formData) => {
    const r = await api(`${import.meta.env.VITE_API_BASE_URL}/api/admin/payment-methods`, { method: 'POST', body: formData });
    if (r.ok) { fetchAdminData(); return true; } return false;
  };

  const handleTogglePaymentMethod = async (id) => {
    await api(`${import.meta.env.VITE_API_BASE_URL}/api/admin/payment-methods/${id}/toggle`, { method: 'PATCH' });
    fetchAdminData();
  };

  const handleAddCategory = async (name, slug, type) => {
    const r = await api(`${import.meta.env.VITE_API_BASE_URL}/api/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, slug, type }) });
    if (r.ok) { fetchAdminData(); return true; } return false;
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Yakin ingin menghapus kategori ini?')) return;
    const r = await api(`${import.meta.env.VITE_API_BASE_URL}/api/admin/categories/${id}`, { method: 'DELETE' });
    if (r.ok) fetchAdminData();
  };

  if (!user || user.role !== 'ADMIN') return null;

  const badgeCounts = { deposits: pendingDeposits.length, reviews: pendingReviews };

  return (
    <div className="adm-layout animate-fade-in">

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className="adm-sidebar">
        {/* Logo / Identity */}
        <div className="adm-sidebar-logo">
          <div className="adm-logo-icon">
            <Shield size={20} />
          </div>
          <div>
            <div className="adm-logo-title">Admin Panel</div>
            <div className="adm-logo-sub">Markaz-Arshy</div>
          </div>
        </div>

        {/* Admin user chip */}
        <div className="adm-user-chip">
          <div className="adm-user-avatar">
            {user.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="adm-user-info">
            <span className="adm-user-name">{user.name || 'Admin'}</span>
            <span className="adm-user-role">Administrator</span>
          </div>
        </div>

        {/* Section label */}
        <div className="adm-nav-section-label">Menu Utama</div>

        {/* Nav items */}
        <nav className="adm-nav">
          {NAV_ITEMS.map(({ to, end, icon: Icon, label, badge, badgeKey }) => {
            const count = badgeKey ? badgeCounts[badgeKey] : badge;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={17} className="adm-nav-icon" />
                <span className="adm-nav-label">{label}</span>
                {count > 0 && <span className="adm-nav-badge">{count}</span>}
                <ChevronRight size={14} className="adm-nav-arrow" />
              </NavLink>
            );
          })}
        </nav>

        {/* Sync button at bottom */}
        <div className="adm-sidebar-footer">
          <button
            onClick={fetchAdminData}
            className={`adm-sync-btn ${syncing ? 'syncing' : ''}`}
            disabled={syncing}
          >
            <RefreshCw size={14} className={syncing ? 'spin' : ''} />
            {syncing ? 'Menyinkron...' : 'Sinkron Data'}
          </button>
        </div>
      </aside>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <main className="adm-main">
        {/* Top bar */}
        <div className="adm-topbar">
          <div className="adm-topbar-breadcrumb">
            <Shield size={14} style={{ color: 'var(--color-primary)' }} />
            <span>Admin</span>
            <ChevronRight size={12} />
            <span className="adm-topbar-current">Dashboard</span>
          </div>
          <div className="adm-topbar-right">
            {pendingDeposits.length > 0 && (
              <div className="adm-topbar-alert">
                <Bell size={14} />
                <span>{pendingDeposits.length} approval menunggu</span>
              </div>
            )}
            <div className="adm-topbar-user">
              <User size={14} />
              <span>{user.name}</span>
            </div>
          </div>
        </div>

        {/* Route content */}
        <div className="adm-content-area">
          <Routes>
            <Route path="/"                element={loading ? <AdminSkeleton /> : <AdminOverview stats={stats} loading={loading} />} />
            <Route path="/deposits"        element={<AdminDeposits pendingDeposits={pendingDeposits} handleConfirmDeposit={handleConfirmDeposit} handleRejectDeposit={handleRejectDeposit} loading={loading} />} />
            <Route path="/products"        element={<AdminProducts products={products} categories={categories} handleAddProduct={handleAddProduct} loading={loading} />} />
            <Route path="/categories"      element={<AdminCategories categories={categories} handleAddCategory={handleAddCategory} handleDeleteCategory={handleDeleteCategory} loading={loading} />} />
            <Route path="/stock"           element={<AdminProductStock products={products} handleUploadStock={handleUploadStock} loading={loading} />} />
            <Route path="/orders"          element={<AdminAllOrders allOrders={allOrders} loading={loading} />} />
            <Route path="/balance"         element={<AdminManualBalance handleManualBalance={handleManualBalance} loading={loading} />} />
            <Route path="/payment-methods" element={<AdminPaymentMethods paymentMethods={paymentMethods} handleAddPaymentMethod={handleAddPaymentMethod} handleTogglePaymentMethod={handleTogglePaymentMethod} loading={loading} />} />
            <Route path="/users"           element={<AdminUsers token={token} />} />
            <Route path="/reviews"         element={<AdminReviews token={token} />} />
            <Route path="/ai-providers"    element={<AdminAIProviders token={token} />} />
            <Route path="/ai-combos"       element={<AdminCombos token={token} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
