import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { generateVerificationCode, sendVerificationEmail } from '../emailService.js';

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: 'Terlalu banyak percobaan. Silakan coba lagi dalam 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = '7d';

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

/** Helper: buat JWT + format user object */
function makeToken(user) {
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
  return {
    token,
    user: {
      id:         user.id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      balance:    user.balance,
      isVerified: user.isVerified,
      authProvider: user.authProvider,
    },
  };
}

/* ═══════════════════════════════════════
   REGISTER (email + password)
   ═══════════════════════════════════════ */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, whatsapp } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    // Password complexity: min 8 chars, at least 1 letter and 1 number
    if (password.length < 10) {
      return res.status(400).json({ error: 'Password harus minimal 10 karakter.' });
    }
    if (!/[a-zA-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password harus mengandung minimal 1 huruf.' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password harus mengandung minimal 1 angka.' });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return res.status(400).json({ error: 'Password harus mengandung minimal 1 karakter spesial (!@#$%^&* dll).' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Jika sudah daftar via Google, beri pesan khusus
      if (existing.authProvider === 'google') {
        return res.status(400).json({ error: 'Email ini terdaftar via Google. Silakan login dengan Google.' });
      }
      return res.status(400).json({ error: 'Email sudah terdaftar.' });
    }

    const hashedPassword    = await bcrypt.hash(password, 10);
    const verificationCode  = generateVerificationCode();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        whatsapp: whatsapp || null,
        password: hashedPassword,
        role: 'USER',
        balance: 0,
        isVerified: false,
        verificationToken: verificationCode,
        authProvider: 'local',
      },
    });

    await sendVerificationEmail(email, name, verificationCode);

    return res.status(201).json({
      message: 'Registrasi berhasil! Silakan cek email Anda untuk kode verifikasi.',
      requireVerification: true,
      email: user.email,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

/* ═══════════════════════════════════════
   VERIFY EMAIL
   ═══════════════════════════════════════ */
router.post('/verify-email', authLimiter, async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ error: 'Email dan kode verifikasi diperlukan.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user)            return res.status(400).json({ error: 'Email tidak ditemukan.' });
    if (user.isVerified)  return res.status(400).json({ error: 'Email sudah terverifikasi. Silakan login.' });
    if (user.verificationToken !== token) {
      return res.status(400).json({ error: 'Kode verifikasi salah. Silakan periksa kembali.' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null },
    });

    return res.json({
      message: 'Email berhasil diverifikasi!',
      ...makeToken(updated),
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ error: 'Internal server error during verification.' });
  }
});

/* ═══════════════════════════════════════
   RESEND VERIFICATION CODE
   ═══════════════════════════════════════ */
router.post('/resend-verification', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email diperlukan.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)           return res.status(400).json({ error: 'Email tidak ditemukan.' });
    if (user.isVerified) return res.status(400).json({ error: 'Email sudah terverifikasi.' });

    const newCode = generateVerificationCode();
    await prisma.user.update({ where: { id: user.id }, data: { verificationToken: newCode } });
    await sendVerificationEmail(email, user.name, newCode);

    return res.json({ message: 'Kode verifikasi baru telah dikirim ke email Anda.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ error: 'Gagal mengirim ulang kode verifikasi.' });
  }
});

/* ═══════════════════════════════════════
   LOGIN (email + password)
   ═══════════════════════════════════════ */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });

    // Cek apakah akun ini dibuat via Google (tidak punya password)
    if (user.authProvider === 'google' || !user.password) {
      return res.status(400).json({ error: 'Akun ini terdaftar via Google. Silakan login dengan Google.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ error: 'Invalid email or password.' });

    if (!user.isVerified) {
      return res.status(403).json({
        error: 'Email belum diverifikasi. Silakan cek email Anda.',
        requireVerification: true,
        email: user.email,
      });
    }

    return res.json(makeToken(user));
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

/* ═══════════════════════════════════════
   GOOGLE OAUTH — Step 1: Redirect
   ═══════════════════════════════════════ */
router.get('/google', (req, res) => {
  const clientId    = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

  if (!clientId) {
    return res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_not_configured`
    );
  }

  // CSRF protection: generate random state and store in cookie
  const state = crypto.randomBytes(32).toString('hex');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         'openid email profile',
    access_type:   'offline',
    prompt:        'select_account',
    state,
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

/* ═══════════════════════════════════════
   GOOGLE OAUTH — Step 2: Callback
   ═══════════════════════════════════════ */
router.get('/google/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const { code, error, state } = req.query;

  if (error || !code) {
    return res.redirect(`${frontendUrl}/login?error=google_denied`);
  }

  // CSRF protection: validate state parameter
  const savedState = req.cookies?.oauth_state;
  if (!state || !savedState || state !== savedState) {
    return res.redirect(`${frontendUrl}/login?error=google_csrf_invalid`);
  }
  // Clear the state cookie
  res.clearCookie('oauth_state');

  try {
    const clientId     = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri  = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

    // 1. Tukar code dengan access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  redirectUri,
        grant_type:    'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('Google token exchange failed:', tokenData);
      return res.redirect(`${frontendUrl}/login?error=google_token_failed`);
    }

    // 2. Ambil profil user dari Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    if (!profile.email) {
      return res.redirect(`${frontendUrl}/login?error=google_no_email`);
    }

    // 3. Cari atau buat user di database
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: profile.sub }, { email: profile.email }] },
    });

    if (user) {
      // User sudah ada — update googleId jika belum ada
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.sub, authProvider: 'google', isVerified: true },
        });
      }
    } else {
      // User baru — buat akun otomatis (terverifikasi langsung)
      user = await prisma.user.create({
        data: {
          name:         profile.name || profile.email.split('@')[0],
          email:        profile.email,
          password:     null,
          role:         'USER',
          balance:      0,
          isVerified:   true,
          googleId:     profile.sub,
          authProvider: 'google',
        },
      });
    }

    // 4. Buat JWT dan redirect ke frontend
    const { token } = makeToken(user);

    // Set JWT as HttpOnly cookie for backward compat + security
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Also pass in URL for existing frontend (GoogleCallback.jsx reads from searchParams)
    return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);

  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return res.redirect(`${frontendUrl}/login?error=google_server_error`);
  }
});

/* ═══════════════════════════════════════
   GET CURRENT USER PROFILE
   ═══════════════════════════════════════ */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, balance: true, isVerified: true, authProvider: true, createdAt: true },
    });
    return res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
