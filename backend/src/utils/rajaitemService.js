import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const RAJAITEM_API_URL = process.env.RAJAITEM_API_URL || "https://rajaitem.com/api/v1";
const RAJAITEM_API_KEY = process.env.RAJAITEM_API_KEY;

/**
 * Helper to call Rajaitem API
 * @param {string} endpoint - Sub-endpoint e.g., '/profile', '/prepaid/order'
 * @param {object} body - Request body object
 * @returns {Promise<object>}
 */
async function callRajaitemAPI(endpoint, body = {}) {
  if (!RAJAITEM_API_KEY) {
    throw new Error("RAJAITEM_API_KEY is not configured in .env file.");
  }

  // Remove leading slash if present in endpoint
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${RAJAITEM_API_URL}${formattedEndpoint}`;

  // SECURITY: Simulation only via explicit flag, never by NODE_ENV
  const isSimulation = process.env.RAJAITEM_SIMULATION === 'true';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAJAITEM_API_KEY}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Origin': 'https://rajaitem.com',
        'Referer': 'https://rajaitem.com/'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 403 && isSimulation) {
        console.warn(`[Rajaitem SIMULATION] Bypassing Cloudflare 403 block for ${endpoint} with simulated response.`);
        return getSimulatedResponse(endpoint, body);
      }
      throw new Error(`HTTP Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (isSimulation) {
      console.warn(`[Rajaitem SIMULATION] Network error for ${endpoint}, falling back to simulated response. Error:`, error.message);
      return getSimulatedResponse(endpoint, body);
    }
    console.error(`Rajaitem API error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Helper to generate simulated responses for testing in development
 */
function getSimulatedResponse(endpoint, body) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  if (cleanEndpoint === '/profile') {
    return {
      status: true,
      message: "SUCCESS (SIMULATION)",
      data: {
        name: "Markaz Arshy Partner",
        balance: 750000,
        role: "RESELLER"
      }
    };
  }

  if (cleanEndpoint === '/prabayar/product' || cleanEndpoint === '/prepaid/services' || cleanEndpoint === '/prabayar/layanan' || cleanEndpoint === '/prabayar/harga' || cleanEndpoint === '/prepaid/price-list') {
    return {
      status: true,
      message: "SUCCESS (SIMULATION)",
      data: [
        {
          id: "919",
          category: "App Premium",
          product: "Netflix 24 Jam [Best]",
          price: {
            normal: "7900",
            reseller: "7800",
            vip: "7700"
          },
          status: "On"
        },
        {
          id: "918",
          category: "App Premium",
          product: "Netflix Share [Grnsi 10 Day]",
          price: {
            normal: "19900",
            reseller: "19500",
            vip: "19000"
          },
          status: "On"
        },
        {
          id: "815",
          category: "App Premium",
          product: "Voucher Netflix 1 Hari [Best]",
          price: {
            normal: "6700",
            reseller: "6600",
            vip: "6500"
          },
          status: "Off"
        },
        {
          id: "708",
          category: "App Premium",
          product: "Netflix Sharing Garansi 15 Day",
          price: {
            normal: "19900",
            reseller: "18591",
            vip: "17429"
          },
          status: "Off"
        },
        {
          id: "707",
          category: "App Premium",
          product: "Profile Shared 30 + 3 Hari [ 1 Profile - 2 User - 1 Devices ] [OTOMATIS] [MBG 7D]",
          price: {
            normal: "15860",
            reseller: "15570",
            vip: "15418"
          },
          status: "Off"
        },
        {
          id: "706",
          category: "App Premium",
          product: "Netflix Private 30 Hari [ GRNSI 15 Day ]",
          price: {
            normal: "32100",
            reseller: "31200",
            vip: "30200"
          },
          status: "Off"
        },
        {
          id: "705",
          category: "App Premium",
          product: "Profile Private 14 Hari [ 1 Profile - 1 User - 1 Devices ] [OTOMATIS]",
          price: {
            normal: "13260",
            reseller: "13018",
            vip: "12890"
          },
          status: "Off"
        },
        {
          id: "704",
          category: "App Premium",
          product: "Profile Shared 14 Hari [ 1 Profile - 2 User - 1 Devices ] [OTOMATIS]",
          price: {
            normal: "8060",
            reseller: "7913",
            vip: "7835"
          },
          status: "Off"
        },
        {
          id: "543",
          category: "App Premium",
          product: "Profile Private 30 Hari [ 1 Profile - 2 Devices ] [OTOMATIS] [MBG 7D]",
          price: {
            normal: "38800",
            reseller: "37183",
            vip: "36858"
          },
          status: "Off"
        },
        {
          id: "542",
          category: "App Premium",
          product: "Profile Private 30 + 3 Hari [ 1 Profile - 1 User - 1 Devices ] [OTOMATIS] [MBG 7D]",
          price: {
            normal: "25480",
            reseller: "25015",
            vip: "24770"
          },
          status: "Off"
        },
        {
          id: "1042",
          category: "YouTube Premium",
          product: "IndividuPlan 1 Bulan [GSUITE - YOUTUBE ONLY] [GARANSI 28 HARI]",
          price: {
            normal: "26600",
            reseller: "25500",
            vip: "24100"
          },
          status: "On"
        },
        {
          id: "996",
          category: "YouTube Premium",
          product: "Youtube Individu [1 Bulan] [FULL GARANSI]",
          price: {
            normal: "28700",
            reseller: "27900",
            vip: "27600"
          },
          status: "Off"
        },
        {
          id: "975",
          category: "YouTube Premium",
          product: "Youtube Individu [1 Bulan] [GARANSI 2 JAM]",
          price: {
            normal: "17700",
            reseller: "16700",
            vip: "15800"
          },
          status: "Off"
        },
        {
          id: "712",
          category: "YouTube Premium",
          product: "IndividuPlan 1 Bulan [GSUITE - YOUTUBE ONLY] [GARANSI 7 HARI]",
          price: {
            normal: "17300",
            reseller: "16500",
            vip: "15199"
          },
          status: "On"
        },
        {
          id: "920",
          category: "CapCut Pro",
          product: "CapCut Private All Device 1 Bulan Garansi 15 Day",
          price: {
            normal: "26100",
            reseller: "25100",
            vip: "24100"
          },
          status: "Off"
        },
        {
          id: "865",
          category: "CapCut Pro",
          product: "Akun Capcut 10 Hari [ Garansi 5 Hari ]",
          price: {
            normal: "21600",
            reseller: "21200",
            vip: "21000"
          },
          status: "On"
        },
        {
          id: "864",
          category: "CapCut Pro",
          product: "Akun Capcut 1 Bulan [GARANSI BACKFREE]",
          price: {
            normal: "62700",
            reseller: "61400",
            vip: "61200"
          },
          status: "On"
        },
        {
          id: "730",
          category: "CapCut Pro",
          product: "Shared Akun 1 Bulan [ 1 Devices - 2 User ] [ Garansi 7 Hari ]",
          price: {
            normal: "12740",
            reseller: "12507",
            vip: "12385"
          },
          status: "Off"
        },
        {
          id: "121",
          category: "CapCut Pro",
          product: "Shared Akun 1 Bulan [ 1 Devices - 2 User ] Garansi 28 Hari ]",
          price: {
            normal: "15860",
            reseller: "15570",
            vip: "15418"
          },
          status: "Off"
        },
        {
          id: "538",
          category: "App Premium",
          product: "Canva Pro Anggota (1 Bulan)",
          price: {
            normal: "1800",
            reseller: "1750",
            vip: "1700"
          },
          status: "On"
        },
        {
          id: "537",
          category: "App Premium",
          product: "Canva Pro Anggota (2 Bulan)",
          price: {
            normal: "2360",
            reseller: "2232",
            vip: "2117"
          },
          status: "On"
        },
        {
          id: "536",
          category: "App Premium",
          product: "Canva Pro Desainer (1 Bulan)",
          price: {
            normal: "2670",
            reseller: "2587",
            vip: "2450"
          },
          status: "On"
        },
        {
          id: "535",
          category: "App Premium",
          product: "Canva Education (1 Tahun)",
          price: {
            normal: "14530",
            reseller: "13210",
            vip: "12212"
          },
          status: "On"
        },
        {
          id: "978",
          category: "ChatGPT Plus",
          product: "Plus Plan 1 Tahun [ Private Account ] [ Garansi 6 Bulan ]",
          price: {
            normal: "138000",
            reseller: "137000",
            vip: "135000"
          },
          status: "Off"
        },
        {
          id: "976",
          category: "ChatGPT Plus",
          product: "Plus Plan 1 Bulan [ Private Account ] [ Garansi 14 Hari ]",
          price: {
            normal: "72100",
            reseller: "71100",
            vip: "68400"
          },
          status: "Off"
        },
        {
          id: "974",
          category: "ChatGPT Plus",
          product: "Plus Plan 1 Bulan [ Private Account ] [ Garansi 7 Hari ]",
          price: {
            normal: "75600",
            reseller: "74300",
            vip: "73100"
          },
          status: "Off"
        },
        {
          id: "VIDIO1M",
          category: "App Premium",
          product: "Vidio Premier Platinum 1 Bulan",
          price: {
            normal: "12000",
            reseller: "10500",
            vip: "10000"
          },
          status: "On"
        },
        {
          id: "WETV1M",
          category: "App Premium",
          product: "WeTV Premium VIP 1 Bulan",
          price: {
            normal: "15000",
            reseller: "13500",
            vip: "13000"
          },
          status: "On"
        },
        {
          id: "SUPERGROK1M",
          category: "App Premium",
          product: "SuperGrok Pro Account 1 Bulan",
          price: {
            normal: "35000",
            reseller: "32000",
            vip: "30000"
          },
          status: "On"
        },
        {
          id: "734",
          category: "App Premium",
          product: "Private 6 Bulan [ AKUN - 1 DEVICES ] [PROMO - GARANSI 3 BULAN]",
          price: {
            normal: "13320",
            reseller: "10621",
            vip: "10260"
          },
          status: "On"
        },
        {
          id: "733",
          category: "App Premium",
          product: "Private 3 Bulan [ AKUN - 1 DEVICES ] [PROMO - GARANSI 2 BULAN]",
          price: {
            normal: "7820",
            reseller: "6800",
            vip: "5600"
          },
          status: "Off"
        },
        {
          id: "408",
          category: "App Premium",
          product: "Private 1 Bulan [ AKUN - 1 DEVICES ] [PROMO - GARANSI 1 BULAN]",
          price: {
            normal: "4120",
            reseller: "3600",
            vip: "2900"
          },
          status: "Off"
        },
        {
          id: "407",
          category: "App Premium",
          product: "Private 12 Bulan [ AKUN - 1 DEVICES ] [GARANSI 1 BULAN]",
          price: {
            normal: "16400",
            reseller: "14500",
            vip: "13199"
          },
          status: "On"
        },
        {
          id: "406",
          category: "App Premium",
          product: "Private 12 Bulan [ AKUN - 1 DEVICES ] [GARANSI 3 BULAN]",
          price: {
            normal: "18300",
            reseller: "17400",
            vip: "16800"
          },
          status: "On"
        },
        {
          id: "BSTATION1M",
          category: "App Premium",
          product: "Bstation Premium VIP 1 Bulan",
          price: {
            normal: "6600",
            reseller: "5120",
            vip: "4800"
          },
          status: "On"
        },
        {
          id: "DISNEY1M",
          category: "App Premium",
          product: "Disney+ Hotstar 1 Bulan (OTP Phone Login)",
          price: {
            normal: "26100",
            reseller: "23500",
            vip: "22000"
          },
          status: "On"
        },
        {
          id: "881",
          category: "Disney Hotstar",
          product: "Disney+ Hotstar Basic 1 Tahun [ Private Akun - Nomor Pembeli ]",
          price: {
            normal: "122200",
            reseller: "119968",
            vip: "118793"
          },
          status: "Off"
        },
        {
          id: "880",
          category: "Disney Hotstar",
          product: "Disney+ Hotstar Premium 1 Bulan [ Private Akun - Nomor Pembeli ]",
          price: {
            normal: "34892",
            reseller: "34255",
            vip: "33919"
          },
          status: "Off"
        },
        {
          id: "879",
          category: "Disney Hotstar",
          product: "Disney+ Hotstar Basic 1 Bulan [ Private Akun - Nomor Pembelli ]",
          price: {
            normal: "22620",
            reseller: "22207",
            vip: "21989"
          },
          status: "Off"
        },
        {
          id: "1055",
          category: "App Premium",
          product: "Voucher Gemini Pro 3 Bulan (Garansi 2 Jam)",
          price: {
            normal: "35600",
            reseller: "34400",
            vip: "33100"
          },
          status: "On"
        },
        {
          id: "985",
          category: "App Premium",
          product: "Google One AI Pro 1 Tahun (Garansi 3 Bulan)",
          price: {
            normal: "20540",
            reseller: "20165",
            vip: "19967"
          },
          status: "On"
        },
        {
          id: "984",
          category: "App Premium",
          product: "Google One AI Pro 1 Tahun (Garansi 6 Bulan)",
          price: {
            normal: "30680",
            reseller: "30120",
            vip: "29825"
          },
          status: "On"
        },
        {
          id: "983",
          category: "App Premium",
          product: "Google One AI Pro 1 Tahun (Garansi 1 Bulan)",
          price: {
            normal: "15340",
            reseller: "15060",
            vip: "14912"
          },
          status: "On"
        }
      ]
    };
  }

  if (cleanEndpoint === '/prepaid/order' || cleanEndpoint === '/prabayar/pesan') {
    return {
      status: true,
      message: "SUCCESS (SIMULATION)",
      data: {
        order_id: Math.floor(100000 + Math.random() * 900000),
        ref_id: body.ref_id || "REF-" + Date.now(),
        product: body.product || "NETFLIX1M",
        target: body.target || "081234567890",
        price: 25000,
        status: "pending",
        sn: "",
        keterangan: "Pesanan berhasil dibuat, sedang diproses."
      }
    };
  }

  if (cleanEndpoint === '/prepaid/status' || cleanEndpoint === '/prabayar/status') {
    const products = {
      "919": "netflix_24h_simulated@gmail.com:pass24h | Profile 1",
      "918": "netflix_share10d_simulated@gmail.com:pass10d | Profile 3",
      "815": "netflix_1d_simulated@gmail.com:pass1d | Profile 1",
      "708": "netflix_15d_simulated@gmail.com:pass15d | Profile 2",
      "707": "netflix_30d_3d_simulated@gmail.com:pass30d3d | Profile 4",
      "706": "netflix_private30d_simulated@gmail.com:passpriv30d",
      "705": "netflix_private14d_simulated@gmail.com:passpriv14d",
      "704": "netflix_share14d_simulated@gmail.com:passshare14d",
      "543": "netflix_private30d_2dev_simulated@gmail.com:passpriv2dev",
      "542": "netflix_private30d_1user_simulated@gmail.com:passpriv1user",
      NETFLIX1M: "netflix_simulated@gmail.com:passnet123 | Profile 2 | PIN: 1212",
      "1042": "youtube_individu_1042@gmail.com:passyt1042 | GARANSI 28 HARI",
      "996": "youtube_individu_996@gmail.com:passyt996 | FULL GARANSI",
      "975": "youtube_individu_975@gmail.com:passyt975 | GARANSI 2 JAM",
      "712": "youtube_individu_712@gmail.com:passyt712 | GARANSI 7 HARI",
      "920": "capcut_private_920@gmail.com:passcapcut920 | Private All Device 1 Bulan",
      "865": "capcut_10hari_865@gmail.com:passcapcut865 | Akun 10 Hari",
      "864": "capcut_1bulan_864@gmail.com:passcapcut864 | Akun 1 Bulan GARANSI BACKFREE",
      "730": "capcut_shared_730@gmail.com:passcapcut730 | Shared 1 Bulan 7 Hari",
      "121": "capcut_shared_121@gmail.com:passcapcut121 | Shared 1 Bulan 28 Hari",
      CANVA1M: "https://www.canva.com/brand/join?token=simulated-canva-invite-link",
      538: "https://www.canva.com/brand/join?token=simulated-canva-1month-invite-link",
      537: "https://www.canva.com/brand/join?token=simulated-canva-2month-invite-link",
      536: "https://www.canva.com/brand/join?token=simulated-canva-designer-invite-link",
      535: "https://www.canva.com/brand/join?token=simulated-canva-education-invite-link",
      "978": "chatgpt_plus_978@gmail.com:passchatgpt978 | 1 Tahun Private",
      "976": "chatgpt_plus_976@gmail.com:passchatgpt976 | 1 Bulan Garansi 14 Hari",
      "974": "chatgpt_plus_974@gmail.com:passchatgpt974 | 1 Bulan Garansi 7 Hari",
      VIDIO1M: "vidio_simulated@gmail.com:passvidio123",
      WETV1M: "wetv_simulated@gmail.com:passwetv123",
      SUPERGROK1M: "grok_simulated@gmail.com:passgrok123",
      "734": "viu_simulated_6m@gmail.com:passviu6m",
      "733": "viu_simulated_3m@gmail.com:passviu3m",
      "408": "viu_simulated_1m@gmail.com:passviu1m",
      "407": "viu_simulated_12m_1@gmail.com:passviu12m1",
      "406": "viu_simulated_12m_3@gmail.com:passviu12m3",
      BSTATION1M: "bstation_simulated@gmail.com:passbstation123",
      DISNEY1M: "OTP Berhasil Terverifikasi - Akun Aktif",
      "881": "disney_hotstar_basic_1y_881@gmail.com:passdisney881 | Private Akun",
      "880": "disney_hotstar_premium_1m_880@gmail.com:passdisney880 | Private Akun",
      "879": "disney_hotstar_basic_1m_879@gmail.com:passdisney879 | Private Akun",
      1055: "GEMINIPRO-VOUCHERCODE-1055-XYZ",
      985: "gemini_member985@gmail.com:passgemini985 | Google One AI Premium 1 Year",
      984: "gemini_member984@gmail.com:passgemini984 | Google One AI Premium 1 Year",
      983: "gemini_member983@gmail.com:passgemini983 | Google One AI Premium 1 Year"
    };

    const productCode = body.product || "NETFLIX1M";
    const credentials = products[productCode] || "simulated_account@mail.com:password123";

    return {
      status: true,
      message: "SUCCESS (SIMULATION)",
      data: {
        order_id: body.order_id || 123456,
        ref_id: body.ref_id || "REF-123",
        product: productCode,
        target: body.target || "081234567890",
        price: 25000,
        status: "success",
        sn: credentials,
        keterangan: `Fulfillment otomatis: ${credentials}`,
        note: credentials
      }
    };
  }

  return {
    status: false,
    message: `ENDPOINT_NOT_SIMULATED: ${cleanEndpoint}`
  };
}

/**
 * 1. Get Profile / Balance Information
 */
export async function getRajaitemProfile() {
  return callRajaitemAPI('/profile');
}

/**
 * 2. Get Prepaid Service/Product List
 * Supports checking standard endpoints in sequence if paths differ
 */
export async function getRajaitemPrepaidServices() {
  const endpoints = ['/prabayar/product', '/prepaid/services', '/prabayar/layanan', '/prabayar/harga', '/prepaid/price-list'];
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`[Rajaitem] Trying to fetch services from: ${endpoint}`);
      const response = await callRajaitemAPI(endpoint);
      // If we get a response with status true or at least an array, return it
      if (response && (response.status === true || Array.isArray(response.data) || response.data)) {
        console.log(`[Rajaitem] Successfully fetched services from: ${endpoint}`);
        return response;
      }
    } catch (err) {
      console.warn(`[Rajaitem] Failed endpoint ${endpoint}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to fetch prepaid services from Rajaitem API using any standard endpoints.");
}

/**
 * 3. Place a Prepaid Order
 * @param {string} refId - Client's unique transaction/order ID
 * @param {string} productCode - The product service code
 * @param {string} target - WhatsApp/Phone/Identifier
 */
export async function placeRajaitemPrepaidOrder(refId, productCode, target) {
  const endpoints = ['/prabayar/orders', '/prepaid/order', '/prabayar/pesan'];
  let lastError = null;

  // Ensure target is provided, fallback to a standard Indonesian phone format if missing
  const cleanTarget = target || "081234567890";

  for (const endpoint of endpoints) {
    try {
      console.log(`[Rajaitem] Trying to place order on: ${endpoint}`);
      const body = endpoint.includes('orders')
        ? {
            ref_id: String(refId),
            product: String(productCode),
            user_id: String(cleanTarget),
            zone_id: ""
          }
        : {
            ref_id: String(refId),
            product: String(productCode),
            target: String(cleanTarget)
          };
      const response = await callRajaitemAPI(endpoint, body);
      if (response) {
        return response;
      }
    } catch (err) {
      console.warn(`[Rajaitem] Failed placing order on ${endpoint}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to place prepaid order with Rajaitem API.");
}

/**
 * 4. Check Order Status
 * @param {string|number} providerOrderId - Order ID returned by Rajaitem
 * @param {string} refId - Client's unique reference ID
 */
export async function checkRajaitemOrderStatus(providerOrderId, refId) {
  const endpoints = ['/prabayar/status', '/prepaid/status'];
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const body = endpoint.includes('prabayar/status')
        ? { order_id: String(providerOrderId) }
        : {
            order_id: providerOrderId ? String(providerOrderId) : undefined,
            ref_id: refId ? String(refId) : undefined
          };
      const response = await callRajaitemAPI(endpoint, body);
      if (response) {
        return response;
      }
    } catch (err) {
      console.warn(`[Rajaitem] Failed checking status on ${endpoint}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to check order status with Rajaitem API.");
}
