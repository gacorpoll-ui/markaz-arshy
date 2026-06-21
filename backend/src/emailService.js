import nodemailer from 'nodemailer';

// Cek apakah SMTP dikonfigurasi
const isSmtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;

let transporter = null;

if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('[EMAIL] SMTP configured, emails will be sent via', process.env.SMTP_HOST);
} else {
  console.log('[EMAIL] ⚠️ SMTP not configured — verification codes will be logged to console (development mode)');
}

/**
 * Generate kode verifikasi 6 digit
 */
export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Kirim email verifikasi
 * @param {string} email - Alamat email penerima
 * @param {string} name - Nama user
 * @param {string} code - Kode verifikasi 6 digit
 * @returns {Promise<boolean>} true jika berhasil
 */
export async function sendVerificationEmail(email, name, code) {
  // Development fallback: log ke console
  if (!transporter) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  📧 KODE VERIFIKASI EMAIL (Development Mode)    ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Email : ${email.padEnd(39)}║`);
    console.log(`║  Nama  : ${name.padEnd(39)}║`);
    console.log(`║  Kode  : ${code.padEnd(39)}║`);
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
    return true;
  }

  try {
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #0f172a 0%, #070913 100%); border-radius: 16px; color: #f8fafc;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; background: linear-gradient(135deg, #4facfe, #00f2fe); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">Markaz-Arshy</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">Verifikasi Email Anda</p>
        </div>
        
        <p style="color: #e2e8f0; font-size: 15px;">Halo <strong>${name}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          Terima kasih telah mendaftar di Markaz-Arshy! Gunakan kode verifikasi berikut untuk mengaktifkan akun Anda:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 12px; padding: 20px 40px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #070913;">${code}</span>
          </div>
        </div>
        
        <p style="color: #64748b; font-size: 12px; text-align: center; line-height: 1.5;">
          Kode ini berlaku selama 24 jam.<br>
          Jika Anda tidak mendaftar di Markaz-Arshy, abaikan email ini.
        </p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08);">
          <span style="color: #475569; font-size: 11px;">© 2026 Markaz-Arshy. All rights reserved.</span>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Markaz-Arshy" <noreply@markaz-arshy.com>',
      to: email,
      subject: `${code} — Kode Verifikasi Markaz-Arshy`,
      html: htmlContent,
    });

    console.log(`[EMAIL] ✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[EMAIL] ❌ Failed to send verification email:', error.message);
    // Fallback: Log kode ke console agar user tetap bisa verifikasi
    console.log(`[EMAIL] Fallback — Kode verifikasi untuk ${email}: ${code}`);
    return false;
  }
}

/**
 * Kirim email promosi kustom
 * @param {string} email - Alamat email penerima
 * @param {string} name - Nama user
 * @param {string} subject - Subjek email promosi
 * @param {string} htmlContent - Isi html promosi kustom
 * @returns {Promise<boolean>} true jika berhasil
 */
export async function sendPromoEmail(email, name, subject, htmlContent) {
  if (!transporter) {
    console.log(`[EMAIL-PROMO] (Development Mode) Target: ${email}, Nama: ${name}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${htmlContent}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Markaz-Arshy" <noreply@markaz-arshy.com>',
      to: email,
      subject: subject,
      html: htmlContent,
    });

    console.log(`[EMAIL-PROMO] ✅ Promo email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[EMAIL-PROMO] ❌ Failed to send promo email:', error.message);
    return false;
  }
}
