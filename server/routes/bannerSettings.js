const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const BannerSettings = require('../models/BannerSettings')
const { auth } = require('../middleware/auth')

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads')
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
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

// Get all banner settings (admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const banners = await BannerSettings.find().sort({ order: 1, createdAt: -1 })
    res.json(banners)
  } catch (error) {
    console.error('Error fetching banner settings:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get active banners (public route for user dashboard)
router.get('/public', async (req, res) => {
  try {
    const banners = await BannerSettings.find({ isActive: true }).sort({ order: 1, createdAt: -1 })
    res.json(banners)
  } catch (error) {
    console.error('Error fetching public banners:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Create new banner
router.post('/admin', auth, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' })
    }

    const { title, description, isActive, order } = req.body

    if (!title) {
      return res.status(400).json({ message: 'Title is required' })
    }

    const banner = new BannerSettings({
      title,
      description: description || '',
      imagePath: `/uploads/${req.file.filename}`,
      isActive: isActive === 'true' || isActive === true,
      order: order ? parseInt(order) : 0
    })

    await banner.save()
    res.status(201).json(banner)
  } catch (error) {
    console.error('Error creating banner:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update banner
router.put('/admin/:id', auth, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { title, description, isActive, order } = req.body
    const bannerId = req.params.id

    const banner = await BannerSettings.findById(bannerId)
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' })
    }

    // Update fields
    banner.title = title || banner.title
    banner.description = description !== undefined ? description : banner.description
    banner.isActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : banner.isActive
    banner.order = order ? parseInt(order) : banner.order

    // Update image if new file is uploaded
    if (req.file) {
      // Delete old image file if it exists
      if (banner.imagePath) {
        const oldImagePath = path.join(__dirname, '..', banner.imagePath)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }
      banner.imagePath = `/uploads/${req.file.filename}`
    }

    await banner.save()
    res.json(banner)
  } catch (error) {
    console.error('Error updating banner:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete banner
router.delete('/admin/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const bannerId = req.params.id
    const banner = await BannerSettings.findById(bannerId)

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' })
    }

    // Delete image file if it exists
    if (banner.imagePath) {
      const imagePath = path.join(__dirname, '..', banner.imagePath)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }

    await BannerSettings.findByIdAndDelete(bannerId)
    res.json({ message: 'Banner deleted successfully' })
  } catch (error) {
    console.error('Error deleting banner:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Toggle banner status
router.patch('/admin/:id/toggle', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const bannerId = req.params.id
    const banner = await BannerSettings.findById(bannerId)

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' })
    }

    banner.isActive = !banner.isActive
    await banner.save()

    res.json(banner)
  } catch (error) {
    console.error('Error toggling banner status:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Serve banner images
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename
  const imagePath = path.join(__dirname, '../uploads', filename)
  
  if (fs.existsSync(imagePath)) {
    // Set CORS headers for image serving
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    res.setHeader('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
    
    res.sendFile(imagePath)
  } else {
    res.status(404).json({ message: 'Image not found' })
  }
})

module.exports = router 