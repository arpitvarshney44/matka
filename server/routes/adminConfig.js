const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const AdminConfig = require('../models/AdminConfig')

// GET admin configuration (admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    let adminConfig = await AdminConfig.findOne()
    if (!adminConfig) {
      // Create default config if none exists
      adminConfig = new AdminConfig()
      await adminConfig.save()
    }

    res.json({
      adminName: adminConfig.adminName,
      mobileNumber: adminConfig.mobileNumber,
      upiId: adminConfig.upiId,
      email: adminConfig.email,
      updatedAt: adminConfig.updatedAt,
      updatedBy: adminConfig.updatedBy
    })
  } catch (error) {
    console.error('Error fetching admin config:', error)
    res.status(500).json({ message: 'Failed to fetch admin configuration' })
  }
})

// PUT update admin configuration (admin only)
router.put('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { adminName, mobileNumber, password, upiId, email } = req.body

    // Validate required fields
    if (!adminName || !mobileNumber || !password || !upiId || !email) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    // Validate mobile number format
    if (!/^[0-9]{9,10}$/.test(mobileNumber)) {
      return res.status(400).json({ message: 'Please enter a valid mobile number (9-10 digits)' })
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' })
    }

    let adminConfig = await AdminConfig.findOne()
    if (!adminConfig) {
      adminConfig = new AdminConfig()
    }

    // Update fields
    adminConfig.adminName = adminName.trim()
    adminConfig.mobileNumber = mobileNumber.trim()
    adminConfig.password = password.trim()
    adminConfig.upiId = upiId.trim()
    adminConfig.email = email.trim()
    adminConfig.updatedAt = new Date()
    adminConfig.updatedBy = req.user.name || 'Admin'

    await adminConfig.save()

    res.json({
      message: 'Admin configuration updated successfully',
      adminName: adminConfig.adminName,
      mobileNumber: adminConfig.mobileNumber,
      upiId: adminConfig.upiId,
      email: adminConfig.email,
      updatedAt: adminConfig.updatedAt,
      updatedBy: adminConfig.updatedBy
    })
  } catch (error) {
    console.error('Error updating admin config:', error)
    res.status(500).json({ message: 'Failed to update admin configuration' })
  }
})

module.exports = router 