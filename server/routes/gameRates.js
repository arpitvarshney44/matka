const express = require('express');
const GameRate = require('../models/GameRate');
const { requireAdmin, auth } = require('../middleware/auth');
const router = express.Router();

// Get game rates (public)
router.get('/', async (req, res) => {
  try {
    const rates = await GameRate.findOne().select('-_id -__v -createdAt -updatedAt');
    if (!rates) return res.status(404).json({ message: 'Game rates not set' });
    res.json(rates);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get game rates (admin)
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const rates = await GameRate.findOne().select('-_id -__v -createdAt -updatedAt');
    if (!rates) return res.status(404).json({ message: 'Game rates not set' });
    res.json(rates);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update game rates (admin)
router.put('/admin', requireAdmin, async (req, res) => {
  try {
    let rates = await GameRate.findOne();
    
    if (!rates) {
      // If no rates exist, create new
      rates = new GameRate(req.body);
    } else {
      // Update existing rates
      Object.assign(rates, req.body);
    }
    
    await rates.save();
    // Return without MongoDB fields
    const response = rates.toObject();
    delete response._id;
    delete response.__v;
    delete response.createdAt;
    delete response.updatedAt;
    res.json(response);
  } catch (error) {
    console.error('Game rates update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
