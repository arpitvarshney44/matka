const express = require('express')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const User = require('../models/User')
const AdminConfig = require('../models/AdminConfig')
const AutoActiveConfig = require('../models/AutoActiveConfig')
const { auth } = require('../middleware/auth')

const router = express.Router()

// Generate JWT token
const generateToken = (userId, role = 'user') => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  })
}

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('mobileNumber')
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please enter a valid 10-digit mobile number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { name, mobileNumber, password } = req.body

    // Check if user already exists (exclude admins)
    const existingUser = await User.findOne({ mobileNumber, role: { $ne: 'admin' } })
    if (existingUser) {
      return res.status(400).json({ message: 'User with this mobile number already exists' })
    }

    // Check auto active configuration
    const autoActiveConfig = await AutoActiveConfig.findOne()
    const isAutoActive = autoActiveConfig?.mode === 'AUTO'

    // Create new user
    const user = new User({
      name,
      mobileNumber,
      password,
      isActive: isAutoActive // Auto approve if AUTO mode is enabled
    })

    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        role: user.role,
        isActive: user.isActive,
        balance: user.balance
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ message: 'Server error during registration' })
  }
})

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('mobileNumber')
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please enter a valid 10-digit mobile number'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { mobileNumber, password } = req.body

    // Find user by mobile number (exclude admins)
    const user = await User.findOne({ mobileNumber, role: { $ne: 'admin' } })
    if (!user) {
      return res.status(400).json({ message: 'Invalid mobile number or password' })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid mobile number or password' })
    }

    // Check if admin client is trying to login with non-admin user
    const origin = req.get('Origin')
    const isAdminClient = origin && (origin.includes('3001') || origin.includes('admin.rajkalyan.com'))
    
    if (isAdminClient && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        role: user.role,
        isActive: user.isActive,
        balance: user.balance
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login' })
  }
})

// @route   POST /api/auth/admin-login
// @desc    Admin/Subadmin login using AdminConfig database or User database
// @access  Public
router.post('/admin-login', [
  body('mobileNumber')
    .trim()
    .matches(/^[0-9]{9,10}$/)
    .withMessage('Please enter a valid mobile number (9-10 digits)'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { mobileNumber, password } = req.body

    // First, try to find admin config (super admin)
    let adminConfig = await AdminConfig.findOne()
    if (!adminConfig) {
      // Create default admin config if none exists
      adminConfig = new AdminConfig({
        adminName: 'Admin',
        mobileNumber: '7665007800',
        password: 'admin123',
        upiId: '787794312@kbl',
        email: 'admin@gmail.com'
      })
      await adminConfig.save()
    }

    // Check if it's super admin login
    if (adminConfig.mobileNumber === mobileNumber) {
      // Check password
      const isPasswordValid = await adminConfig.comparePassword(password)
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid mobile number or password' })
      }

      // Generate admin token
      const token = generateToken(adminConfig._id, 'admin')

      return res.json({
        message: 'Admin login successful',
        token,
        user: {
          id: adminConfig._id,
          name: adminConfig.adminName,
          mobileNumber: adminConfig.mobileNumber,
          role: 'admin'
        }
      })
    }

    // If not super admin, check for subadmin in AdminConfig database
    const subAdmin = await AdminConfig.findOne({ mobileNumber, role: 'admin' })
    if (!subAdmin) {
      return res.status(400).json({ message: 'Invalid mobile number or password' })
    }

    // Check if subadmin is active
    if (!subAdmin.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' })
    }

    // Check password
    const isPasswordValid = await subAdmin.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid mobile number or password' })
    }

    // Generate subadmin token
    const token = generateToken(subAdmin._id, 'admin')

    res.json({
      message: 'Sub admin login successful',
      token,
      user: {
        id: subAdmin._id,
        name: subAdmin.adminName,
        mobileNumber: subAdmin.mobileNumber,
        role: 'admin'
      }
    })
  } catch (error) {
    console.error('Admin/Subadmin login error:', error)
    res.status(500).json({ message: 'Server error during admin/subadmin login' })
  }
})

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        mobileNumber: req.user.mobileNumber,
        role: req.user.role,
        isActive: req.user.isActive,
        balance: req.user.balance, // Added balance field
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    })
  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/auth/me
// @desc    Get current user (alias for profile)
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        mobileNumber: req.user.mobileNumber,
        role: req.user.role,
        isActive: req.user.isActive,
        balance: req.user.balance, // Added balance field
        lastLogin: req.user.lastLogin || null,
        createdAt: req.user.createdAt || null
      }
    })
  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router 