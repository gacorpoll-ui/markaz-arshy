/**
 * Shared Jakmall sub-category -> parent category mapping.
 * Used by: admin-physical.js (import API), import_jakmall_xlsx.mjs (CLI import)
 *
 * Jakmall has 100+ leaf sub-categories. This maps each one to one of 11 parent categories.
 * Sub-categories not in CATEGORY_MAP fall through to KEYWORD_FALLBACK regex matching,
 * then finally to 'aksesoris-lainnya' as ultimate fallback.
 */

// Parent category display names
export const CATEGORY_NAMES = {
  'handphone-tablet': 'Handphone & Tablet',
  'komputer-laptop': 'Komputer & Laptop',
  'elektronik': 'Elektronik',
  'fashion-perhiasan': 'Fashion & Perhiasan',
  'ibu-bayi-anak': 'Ibu, Bayi & Anak',
  'kesehatan-kecantikan': 'Kesehatan & Kecantikan',
  'mainan-video-games': 'Mainan & Video Games',
  'peralatan-rumah-tangga': 'Peralatan Rumah Tangga',
  'hobi-olahraga-outdoor': 'Hobi, Olahraga & Outdoor',
  'makanan-minuman': 'Makanan & Minuman',
  'aksesoris-lainnya': 'Aksesoris Lainnya',
};

// Explicit sub-category -> parent mapping (Jakmall "Kategori" column, exact match)
export const CATEGORY_MAP = {
  // ── Handphone & Tablet ──
  'Kabel OTG': 'handphone-tablet',
  'Kabel Charger': 'handphone-tablet',
  'Kabel USB': 'handphone-tablet',
  'Kabel Data & Charger': 'handphone-tablet',
  'Pernak Pernik Handphone': 'handphone-tablet',
  'Aksesoris Kamera Handphone': 'handphone-tablet',
  'Case Waterproof Handphone': 'handphone-tablet',
  'Pembersih Handphone & Tablet': 'handphone-tablet',
  'Casing & Cover': 'handphone-tablet',
  'Screen Guard': 'handphone-tablet',
  'Power Bank': 'handphone-tablet',
  'Stand & Holder': 'handphone-tablet',
  'Memory Card': 'handphone-tablet',
  'Smartwatch': 'handphone-tablet',
  'Handphone': 'handphone-tablet',
  'Tablet': 'handphone-tablet',

  // ── Komputer & Laptop ──
  'Pembersih Laptop / Komputer': 'komputer-laptop',
  'Mousepad': 'komputer-laptop',
  'Mousepad Gaming': 'komputer-laptop',
  'Laptop & Notebook': 'komputer-laptop',
  'Komponen Komputer': 'komputer-laptop',
  'Aksesoris Komputer': 'komputer-laptop',
  'Storage Eksternal': 'komputer-laptop',
  'Software': 'komputer-laptop',

  // ── Elektronik ──
  'Antena TV': 'elektronik',
  'Layar Proyektor': 'elektronik',
  'Elektronik': 'elektronik',
  'Amplifier & DAC': 'elektronik',
  'Speaker Portable': 'elektronik',
  'Speaker Multimedia': 'elektronik',
  'Braket Speaker': 'elektronik',
  'Earphone Bluetooth': 'elektronik',
  'Earphone Standar': 'elektronik',
  'Headphone Wireless & Bluetooth': 'elektronik',
  'Headset Wireless & Bluetooth': 'elektronik',
  'Aksesoris Headphone & Headset': 'elektronik',
  'Aksesoris Earphone': 'elektronik',
  'Mikrofon Handphone': 'elektronik',
  'Mikrofon Kondenser': 'elektronik',
  'Mikrofon Karaoke': 'elektronik',
  'Stand & Aksesoris Mikrofon': 'elektronik',
  'Mixer Musik': 'elektronik',
  'Air Humidifier': 'elektronik',
  'Remot Kontrol TV': 'elektronik',
  'Baterai Alat Elektronik': 'elektronik',
  'Switch & Splitter Video': 'elektronik',
  'Konverter & Ekstender Video': 'elektronik',
  'Lampu LED': 'elektronik',
  'Lampu Dekorasi': 'elektronik',
  'Audio': 'elektronik',
  'Baterai & Charger': 'elektronik',
  'Kamera & Aksesoris': 'elektronik',
  'Foto & Videografi': 'elektronik',
  'Video': 'elektronik',
  'Smart Home': 'elektronik',

  // ── Fashion & Perhiasan ──
  'Gantungan Kunci Pria': 'fashion-perhiasan',
  'Ikat Pinggang Pria': 'fashion-perhiasan',
  'Kacamata Pria': 'fashion-perhiasan',
  'Fashion & Perhiasan': 'fashion-perhiasan',
  'Pakaian Pria': 'fashion-perhiasan',
  'Pakaian Wanita': 'fashion-perhiasan',
  'Aksesoris Fashion Pria': 'fashion-perhiasan',
  'Aksesoris Fashion Wanita': 'fashion-perhiasan',
  'Tas & Dompet Pria': 'fashion-perhiasan',
  'Tas & Dompet Wanita': 'fashion-perhiasan',
  'Sepatu & Sandal Pria': 'fashion-perhiasan',
  'Sepatu & Sandal Wanita': 'fashion-perhiasan',
  'Jam Tangan Pria': 'fashion-perhiasan',
  'Jam Tangan Wanita': 'fashion-perhiasan',
  'Perhiasan': 'fashion-perhiasan',
  'Fashion Muslim': 'fashion-perhiasan',

  // ── Ibu, Bayi & Anak ──
  'Perlengkapan Bayi': 'ibu-bayi-anak',
  'Mainan Anak': 'ibu-bayi-anak',
  'Pakaian Anak': 'ibu-bayi-anak',
  'Makanan Bayi & Anak': 'ibu-bayi-anak',
  'Perawatan Bayi & Anak': 'ibu-bayi-anak',

  // ── Kesehatan & Kecantikan ──
  'Aksesoris Kesehatan': 'kesehatan-kecantikan',
  'Alat Inhalasi & Nebulizer': 'kesehatan-kecantikan',
  'Alat Pelangsing & Pemijat Elektrik': 'kesehatan-kecantikan',
  'Alat Ukur Suhu': 'kesehatan-kecantikan',
  'Masker Anti Polusi': 'kesehatan-kecantikan',
  'Monitor Tekanan Darah': 'kesehatan-kecantikan',
  'Penutup Telinga': 'kesehatan-kecantikan',
  'Sikat Gigi': 'kesehatan-kecantikan',
  'Termometer': 'kesehatan-kecantikan',
  'Trimmer, Groomer & Pencukur Rambut': 'kesehatan-kecantikan',
  'Wax': 'kesehatan-kecantikan',
  'Endoskop': 'kesehatan-kecantikan',
  'Mikroskop': 'kesehatan-kecantikan',
  'Timbangan Badan': 'kesehatan-kecantikan',
  'Hair Dryer': 'kesehatan-kecantikan',
  'Pengering Rambut': 'kesehatan-kecantikan',
  'Alat Kesehatan': 'kesehatan-kecantikan',
  'Perawatan Wajah': 'kesehatan-kecantikan',
  'Perawatan Tubuh': 'kesehatan-kecantikan',
  'Makeup': 'kesehatan-kecantikan',
  'Parfum': 'kesehatan-kecantikan',
  'Suplemen & Vitamin': 'kesehatan-kecantikan',

  // ── Mainan & Video Games ──
  'Video Games': 'mainan-video-games',
  'Mainan Edukasi': 'mainan-video-games',
  'Action Figure & Koleksi': 'mainan-video-games',

  // ── Peralatan Rumah Tangga ──
  'Aksesoris Tempat Tidur Lainnya': 'peralatan-rumah-tangga',
  'Alas & Penahan Pintu': 'peralatan-rumah-tangga',
  'Alas Piring / Tatakan / Placemat': 'peralatan-rumah-tangga',
  'Alat Pembasmi Serangga': 'peralatan-rumah-tangga',
  'Benang Jahit': 'peralatan-rumah-tangga',
  'Botol Minum Olahraga': 'peralatan-rumah-tangga',
  'Cooler & Hidrasi Camping': 'peralatan-rumah-tangga',
  'Corong Air': 'peralatan-rumah-tangga',
  'Dekorasi Dinding Lainnya': 'peralatan-rumah-tangga',
  'Gelas & Cangkir Minum': 'peralatan-rumah-tangga',
  'Gelas Ukur': 'peralatan-rumah-tangga',
  'Gelas Ukur / Cylinder': 'peralatan-rumah-tangga',
  'Jam Dinding': 'peralatan-rumah-tangga',
  'Kendi / Pitcher / Jug / Teko': 'peralatan-rumah-tangga',
  'Keran Wastafel Kamar Mandi': 'peralatan-rumah-tangga',
  'Kompor Elektrik': 'peralatan-rumah-tangga',
  'Kotak Hias': 'peralatan-rumah-tangga',
  'Manajemen Kabel / Cord Holder': 'peralatan-rumah-tangga',
  'Pemoles Lantai': 'peralatan-rumah-tangga',
  'Pengaduk Minuman / Stirrer': 'peralatan-rumah-tangga',
  'Penggorengan / Frypan': 'peralatan-rumah-tangga',
  'Penyaring Teh': 'peralatan-rumah-tangga',
  'Pisau Dapur Serbaguna': 'peralatan-rumah-tangga',
  'Pompa Air': 'peralatan-rumah-tangga',
  'Sealer Plastik': 'peralatan-rumah-tangga',
  'Selotip': 'peralatan-rumah-tangga',
  'Sendok Ukur': 'peralatan-rumah-tangga',
  'Tempat Bumbu': 'peralatan-rumah-tangga',
  'Toples': 'peralatan-rumah-tangga',
  'Botol Minum': 'peralatan-rumah-tangga',
  'Botol Thermos': 'peralatan-rumah-tangga',
  'Teko Elektrik': 'peralatan-rumah-tangga',
  'Juicer & Pengekstrak Buah': 'peralatan-rumah-tangga',
  'Pembuat Sandwich & Toaster': 'peralatan-rumah-tangga',
  'Panci': 'peralatan-rumah-tangga',
  'Cetakan Makanan': 'peralatan-rumah-tangga',
  'Tatakan Gelas': 'peralatan-rumah-tangga',
  'Tempat Tisu Gulung': 'peralatan-rumah-tangga',
  'Saringan Ledeng': 'peralatan-rumah-tangga',
  'Perangkat Sofa Ruang Tamu': 'peralatan-rumah-tangga',
  'Lakban': 'peralatan-rumah-tangga',
  'Perawatan Taman & Tumbuhan': 'peralatan-rumah-tangga',
  'Stiker Dinding': 'peralatan-rumah-tangga',
  'Peralatan Masak Pemanggang BBQ': 'peralatan-rumah-tangga',
  'Sikat Pembersih': 'peralatan-rumah-tangga',
  'Keranjang Dapur': 'peralatan-rumah-tangga',
  'Tas Organizer Pakaian': 'peralatan-rumah-tangga',
  'Alas Furnitur': 'peralatan-rumah-tangga',
  'Alat Dapur': 'peralatan-rumah-tangga',
  'Alat Kebersihan': 'peralatan-rumah-tangga',
  'Dekorasi Rumah': 'peralatan-rumah-tangga',
  'Peralatan Kamar Tidur': 'peralatan-rumah-tangga',
  'Peralatan Kamar Mandi': 'peralatan-rumah-tangga',

  // ── Hobi, Olahraga & Outdoor ──
  'Aksesoris Memancing & Berlayar': 'hobi-olahraga-outdoor',
  'Bantal Leher': 'hobi-olahraga-outdoor',
  'Helm Pelindung': 'hobi-olahraga-outdoor',
  'Kacamata Renang Santai': 'hobi-olahraga-outdoor',
  'Kunci & Pengaman Sepeda': 'hobi-olahraga-outdoor',
  'Lampu Sepeda': 'hobi-olahraga-outdoor',
  'Organizer Pengepakan Lainnya': 'hobi-olahraga-outdoor',
  'Penutup Sadel Sepeda': 'hobi-olahraga-outdoor',
  'Perlengkapan EDC & Survival': 'hobi-olahraga-outdoor',
  'Pompa Ban Sepeda': 'hobi-olahraga-outdoor',
  'Tempat Minum Sepeda': 'hobi-olahraga-outdoor',
  'Peralatan Perkakas': 'hobi-olahraga-outdoor',
  'Pisau Swiss': 'hobi-olahraga-outdoor',
  'Gergaji': 'hobi-olahraga-outdoor',
  'Obeng': 'hobi-olahraga-outdoor',
  'Kunci Pas': 'hobi-olahraga-outdoor',
  'Lem': 'hobi-olahraga-outdoor',
  'Mata Bor': 'hobi-olahraga-outdoor',
  'Aksesoris Bor': 'hobi-olahraga-outdoor',
  'Solder & Aksesoris Solder': 'hobi-olahraga-outdoor',
  'Tester Listrik': 'hobi-olahraga-outdoor',
  'Karabiner & Quickdraw': 'hobi-olahraga-outdoor',
  'Jaket & Parka Olahraga Pria': 'hobi-olahraga-outdoor',
  'Aksesoris Peralatan Alat Listrik Lainnya': 'hobi-olahraga-outdoor',
  'Olahraga': 'hobi-olahraga-outdoor',
  'Sepeda & Aksesoris': 'hobi-olahraga-outdoor',
  'Camping & Hiking': 'hobi-olahraga-outdoor',
  'Memancing': 'hobi-olahraga-outdoor',
  'Alat Musik': 'hobi-olahraga-outdoor',

  // ── Makanan & Minuman ──
  'Aksesoris Mesin Kopi': 'makanan-minuman',
  'Filter Kopi': 'makanan-minuman',
  'Mesin Kopi Manual': 'makanan-minuman',
  'Pembuat Busa / Frother / Foamer Kopi': 'makanan-minuman',
  'Pengiling Kopi': 'makanan-minuman',
  'Makanan Ringan': 'makanan-minuman',
  'Minuman': 'makanan-minuman',
  'Bahan Masakan': 'makanan-minuman',
  'Makanan Kesehatan': 'makanan-minuman',

  // ── Aksesoris Lainnya (true catch-all) ──
  'Peralatan Perawatan Mobil': 'aksesoris-lainnya',
  'Sistem Knalpot Mobil': 'aksesoris-lainnya',
  'Jump Starter, Aki & Charger Baterai Otomotif': 'aksesoris-lainnya',
  'Aksesoris Interior Mobil Lainnya': 'aksesoris-lainnya',
  'Kamera Mobil': 'aksesoris-lainnya',
  'Spidol & Penanda Berwarna': 'aksesoris-lainnya',
  'As Seen On TV': 'aksesoris-lainnya',
  'Kain Lap & Pembersih Layar': 'aksesoris-lainnya',
  'Kartu Perdana & Voucher': 'aksesoris-lainnya',
  'Gadget Lainnya': 'aksesoris-lainnya',
};

// Keyword fallback: regex -> parent category
// Applied when a sub-category is NOT in CATEGORY_MAP. First match wins.
const KEYWORD_FALLBACK = [
  { pattern: /mikrofon|microphone|amplifier|dac\b|speaker|earphone|headphone|headset|mixer.*musik|braket.*speaker/i, target: 'elektronik' },
  { pattern: /audio|sound|woofer|subwoofer|equalizer/i, target: 'elektronik' },
  { pattern: /kabel|charger|casing|cover|screen.?guard|power.?bank|handphone|tablet|smartwatch|memory.?card/i, target: 'handphone-tablet' },
  { pattern: /laptop|komputer|mouse|keyboard|monitor|printer|ssd|ram|flashdisk|webcam/i, target: 'komputer-laptop' },
  { pattern: /masak|dapur|gelas|cangkir|toples|panci|sendok|piring|kendi|botol|minum|teko|tisu|kitchen/i, target: 'peralatan-rumah-tangga' },
  { pattern: /sepeda|olahraga|outdoor|camping|mancing|kacamata.?renang|helm|tenda|sleeping/i, target: 'hobi-olahraga-outdoor' },
  { pattern: /perkakas|bor|obeng|kunci.?pas|gergaji|solder|tester|palu|tang\b|meteran/i, target: 'hobi-olahraga-outdoor' },
  { pattern: /kop[ei]|makanan|minuman|snack|coklat|teh\b|gula/i, target: 'makanan-minuman' },
  { pattern: /kesehatan|kecantikan|termometer|masker|trimmer|sikat.?gigi|nebulizer|endoskop|mikroskop|timbangan/i, target: 'kesehatan-kecantikan' },
  { pattern: /bayi|anak|mainan|game|action.?figure/i, target: 'ibu-bayi-anak' },
  { pattern: /fashion|pakaian|tas\b|sepatu|jam.?tangan|perhiasan|dompet|sandal|kacamata/i, target: 'fashion-perhiasan' },
  { pattern: /mobil|otomotif|knalpot|aki|motor/i, target: 'aksesoris-lainnya' },
  { pattern: /lampu|humidifier|smarthome|remote|tv\b|proyektor|baterai.*elektronik/i, target: 'elektronik' },
];

/**
 * Resolve a Jakmall sub-category name to a parent category slug.
 * Lookup order: exact map -> keyword regex -> 'aksesoris-lainnya'
 */
export function resolveCategory(jakmallSubCategory) {
  if (!jakmallSubCategory) return 'aksesoris-lainnya';

  const exact = CATEGORY_MAP[jakmallSubCategory];
  if (exact) return exact;

  for (const { pattern, target } of KEYWORD_FALLBACK) {
    if (pattern.test(jakmallSubCategory)) return target;
  }

  return 'aksesoris-lainnya';
}
