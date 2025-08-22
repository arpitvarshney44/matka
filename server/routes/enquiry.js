const express = require('express')
const router = express.Router()
const Enquiry = require('../models/Enquiry')
const { auth } = require('../middleware/auth')

// Get user's enquiries (user route)
router.get('/user', auth, async (req, res) => {
  try {
    const enquiries = await Enquiry.find({ userId: req.user._id })
      .sort({ lastMessageAt: -1 })
      .select('messages status lastMessageAt createdAt')
    
    res.json(enquiries)
  } catch (error) {
    console.error('Error fetching user enquiries:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Create new enquiry (user route)
router.post('/user', auth, async (req, res) => {
  try {
    const { message } = req.body

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message is required' })
    }

    // Check if user already has an open enquiry
    let enquiry = await Enquiry.findOne({ 
      userId: req.user._id, 
      status: 'open' 
    })

    if (enquiry) {
      // Add message to existing enquiry
      enquiry.messages.push({
        sender: 'user',
        message: message.trim()
      })
      enquiry.lastMessageAt = new Date()
      await enquiry.save()
    } else {
      // Create new enquiry
      enquiry = new Enquiry({
        userId: req.user._id,
        userName: req.user.name,
        userMobile: req.user.mobileNumber,
        messages: [{
          sender: 'user',
          message: message.trim()
        }]
      })
      await enquiry.save()
    }

    res.json({ 
      message: 'Enquiry sent successfully',
      enquiry: enquiry
    })
  } catch (error) {
    console.error('Error creating enquiry:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get all enquiries for admin (admin route)
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const enquiries = await Enquiry.find()
      .sort({ lastMessageAt: -1 })
      .select('userId userName userMobile status lastMessageAt createdAt messages isReadByAdmin')
      .populate('userId', 'name mobileNumber')

    res.json(enquiries)
  } catch (error) {
    console.error('Error fetching admin enquiries:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get specific enquiry for admin (admin route)
router.get('/admin/:enquiryId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const enquiry = await Enquiry.findById(req.params.enquiryId)
      .populate('userId', 'name mobileNumber')

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' })
    }

    // Mark as read by admin
    enquiry.isReadByAdmin = true
    await enquiry.save()

    res.json(enquiry)
  } catch (error) {
    console.error('Error fetching enquiry:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Send message from admin (admin route)
router.post('/admin/:enquiryId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { message } = req.body

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message is required' })
    }

    const enquiry = await Enquiry.findById(req.params.enquiryId)

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' })
    }

    // Add admin message
    enquiry.messages.push({
      sender: 'admin',
      message: message.trim()
    })
    enquiry.lastMessageAt = new Date()
    await enquiry.save()

    res.json({ 
      message: 'Message sent successfully',
      enquiry: enquiry
    })
  } catch (error) {
    console.error('Error sending admin message:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Close enquiry (admin route)
router.put('/admin/:enquiryId/close', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const enquiry = await Enquiry.findById(req.params.enquiryId)

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' })
    }

    enquiry.status = 'closed'
    await enquiry.save()

    res.json({ 
      message: 'Enquiry closed successfully',
      enquiry: enquiry
    })
  } catch (error) {
    console.error('Error closing enquiry:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Reopen enquiry (admin route)
router.put('/admin/:enquiryId/reopen', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const enquiry = await Enquiry.findById(req.params.enquiryId)

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' })
    }

    enquiry.status = 'open'
    await enquiry.save()

    res.json({ 
      message: 'Enquiry reopened successfully',
      enquiry: enquiry
    })
  } catch (error) {
    console.error('Error reopening enquiry:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router 