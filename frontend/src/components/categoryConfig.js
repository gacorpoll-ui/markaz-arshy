/**
 * Category configuration for Marketplace
 * Single source of truth for both JakmallMarketplace and MarketplaceCategory
 */

export const CATEGORIES = [
  {
    slug: 'handphone-tablet',
    name: 'Handphone & Tablet',
    icon: '📱',
    image: '/images/promo/smartphone-android.png',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#667eea',
    description: 'Smartphone, tablet, dan aksesoris original',
  },
  {
    slug: 'komputer-laptop',
    name: 'Komputer & Laptop',
    icon: '💻',
    image: '/images/promo/aksesoris-komputer.png',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: '#f093fb',
    description: 'Laptop, desktop, dan peripheral komputer',
  },
  {
    slug: 'elektronik',
    name: 'Elektronik',
    icon: '🔌',
    image: '/images/promo/lampu-rumah.png',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: '#4facfe',
    description: 'TV, audio, kamera, dan elektronik rumah',
  },
  {
    slug: 'fashion-perhiasan',
    name: 'Fashion & Perhiasan',
    icon: '💍',
    image: '/images/promo/perkakas.png',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    color: '#fa709a',
    description: 'Pakaian, sepatu, aksesoris, dan perhiasan',
  },
  {
    slug: 'ibu-bayi-anak',
    name: 'Ibu, Bayi & Anak',
    icon: '👶',
    image: '/images/promo/botol-minum.png',
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    color: '#a18cd1',
    description: 'Kebutuhan ibu hamil, bayi, dan anak',
  },
  {
    slug: 'mainan-video-games',
    name: 'Mainan & Video Games',
    icon: '🎮',
    image: '/images/promo/mainan.png',
    gradient: 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
    color: '#f59e0b',
    description: 'Mainan edukatif, action figure, dan gaming',
  },
  {
    slug: 'peralatan-rumah-tangga',
    name: 'Peralatan Rumah Tangga',
    icon: '🏠',
    image: '/images/promo/perlengkapan-dapur.png',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    color: '#43e97b',
    description: 'Dapur, kebersihan, dan dekorasi rumah',
  },
  {
    slug: 'kesehatan-kecantikan',
    name: 'Kesehatan & Kecantikan',
    icon: '💊',
    image: '/images/promo/alat-kesehatan.png',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    color: '#ff9a9e',
    description: 'Suplemen, skincare, dan alat kesehatan',
  },
  {
    slug: 'hobi-olahraga-outdoor',
    name: 'Hobi, Olahraga & Outdoor',
    icon: '⚽',
    image: '/images/promo/perlengkapan-olahraga.png',
    gradient: 'linear-gradient(135deg, #667eea 0%, #00f2fe 100%)',
    color: '#667eea',
    description: 'Olahraga, camping, fishing, dan hobi lainnya',
  },
  {
    slug: 'makanan-minuman',
    name: 'Makanan & Minuman',
    icon: '🍜',
    image: '/images/promo/perlengkapan-kopi.png',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    color: '#fcb69f',
    description: 'Makanan ringan, minuman, dan bahan masak',
  },
  {
    slug: 'aksesoris-lainnya',
    name: 'Aksesoris Lainnya',
    icon: '🎒',
    image: '/images/promo/perlengkapan-travel.png',
    gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    color: '#66a6ff',
    description: 'Tas, dompet, travel kit, dan aksesoris lainnya',
  },
  {
    slug: 'otomotif-kendaraan',
    name: 'Otomotif & Kendaraan',
    icon: '🚗',
    image: '/images/promo/otomotif.png',
    gradient: 'linear-gradient(135deg, #2d3436 0%, #636e72 100%)',
    color: '#636e72',
    description: 'Aksesoris mobil, motor, dan suku cadang kendaraan',
  },
];

/** Get category config by slug */
export function getCategoryBySlug(slug) {
  return CATEGORIES.find(c => c.slug === slug);
}

/** Get display name with fallback */
export function getCategoryName(slug) {
  return getCategoryBySlug(slug)?.name || slug;
}

/** DB slug mapping (some products use fisik- prefix) */
export function getDbSlug(urlSlug) {
  return urlSlug.startsWith('fisik-') ? urlSlug : `fisik-${urlSlug}`;
}
