const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const nodemailer = require('nodemailer');

exports.register = async (req, res) => {
    try {
        console.log('Register request body:', req.body);
        const {
            name, email, password, role, phone, address,
            // Restaurant fields
            business, website, message, city, type,
            // Delivery fields
            vehicle, license, insurance, face_photo
        } = req.body;

        if (!name || !email || !password) return res.status(400).json({ message: 'Nom, email et mot de passe requis' });
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(409).json({ message: 'Email deja utilise' });
        const hashed = await bcrypt.hash(password, 10);
        const userRole = role || 'client';
        const isVerified = (userRole === 'restaurant' || userRole === 'delivery') ? false : true;
        const isActive = true;

        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, role, phone, address, isVerified, isActive, vehicle_type, has_license, has_insurance, face_photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                name, email, hashed, userRole, phone || null, address || null, isVerified, isActive,
                userRole === 'delivery' ? (vehicle || null) : null,
                userRole === 'delivery' ? (license || null) : null,
                userRole === 'delivery' ? (insurance || null) : null,
                userRole === 'delivery' ? (face_photo || null) : null
            ]
        );

        const userId = result.insertId;

        // If restaurant, automatically create a pending restaurant record
        if (userRole === 'restaurant') {
            const image_url = req.body.image_url || null;
            await db.execute(
                'INSERT INTO restaurants (owner_id, name, description, address, city, cuisine, image_url, isVerified, isOpen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    userId,
                    business || name,
                    message || null,
                    address || null,
                    city || null,
                    type || null,
                    image_url,
                    false, // isVerified
                    false  // isOpen
                ]
            );
        }

        const token = jwt.sign({ id: userId, role: userRole }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: userId, name, email, role: userRole, isVerified } });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe requis' });
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable' });
        const user = users[0];
        if (!user.isActive) return res.status(403).json({ message: 'Compte desactive' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Identifiants incorrects' });
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getMe = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, name, email, phone, role, address, created_at FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable' });
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        await db.execute('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?', [name, phone, address, req.user.id]);
        res.json({ message: 'Profil mis a jour' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email requis' });

        const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: 'Email introuvable' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await db.execute(
            'UPDATE users SET otp = ?, otp_expiry = ? WHERE email = ?',
            [otp, expiry, email]
        );

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'SpeedMeal - Code de réinitialisation',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #A51C1C;">Réinitialisation du mot de passe</h2>
                    <p>Bonjour,</p>
                    <p>Voici votre code de réinitialisation :</p>
                    <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p>Ce code expire dans 10 minutes.</p>
                    <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
                </div>
            `
        });

        res.json({ message: 'OTP envoyé avec succès' });
    } catch (err) {
        console.error('OTP Error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP et nouveau mot de passe requis' });
        }

        const [users] = await db.execute('SELECT id, otp, otp_expiry FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: 'Email introuvable' });

        const user = users[0];
        if (!user.otp || user.otp !== otp) {
            return res.status(400).json({ message: 'OTP invalide' });
        }

        if (new Date(user.otp_expiry) < new Date()) {
            return res.status(400).json({ message: 'OTP expiré' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await db.execute(
            'UPDATE users SET password = ?, otp = NULL, otp_expiry = NULL WHERE id = ?',
            [hashed, user.id]
        );

        res.json({ message: 'Mot de passe réinitialisé avec succès' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
