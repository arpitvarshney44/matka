const express = require('express')
const router = express.Router()
const HowToPlay = require('../models/HowToPlay')
const { auth } = require('../middleware/auth')

// Get How to Play content (public route)
router.get('/', async (req, res) => {
  try {
    let howToPlay = await HowToPlay.findOne()
    
    if (!howToPlay) {
      // Create default content if none exists
      howToPlay = new HowToPlay()
      await howToPlay.save()
    }
    
    res.json({ content: howToPlay.content })
  } catch (error) {
    console.error('Error fetching How to Play content:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update How to Play content (admin only)
router.put('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { content } = req.body

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Content is required' })
    }

    let howToPlay = await HowToPlay.findOne()
    
    if (!howToPlay) {
      // Create new document if none exists
      howToPlay = new HowToPlay({
        content: content.trim(),
        updatedBy: req.user.name || 'Admin'
      })
    } else {
      // Update existing document
      howToPlay.content = content.trim()
      howToPlay.updatedBy = req.user.name || 'Admin'
      howToPlay.updatedAt = new Date()
    }

    await howToPlay.save()
    
    res.json({ 
      message: 'How to Play content updated successfully',
      content: howToPlay.content,
      updatedAt: howToPlay.updatedAt,
      updatedBy: howToPlay.updatedBy
    })
  } catch (error) {
    console.error('Error updating How to Play content:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get How to Play content for admin (with metadata)
router.get('/admin', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    let howToPlay = await HowToPlay.findOne()
    
    if (!howToPlay) {
      // Create default content if none exists
      howToPlay = new HowToPlay()
      await howToPlay.save()
    }
    
    res.json({
      content: howToPlay.content,
      updatedAt: howToPlay.updatedAt,
      updatedBy: howToPlay.updatedBy,
      createdAt: howToPlay.createdAt
    })
  } catch (error) {
    console.error('Error fetching How to Play content for admin:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router 