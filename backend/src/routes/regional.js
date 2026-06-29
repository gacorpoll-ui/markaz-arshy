import express from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

const API_KEY = process.env.API_KEY_SHIPPING;
const BASE = 'https://use.api.co.id/regional/indonesia';

async function proxyToRegional(req, res, endpoint) {
  if (!API_KEY) return res.status(500).json({ error: 'API Key regional belum dikonfigurasi.' });
  try {
    const params = new URLSearchParams(req.query);
    const url = `${BASE}/${endpoint}${params.toString() ? '?' + params : ''}`;
    const response = await fetch(url, { headers: { 'x-api-co-id': API_KEY } });
    const data = await response.json();
    if (!data.is_success) return res.status(502).json({ error: data.message || 'Gagal memuat data wilayah.' });
    res.json({ data: data.data });
  } catch (error) {
    console.error(`Regional proxy error (${endpoint}):`, error);
    res.status(502).json({ error: 'Gagal terhubung ke server wilayah.' });
  }
}

// GET /api/regional/provinces
router.get('/provinces', (req, res) => proxyToRegional(req, res, 'provinces'));

// GET /api/regional/regencies?province_code=...
router.get('/regencies', (req, res) => {
  const { province_code } = req.query;
  if (!province_code) return res.status(400).json({ error: 'province_code wajib diisi.' });
  proxyToRegional(req, res, `provinces/${province_code}/regencies`);
});

// GET /api/regional/districts?regency_code=...
router.get('/districts', (req, res) => {
  const { regency_code } = req.query;
  if (!regency_code) return res.status(400).json({ error: 'regency_code wajib diisi.' });
  proxyToRegional(req, res, `regencies/${regency_code}/districts`);
});

// GET /api/regional/villages?district_code=...
router.get('/villages', (req, res) => {
  const { district_code } = req.query;
  if (!district_code) return res.status(400).json({ error: 'district_code wajib diisi.' });
  proxyToRegional(req, res, `districts/${district_code}/villages`);
});

export default router;
