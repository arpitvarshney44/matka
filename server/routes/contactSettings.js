const express = require('express')
const router = express.Router()
const ContactSettings = require('../models/ContactSettings')
const { auth } = require('../middleware/auth')

// Get contact settings (public route)
router.get('/', async (req, res) => {
  try {
    let contactSettings = await ContactSettings.findOne()
    
    if (!contactSettings) {
      // Create default contact settings if none exists
      contactSettings = new ContactSettings()
      await contactSettings.save()
    }
    
    res.json({ 
      mobileNumber: contactSettings.mobileNumber,
      email: contactSettings.email,
      whatsappNumber: contactSettings.whatsappNumber
    })
  } catch (error) {
    console.error('Error fetching contact settings:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update contact settings (admin only)
router.put('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { mobileNumber, email, whatsappNumber } = req.body

    // Validate required fields
    if (!mobileNumber || !email || !whatsappNumber) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    let contactSettings = await ContactSettings.findOne()
    
    if (!contactSettings) {
      // Create new document if none exists
      contactSettings = new ContactSettings({
        mobileNumber: mobileNumber.trim(),
        email: email.trim(),
        whatsappNumber: whatsappNumber.trim(),
        updatedBy: req.user.name || 'Admin'
      })
    } else {
      // Update existing document
      contactSettings.mobileNumber = mobileNumber.trim()
      contactSettings.email = email.trim()
      contactSettings.whatsappNumber = whatsappNumber.trim()
      contactSettings.updatedBy = req.user.name || 'Admin'
      contactSettings.updatedAt = new Date()
    }

    await contactSettings.save()
    
    res.json({ 
      message: 'Contact settings updated successfully',
      mobileNumber: contactSettings.mobileNumber,
      email: contactSettings.email,
      whatsappNumber: contactSettings.whatsappNumber,
      updatedAt: contactSettings.updatedAt,
      updatedBy: contactSettings.updatedBy
    })
  } catch (error) {
    console.error('Error updating contact settings:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get contact settings for admin (with metadata)
router.get('/admin', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    let contactSettings = await ContactSettings.findOne()
    
    if (!contactSettings) {
      // Create default contact settings if none exists
      contactSettings = new ContactSettings()
      await contactSettings.save()
    }
    
    res.json({
      mobileNumber: contactSettings.mobileNumber,
      email: contactSettings.email,
      whatsappNumber: contactSettings.whatsappNumber,
      updatedAt: contactSettings.updatedAt,
      updatedBy: contactSettings.updatedBy,
      createdAt: contactSettings.createdAt
    })
  } catch (error) {
    console.error('Error fetching contact settings for admin:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router 