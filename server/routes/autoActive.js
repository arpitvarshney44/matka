const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const AutoActiveConfig = require('../models/AutoActiveConfig')

// GET auto active configuration (admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    let autoActiveConfig = await AutoActiveConfig.findOne()
    if (!autoActiveConfig) {
      // Create default config if none exists
      autoActiveConfig = new AutoActiveConfig({ mode: 'MANUAL' })
      await autoActiveConfig.save()
    }

    res.json({
      mode: autoActiveConfig.mode,
      updatedAt: autoActiveConfig.updatedAt,
      updatedBy: autoActiveConfig.updatedBy
    })
  } catch (error) {
    console.error('Error fetching auto active config:', error)
    res.status(500).json({ message: 'Failed to fetch auto active configuration' })
  }
})

// PUT update auto active configuration (admin only)
router.put('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { mode } = req.body

    // Validate mode
    if (!mode || !['AUTO', 'MANUAL'].includes(mode)) {
      return res.status(400).json({ message: 'Mode must be either AUTO or MANUAL' })
    }

    let autoActiveConfig = await AutoActiveConfig.findOne()
    if (!autoActiveConfig) {
      autoActiveConfig = new AutoActiveConfig()
    }

    // Update fields
    autoActiveConfig.mode = mode
    autoActiveConfig.updatedAt = new Date()
    autoActiveConfig.updatedBy = req.user.name || 'Admin'

    await autoActiveConfig.save()

    res.json({
      message: 'Auto active configuration updated successfully',
      mode: autoActiveConfig.mode,
      updatedAt: autoActiveConfig.updatedAt,
      updatedBy: autoActiveConfig.updatedBy
    })
  } catch (error) {
    console.error('Error updating auto active config:', error)
    res.status(500).json({ message: 'Failed to update auto active configuration' })
  }
})

module.exports = router 