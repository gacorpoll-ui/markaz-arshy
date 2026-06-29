import express from 'express';
import fetch from 'node-fetch';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

const API_CO_ID_BASE = 'https://use.api.co.id';
const API_KEY = process.env.API_KEY_SHIPPING;

// Calculate shipping cost
router.get('/cost', async (req, res) => {
  const { originVillageCode, destinationVillageCode, weight } = req.query;

  if (!destinationVillageCode || !weight) {
    return res.status(400).json({ error: 'destinationVillageCode dan weight wajib diisi.' });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'API Key ongkir belum dikonfigurasi.' });
  }

  try {
    const params = new URLSearchParams();
    if (originVillageCode) params.append('origin_village_code', originVillageCode);
    params.append('destination_village_code', destinationVillageCode);
    params.append('weight', Math.max(1, Math.round(parseFloat(weight))).toString());

    const response = await fetch(`${API_CO_ID_BASE}/expedition/shipping-cost?${params}`, {
      method: 'GET',
      headers: { 'x-api-co-id': API_KEY },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('api.co.id error:', response.status, text);
      const msg = response.status === 404
        ? 'Kode kelurahan tidak ditemukan.'
        : 'Gagal menghitung ongkos kirim.';
      return res.status(502).json({ error: msg });
    }

    const data = await response.json();
    if (!data.is_success) {
      return res.status(502).json({ error: data.message || 'Gagal menghitung ongkos kirim.' });
    }

    // Normalize response — api.co.id returns flat courier list (not nested services)
    const couriers = (data.data?.couriers || []).map(c => ({
      courier: (c.courier_code || '').toLowerCase(),
      courierName: c.courier_name || '',
      services: [{
        service: (c.courier_code || '').toLowerCase(),
        serviceName: c.courier_name || '',
        cost: c.price || 0,
        etd: c.estimation || '',
        description: '',
      }],
      price: c.price || 0,
      estimation: c.estimation || '',
    }));

    res.json({ couriers });
  } catch (error) {
    console.error('Shipping cost error:', error);
    res.status(502).json({ error: 'Gagal terhubung ke server ongkir.' });
  }
});

export default router;
