const express = require('express')
const MainSettings = require('../models/MainSettings')
const { auth } = require('../middleware/auth')

const router = express.Router()

// Get main settings (admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    let settings = await MainSettings.findOne()
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = new MainSettings()
      await settings.save()
    }

    res.json(settings)
  } catch (error) {
    console.error('Error fetching main settings:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get main settings (public route for user app)
router.get('/public', async (req, res) => {
  try {
    let settings = await MainSettings.findOne()
    
    if (!settings) {
      settings = new MainSettings()
      await settings.save()
    }

    res.json(settings)
  } catch (error) {
    console.error('Error fetching public main settings:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update account details
router.put('/admin/account-details', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { accountHolderName, accountNumber, ifscCode } = req.body

    let settings = await MainSettings.findOne()
    if (!settings) {
      settings = new MainSettings()
    }

    settings.accountHolderName = accountHolderName || settings.accountHolderName
    settings.accountNumber = accountNumber || settings.accountNumber
    settings.ifscCode = ifscCode || settings.ifscCode

    await settings.save()
    res.json(settings)
  } catch (error) {
    console.error('Error updating account details:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update phone number
router.put('/admin/phone-number', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { phoneNumber } = req.body

    let settings = await MainSettings.findOne()
    if (!settings) {
      settings = new MainSettings()
    }

    settings.phoneNumber = phoneNumber || settings.phoneNumber

    await settings.save()
    res.json(settings)
  } catch (error) {
    console.error('Error updating phone number:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update WhatsApp number
router.put('/admin/whatsapp', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { whatsappNumber } = req.body

    let settings = await MainSettings.findOne()
    if (!settings) {
      settings = new MainSettings()
    }

    settings.whatsappNumber = whatsappNumber || settings.whatsappNumber

    await settings.save()
    res.json(settings)
  } catch (error) {
    console.error('Error updating WhatsApp number:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update UPI ID
router.put('/admin/upi-id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { upiId } = req.body

    let settings = await MainSettings.findOne()
    if (!settings) {
      settings = new MainSettings()
    }

    settings.upiId = upiId || settings.upiId

    await settings.save()
    res.json(settings)
  } catch (error) {
    console.error('Error updating UPI ID:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update UPI payment settings
router.put('/admin/upi-payments', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { phonepeUpi, gpayUpi, paytmUpi } = req.body

    let settings = await MainSettings.findOne()
    if (!settings) {
      settings = new MainSettings()
    }

    settings.phonepeUpi = phonepeUpi || settings.phonepeUpi
    settings.gpayUpi = gpayUpi || settings.gpayUpi
    settings.paytmUpi = paytmUpi || settings.paytmUpi

    await settings.save()
    res.json(settings)
  } catch (error) {
    console.error('Error updating UPI payments:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update app settings
router.put('/admin/app-settings', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { appLink, shareMessage } = req.body

    let settings = await MainSettings.findOne()
    if (!settings) {
      settings = new MainSettings()
    }

    settings.appLink = appLink || settings.appLink
    settings.shareMessage = shareMessage || settings.shareMessage

    await settings.save()
    res.json(settings)
  } catch (error) {
    console.error('Error updating app settings:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update game settings
router.put('/admin/game-settings', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { minimumBid, minimumWithdraw, minimumDeposit, userStartingBalance } = req.body

    let settings = await MainSettings.findOne()
    if (!settings) {
      settings = new MainSettings()
    }

    settings.minimumBid = minimumBid !== undefined ? minimumBid : settings.minimumBid
    settings.minimumWithdraw = minimumWithdraw !== undefined ? minimumWithdraw : settings.minimumWithdraw
    settings.minimumDeposit = minimumDeposit !== undefined ? minimumDeposit : settings.minimumDeposit
    settings.userStartingBalance = userStartingBalance !== undefined ? userStartingBalance : settings.userStartingBalance

    await settings.save()
    res.json(settings)
  } catch (error) {
    console.error('Error updating game settings:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update withdrawal time settings
router.put('/admin/withdrawal-times', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { withdrawalOpenTime, withdrawalCloseTime } = req.body

    let settings = await MainSettings.findOne()
    if (!settings) {
      settings = new MainSettings()
    }

    settings.withdrawalOpenTime = withdrawalOpenTime || settings.withdrawalOpenTime
    settings.withdrawalCloseTime = withdrawalCloseTime || settings.withdrawalCloseTime

    await settings.save()
    res.json(settings)
  } catch (error) {
    console.error('Error updating withdrawal times:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router 