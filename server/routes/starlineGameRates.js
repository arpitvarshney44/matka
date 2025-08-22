const express = require('express');
const StarlineGameRate = require('../models/StarlineGameRate');
const { requireAdmin, auth } = require('../middleware/auth');
const router = express.Router();

// Get starline game rates (public)
router.get('/', async (req, res) => {
  try {
    const rates = await StarlineGameRate.findOne().select('-_id -__v -createdAt -updatedAt');
    if (!rates) return res.status(404).json({ message: 'Starline game rates not set' });
    res.json(rates);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get starline game rates (admin)
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const rates = await StarlineGameRate.findOne().select('-_id -__v -createdAt -updatedAt');
    if (!rates) {
      // Return default rates if none exist
      const defaultRates = {
        singleDigit: { min: 10, max: 100 },
        singlePana: { min: 10, max: 1500 },
        doublePana: { min: 10, max: 3000 },
        triplePana: { min: 10, max: 7000 }
      };
      return res.json(defaultRates);
    }
    res.json(rates);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update starline game rates (admin)
router.put('/admin', requireAdmin, async (req, res) => {
  try {
    let rates = await StarlineGameRate.findOne();
    
    if (!rates) {
      // If no rates exist, create new
      rates = new StarlineGameRate(req.body);
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
    console.error('Starline game rates update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;