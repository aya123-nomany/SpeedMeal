const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const db = require('../config/db');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.put('/profile', authMiddleware, authController.updateProfile);

// Delete account (user self-deletion)
router.delete('/account', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user role before deletion
        const [[user]] = await db.execute('SELECT role FROM users WHERE id = ?', [userId]);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // If restaurant user, also delete their restaurant record
        if (user.role === 'restaurant') {
            await db.execute('DELETE FROM restaurants WHERE owner_id = ?', [userId]);
        }
        
        // Delete the user
        await db.execute('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
