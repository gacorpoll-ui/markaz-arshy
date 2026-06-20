import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShoppingCart, RefreshCw, ChevronDown, ChevronUp, Search } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import SmmServiceRow from '../components/SmmServiceRow';
import VpsRdpCard from '../components/VpsRdpCard';
import CatalogSkeleton from '../components/CatalogSkeleton';

export default function CatalogPage({ user, token }) {
  const { categoryType } = useParams(); // smm | premium | vps-rdp
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // State Filter
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [expandedMain, setExpandedMain] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchCatalog();
    // Reset filter setiap ganti menu utama
    setSelectedSubCategory('all');
    setExpandedMain(null);
    setSearchQuery('');
  }, [categoryType]);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      // 1. Tentukan filter type untuk API
      let typeParam = '';
      if (categoryType === 'smm') typeParam = 'SMM';
      if (categoryType === 'premium' || categoryType === 'vps-rdp') typeParam = 'PREMIUM';

      // 2. Ambil kategori & produk dari API
      const catRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/catalog/categories`);
      const prodRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/catalog/products?type=${typeParam}`);

      const catData = await catRes.json();
      const prodData = await prodRes.json();

      setCategories(catData.categories || []);
      setProducts(prodData.products || []);
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUnitName = (productName) => {
    const name = productName.toLowerCase();
    if (name.includes('like')) return '/ Likes';
    if (name.includes('view')) return '/ Views';
    if (name.includes('comment')) return '/ Comments';
    return '/ Followers';
  };

  // --- LOGIKA GROUPING SIDEBAR ---
  const premiumBrands = [
    'Canva', 'Google One', 'Zoom', 'Spotify', 'YouTube', 'Capcut',
    'Netflix', 'Apple Music', 'Disney+ Hotstar', 'Nord VPN', 'Scribd',
    'Duolingo', 'ChatGPT', 'Grok', 'Claude', 'Dropbox', 'Google Gemini', 'Viu'
  ];

  const getGroupForCategory = (cat) => {
    if (cat.slug === 'vps-rdp') return 'Server Infrastructure';
    if (cat.type === 'PREMIUM') {
       for (const brand of premiumBrands) {
           if (cat.name.toLowerCase().includes(brand.toLowerCase())) return brand;
       }
       return 'Akun Premium Lainnya';
    }
    const firstWord = cat.name.split(' ')[0];
    const smmPlatforms = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'Twitter', 'Website', 'Shopee', 'Tokopedia', 'Google', 'Threads'];
    if (smmPlatforms.includes(firstWord)) return firstWord;
    return 'Layanan Lainnya';
  };

  const sidebarCategories = categories.filter(c => {
      if (categoryType === 'smm') return c.type === 'SMM';
      if (categoryType === 'vps-rdp') return c.slug === 'vps-rdp';
      if (categoryType === 'premium') {
          // Hanya izinkan kategori PREMIUM yang BUKAN vps-rdp dan BUKAN hidden-trash
          return c.type === 'PREMIUM' && c.slug !== 'vps-rdp' && c.slug !== 'hidden-trash' && !c.name.toLowerCase().includes('vps') && !c.name.toLowerCase().includes('rdp');
      }
      return false;
  });

  // Modifikasi Grouping khusus untuk VPS/RDP agar pecah jadi RDP dan VPS
  const groupedSidebar = sidebarCategories.reduce((acc, cat) => {
      if (categoryType === 'vps-rdp') {
          // Kita buat grup virtual berdasarkan jenis produk yang ada di dalamnya
          acc['Remote Desktop (RDP)'] = [{ ...cat, name: 'Semua Paket RDP', filterType: 'RDP' }];
          acc['Virtual Private Server (VPS)'] = [{ ...cat, name: 'Semua Paket VPS', filterType: 'VPS' }];
      } else {
          const groupName = getGroupForCategory(cat);
          if (!acc[groupName]) acc[groupName] = [];
          acc[groupName].push(cat);
      }
      return acc;
  }, {});

  // --- LOGIKA FILTERING PRODUK AKHIR ---
  const finalFilteredProducts = products.filter(p => {
      // Selalu sembunyikan produk yang berawalan 'HIDDEN_' atau berada di Hidden Trash
      if (p.name.startsWith('HIDDEN_') || p.category.slug === 'hidden-trash') return false;

      // 1. Filter Subkategori / Virtual Filter (RDP/VPS)
      if (selectedSubCategory !== 'all') {
          if (typeof selectedSubCategory === 'object' && selectedSubCategory.filterType) {
              if (!p.name.toLowerCase().includes(selectedSubCategory.filterType.toLowerCase())) return false;
          } else if (p.categoryId !== selectedSubCategory) {
              return false;
          }
      }

      // 2. Filter Search
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // 3. Filter Spesifik Menu (Isolasi Ketat)
      if (categoryType === 'vps-rdp') {
          return p.category.slug === 'vps-rdp';
      }
      if (categoryType === 'premium') {
          // Tolak produk jika kategorinya vps-rdp ATAU namanya mengandung unsur server
          if (p.category.slug === 'vps-rdp') return false;
          const nameLower = p.name.toLowerCase();
          if (nameLower.includes('rdp') || nameLower.includes('vps')) return false;
          return true;
      }

      return true;
  });

  return (
    <div className="container animate-fade-in catalog-layout">

      {/* SIDEBAR */}
      <div className="catalog-sidebar">
        <div className="glass-card">
            <h3 className="catalog-sidebar-header">
                Kategori {categoryType?.toUpperCase()}
            </h3>

            <button
                onClick={() => { setSelectedSubCategory('all'); setExpandedMain(null); }}
                className={`catalog-sidebar-all-services-btn ${selectedSubCategory === 'all' ? 'active' : ''}`}
            >
                🔥 Semua Layanan
            </button>

            {Object.entries(groupedSidebar).map(([groupName, subCats]) => (
                <div key={groupName} className="catalog-sidebar-group">
                    <button
                        onClick={() => setExpandedMain(expandedMain === groupName ? null : groupName)}
                        className={`catalog-sidebar-group-btn ${expandedMain === groupName ? 'active' : ''}`}
                    >
                        <span>{groupName}</span>
                        {expandedMain === groupName ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </button>

                    {expandedMain === groupName && (
                        <div className="catalog-sidebar-sub-menu">
                            {subCats.map(sc => (
                                <button
                                    key={sc.id + (sc.filterType || '')}
                                    onClick={() => setSelectedSubCategory(sc.filterType ? sc : sc.id)}
                                    className={`catalog-sidebar-sub-item-btn ${(selectedSubCategory === sc.id || selectedSubCategory?.filterType === sc.filterType) ? 'active' : ''}`}
                                >
                                    {sc.name.replace(groupName, '').trim() || 'Utama'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="catalog-main-content">
          <div className="catalog-header">
            <div className="catalog-title-group">
                <h2 className="catalog-page-title">
                    {categoryType === 'smm' ? 'Medsos Boost' : categoryType === 'vps-rdp' ? 'VPS & RDP Server' : 'Akun Premium'}
                </h2>
                <p>Menampilkan {finalFilteredProducts.length} layanan aktif.</p>
            </div>

            {/* Search Bar */}
            <div className="catalog-search-bar">
                <Search size={18} className="lucide" />
                <input
                    type="text"
                    className="form-input catalog-search-input"
                    placeholder="Cari layanan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>

          {loading ? (
             <CatalogSkeleton />
          ) : finalFilteredProducts.length === 0 ? (
             <div className="glass-card catalog-empty-state" style={{ textAlign: 'center', padding: '50px' }}>
                 Tidak ada produk yang ditemukan.
             </div>
          ) : (
            categoryType === 'smm' ? (
              <div className="smm-service-grid">
                  <div className="smm-service-grid-header">
                      <span>#ID</span>
                      <span>Layanan</span>
                      <span>Harga</span>
                      <span>Min/Max</span>
                      <span>Aksi</span>
                  </div>
                  {finalFilteredProducts.map(product => (
                      <SmmServiceRow key={product.id} product={product} user={user} />
                  ))}
              </div>
            ) : categoryType === 'vps-rdp' ? (
              <div className="vps-rdp-grid">
                  {finalFilteredProducts.map(product => (
                      <VpsRdpCard key={product.id} product={product} user={user} />
                  ))}
              </div>
            ) : (
              <div className="catalog-product-grid">
                  {finalFilteredProducts.map(product => (
                      <ProductCard key={product.id} product={product} user={user} getUnitName={getUnitName} />
                  ))}
              </div>
            )
          )}
      </div>
    </div>
  );
}
