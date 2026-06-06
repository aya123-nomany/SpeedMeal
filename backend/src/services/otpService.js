const twilio = require('twilio');
const db = require('../config/db');

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

/**
 * Generate a 6-digit OTP, store it in DB (valid 10 min), send via SMS or WhatsApp
 * @param {string} phone  E.164 format, e.g. "+212612345678"
 * @param {string} channel  "sms" | "whatsapp"
 */
const sendOTP = async (phone, channel = 'sms') => {
    // Generate code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // +10 minutes

    // Invalidate any existing unused OTP for this phone
    await db.execute(
        'UPDATE otp_codes SET used = TRUE WHERE phone = ? AND used = FALSE',
        [phone]
    );

    // Store new OTP
    await db.execute(
        'INSERT INTO otp_codes (phone, code, channel, expires_at) VALUES (?, ?, ?, ?)',
        [phone, code, channel, expiresAt]
    );

    const message = `Votre code SpeedMeal est : *${code}*\nValable 10 minutes. Ne le partagez pas.`;

    if (channel === 'whatsapp') {
        await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: `whatsapp:${phone}`,
            body: message,
        });
    } else {
        await client.messages.create({
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone,
            body: message,
        });
    }

    return true;
};

/**
 * Verify OTP code
 * @returns {boolean} true if valid
 */
const verifyOTP = async (phone, code) => {
    const [[otp]] = await db.execute(
        `SELECT id FROM otp_codes
         WHERE phone = ? AND code = ? AND used = FALSE AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [phone, code]
    );

    if (!otp) return false;

    // Mark as used
    await db.execute('UPDATE otp_codes SET used = TRUE WHERE id = ?', [otp.id]);
    return true;
};

module.exports = { sendOTP, verifyOTP };
