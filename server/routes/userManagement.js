const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const User = require('../models/User')

// GET approved users only (admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { search, page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    let query = { isActive: true } // Only show approved users
    
    // Search by name or mobile number
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } }
      ]
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await User.countDocuments(query)

    res.json({
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ message: 'Failed to fetch users' })
  }
})

// GET unapproved users (admin only)
router.get('/admin/unapproved', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { search, page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    let query = { isActive: false }
    
    // Search by name or mobile number
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } }
      ]
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await User.countDocuments(query)

    res.json({
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error fetching unapproved users:', error)
    res.status(500).json({ message: 'Failed to fetch unapproved users' })
  }
})

// PUT approve/deactivate user (admin only)
router.put('/admin/approve/:userId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { userId } = req.params
    const { action } = req.body // 'approve' or 'deactivate'

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Toggle the active status
    user.isActive = !user.isActive
    await user.save()

    const actionText = user.isActive ? 'approved' : 'deactivated'
    res.json({
      message: `User ${actionText} successfully`,
      user: {
        id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        isActive: user.isActive
      }
    })
  } catch (error) {
    console.error('Error updating user status:', error)
    res.status(500).json({ message: 'Failed to update user status' })
  }
})

// DELETE user (admin only)
router.delete('/admin/:userId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { userId } = req.params

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    await User.findByIdAndDelete(userId)

    res.json({
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ message: 'Failed to delete user' })
  }
})

// GET user details (admin only)
router.get('/admin/user/:userId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { userId } = req.params

    const user = await User.findById(userId).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    console.error('Error fetching user details:', error)
    res.status(500).json({ message: 'Failed to fetch user details' })
  }
})

module.exports = router 