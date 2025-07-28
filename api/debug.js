const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Debug endpoint to check database data
router.get('/conversations', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, phone_number, display_name, profile_name, last_message_at FROM conversations ORDER BY last_message_at DESC');
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Debug endpoint to update profile name
router.post('/update-profile', async (req, res) => {
  try {
    const { phoneNumber, profileName } = req.body;
    
    const result = await pool.query(
      'UPDATE conversations SET profile_name = $1, updated_at = CURRENT_TIMESTAMP WHERE phone_number = $2 RETURNING *',
      [profileName, phoneNumber]
    );
    
    res.json({
      success: true,
      updated: result.rows[0]
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = router;
