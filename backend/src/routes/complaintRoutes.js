
const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const db = require('../config/db');

// Create a complaint (user)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { order_id, restaurant_id, driver_id, target, subject, description } = req.body;
    const [result] = await db.execute(
      'INSERT INTO complaints (user_id, order_id, restaurant_id, driver_id, target, subject, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, order_id || null, restaurant_id || null, driver_id || null, target || 'site', subject, description]
    );
    res.status(201).json({ message: 'Complaint created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get my complaints (user)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT c.*, u.name as user_name, r.name as restaurant_name
       FROM complaints c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN restaurants r ON c.restaurant_id = r.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update complaint status (admin) - Must come before /:id
router.put('/:id/status', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'in_review', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    await db.execute(
      'UPDATE complaints SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update complaint (user)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { subject, description, order_id, restaurant_id, driver_id, target } = req.body;
    // Check if complaint belongs to user
    const [complaint] = await db.execute(
      'SELECT user_id FROM complaints WHERE id = ?',
      [req.params.id]
    );
    if (!complaint.length || complaint[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await db.execute(
      'UPDATE complaints SET subject = ?, description = ?, order_id = ?, restaurant_id = ?, driver_id = ?, target = ? WHERE id = ?',
      [subject, description, order_id || null, restaurant_id || null, driver_id || null, target || 'site', req.params.id]
    );
    res.json({ message: 'Complaint updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete complaint (user)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Check if complaint belongs to user
    const [complaint] = await db.execute(
      'SELECT user_id FROM complaints WHERE id = ?',
      [req.params.id]
    );
    if (!complaint.length || complaint[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await db.execute(
      'DELETE FROM complaints WHERE id = ?',
      [req.params.id]
    );
    res.json({ message: 'Complaint deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send notification related to a complaint
router.post('/:id/notify', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { recipientType, title, message } = req.body;
    
    // Get complaint details
    const [rows] = await db.execute(
      `SELECT c.*, r.owner_id as restaurant_owner_id
       FROM complaints c
       LEFT JOIN restaurants r ON c.restaurant_id = r.id
       WHERE c.id = ?`,
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    
    const complaint = rows[0];
    let targetUserId = null;
    
    if (recipientType === 'client') {
      targetUserId = complaint.user_id;
    } else if (recipientType === 'restaurant') {
      targetUserId = complaint.restaurant_owner_id;
    } else if (recipientType === 'driver') {
      targetUserId = complaint.driver_id;
    }
    
    if (!targetUserId) {
      return res.status(400).json({ error: 'Recipient user not found or target type invalid' });
    }
    
    // Insert notification
    await db.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [targetUserId, title, message, 'system']
    );
    
    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${targetUserId}`).emit('newNotification');
    }
    
    res.json({ message: 'Notification sent successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all complaints (admin) - Must come last to avoid conflicts with /:id
router.get('/', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT c.*, u.name as user_name, u.phone as user_phone,
              r.name as restaurant_name, r.owner_id as restaurant_owner_id, d.name as driver_name
       FROM complaints c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN restaurants r ON c.restaurant_id = r.id
       LEFT JOIN users d ON c.driver_id = d.id
       ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
