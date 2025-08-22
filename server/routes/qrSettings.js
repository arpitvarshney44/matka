const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const QRSettings = require('../models/QRSettings')
const { auth } = require('../middleware/auth')

const router = express.Router()

// Configure multer for QR code uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'qr-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only image files are allowed!'))
    }
  }
})

// Get QR code (admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    let qrCode = await QRSettings.findOne()
    if (!qrCode) {
      qrCode = new QRSettings({
        title: 'QR Code',
        description: '',
        imagePath: '',
        isActive: false
      })
      await qrCode.save()
    }
    res.json(qrCode)
  } catch (error) {
    console.error('Error fetching QR code:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get QR code (public route for user app)
router.get('/public', async (req, res) => {
  try {
    const qrCode = await QRSettings.findOne({ isActive: true })
    res.json(qrCode || null)
  } catch (error) {
    console.error('Error fetching public QR code:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Create or update QR code
router.post('/admin', auth, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    if (!req.file) {
      return res.status(400).json({ message: 'QR code image is required' })
    }

    const { title, description } = req.body

    let qrCode = await QRSettings.findOne()
    if (!qrCode) {
      qrCode = new QRSettings()
    }

    // Delete old image if exists
    if (qrCode.imagePath) {
      const oldImagePath = path.join(__dirname, '../uploads', qrCode.imagePath)
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath)
      }
    }

    qrCode.title = title || 'QR Code'
    qrCode.description = description || ''
    qrCode.imagePath = req.file.filename
    qrCode.isActive = true

    await qrCode.save()
    res.json(qrCode)
  } catch (error) {
    console.error('Error saving QR code:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update QR code
router.put('/admin', auth, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    let qrCode = await QRSettings.findOne()
    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found' })
    }

    const { title, description } = req.body

    // If new image is uploaded, delete old image
    if (req.file) {
      const oldImagePath = path.join(__dirname, '../uploads', qrCode.imagePath)
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath)
      }
      qrCode.imagePath = req.file.filename
    }

    qrCode.title = title || qrCode.title
    qrCode.description = description !== undefined ? description : qrCode.description

    await qrCode.save()
    res.json(qrCode)
  } catch (error) {
    console.error('Error updating QR code:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Toggle QR code status
router.patch('/admin/toggle', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    let qrCode = await QRSettings.findOne()
    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found' })
    }

    qrCode.isActive = !qrCode.isActive
    await qrCode.save()
    res.json(qrCode)
  } catch (error) {
    console.error('Error toggling QR code status:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete QR code
router.delete('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const qrCode = await QRSettings.findOne()
    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found' })
    }

    // Delete image file
    if (qrCode.imagePath) {
      const imagePath = path.join(__dirname, '../uploads', qrCode.imagePath)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }

    await QRSettings.findByIdAndDelete(qrCode._id)
    res.json({ message: 'QR code deleted successfully' })
  } catch (error) {
    console.error('Error deleting QR code:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router 