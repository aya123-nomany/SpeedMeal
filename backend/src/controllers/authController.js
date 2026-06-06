const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sendOTP, verifyOTP } = require('../services/otpService');

// ── Helper: normalize phone to E.164 ────────────────────────────────────────
const normalizePhone = (phone) => {
    // Strip spaces, dashes, parentheses
    let p = phone.replace(/[\s\-().]/g, '');
    // If starts with 0, assume Moroccan number → replace with +212
    if (p.startsWith('0')) p = '+212' + p.slice(1);
    // If no + prefix, add +
    if (!p.startsWith('+')) p = '+' + p;
    return p;
};

// ── STEP 1: Send OTP ─────────────────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
    try {
        let { phone, channel } = req.body; // channel: 'sms' | 'whatsapp'
        if (!phone) return res.status(400).json({ message: 'Numéro de téléphone requis' });

        phone = normalizePhone(phone);
        channel = channel === 'whatsapp' ? 'whatsapp' : 'sms';

        // Basic phone validation
        if (!/^\+\d{8,15}$/.test(phone)) {
            return res.status(400).json({ message: 'Numéro de téléphone invalide' });
        }

        await sendOTP(phone, channel);

        res.json({
            message: `Code envoyé par ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}`,
            phone,
            channel
        });
    } catch (err) {
        console.error('OTP send error:', err.message);
        // Don't expose Twilio errors to client in production
        res.status(500).json({ message: 'Impossible d\'envoyer le code. Vérifiez votre numéro.' });
    }
};

// ── STEP 2: Verify OTP → login or register ───────────────────────────────────
exports.verifyOtp = async (req, res) => {
    try {
        let { phone, code, name } = req.body;
        if (!phone || !code) {
            return res.status(400).json({ message: 'Téléphone et code requis' });
        }

        phone = normalizePhone(phone);
        const valid = await verifyOTP(phone, code);

        if (!valid) {
            return res.status(401).json({ message: 'Code invalide ou expiré' });
        }

        // Check if user exists
        let [users] = await db.execute('SELECT * FROM users WHERE phone = ?', [phone]);

        let user;
        if (users.length > 0) {
            // Existing user → login
            user = users[0];
            if (!user.isActive) {
                return res.status(403).json({ message: 'Compte désactivé' });
            }
        } else {
            // New user → auto-register
            const displayName = name || `User${phone.slice(-4)}`;
            const [result] = await db.execute(
                'INSERT INTO users (name, phone, role, password) VALUES (?, ?, ?, ?)',
                [displayName, phone, 'client', ''] // no password for OTP users
            );
            const [newUsers] = await db.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
            user = newUsers[0];
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
            isNewUser: users.length === 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── CLASSIC email/password login (kept for admin) ────────────────────────────
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email et mot de passe requis' });
        }

        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable' });

        const user = users[0];
        if (!user.isActive) return res.status(403).json({ message: 'Compte désactivé' });
        if (!user.password) return res.status(401).json({ message: 'Utilisez la connexion par SMS pour ce compte' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Identifiants incorrects' });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── REGISTER with email (kept for restaurant / delivery owners) ──────────────
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, phone, address } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Nom, email et mot de passe requis' });
        }

        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(409).json({ message: 'Email déjà utilisé' });

        const hashed = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashed, role || 'client', phone || null, address || null]
        );

        const token = jwt.sign({ id: result.insertId, role: role || 'client' }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: result.insertId, name, email, role: role || 'client' } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── GET current user ─────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, name, email, phone, role, address, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── UPDATE profile ────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        await db.execute(
            'UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?',
            [name, phone, address, req.user.id]
        );
        res.json({ message: 'Profil mis à jour' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
