const express = require('express')
const { body, validationResult } = require('express-validator')
const { requireSuperAdmin } = require('../middleware/auth')
const AdminConfig = require('../models/AdminConfig')

const router = express.Router()

// All routes require super admin authentication (only admin, not subadmin)
router.use(requireSuperAdmin)

// Log sub admin management access
router.use((req, res, next) => {
  console.log(`Sub admin management access: ${req.method} ${req.path} by ${req.user.name} (${req.user.mobileNumber})`)
  next()
})

// @route   GET /api/sub-admin-management
// @desc    Get all sub admins
// @access  Private/Super Admin
router.get('/', async (req, res) => {
  try {
    const subAdmins = await AdminConfig.find({ role: 'admin' })
      .select('-password')
      .sort({ createdAt: -1 })

    res.json({ subAdmins })
  } catch (error) {
    console.error('Get sub admins error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/sub-admin-management
// @desc    Create a new sub admin
// @access  Private/Super Admin
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
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

    const { name, email, username, password } = req.body

    // Check if email already exists
    const existingEmail = await AdminConfig.findOne({ email })
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    // Check if username already exists
    const existingUsername = await AdminConfig.findOne({ mobileNumber: username })
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' })
    }

    // Create new sub admin
    const subAdmin = new AdminConfig({
      adminName: name,
      email,
      mobileNumber: username, // Using mobileNumber field for username
      password,
      role: 'admin',
      isActive: true
    })

    await subAdmin.save()

    // Remove password from response
    const subAdminResponse = subAdmin.toJSON()

    res.status(201).json({
      message: 'Sub admin created successfully',
      subAdmin: subAdminResponse
    })
  } catch (error) {
    console.error('Create sub admin error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/sub-admin-management/:id
// @desc    Update a sub admin
// @access  Private/Super Admin
router.put('/:id', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .optional()
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

    const subAdminId = req.params.id
    const updateData = req.body

    // Check if sub admin exists
    const subAdmin = await AdminConfig.findById(subAdminId)
    if (!subAdmin) {
      return res.status(404).json({ message: 'Sub admin not found' })
    }

    // Ensure it's a sub admin
    if (subAdmin.role !== 'admin') {
      return res.status(400).json({ message: 'User is not a sub admin' })
    }

    // Check if email is being changed and if it already exists
    if (updateData.email && updateData.email !== subAdmin.email) {
      const existingEmail = await AdminConfig.findOne({ email: updateData.email })
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' })
      }
    }

    // Check if username is being changed and if it already exists
    if (updateData.username && updateData.username !== subAdmin.mobileNumber) {
      const existingUsername = await AdminConfig.findOne({ mobileNumber: updateData.username })
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already exists' })
      }
      updateData.mobileNumber = updateData.username
      delete updateData.username
    }

    // Handle name field mapping
    if (updateData.name) {
      updateData.adminName = updateData.name
      delete updateData.name
    }

    const updatedSubAdmin = await AdminConfig.findByIdAndUpdate(
      subAdminId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password')

    res.json({
      message: 'Sub admin updated successfully',
      subAdmin: updatedSubAdmin
    })
  } catch (error) {
    console.error('Update sub admin error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/sub-admin-management/:id
// @desc    Delete a sub admin
// @access  Private/Super Admin
router.delete('/:id', async (req, res) => {
  try {
    const subAdminId = req.params.id

    // Check if sub admin exists
    const subAdmin = await AdminConfig.findById(subAdminId)
    if (!subAdmin) {
      return res.status(404).json({ message: 'Sub admin not found' })
    }

    // Ensure it's a sub admin
    if (subAdmin.role !== 'admin') {
      return res.status(400).json({ message: 'User is not a sub admin' })
    }

    await AdminConfig.findByIdAndDelete(subAdminId)

    res.json({ message: 'Sub admin deleted successfully' })
  } catch (error) {
    console.error('Delete sub admin error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/sub-admin-management/:id/status
// @desc    Toggle sub admin active status
// @access  Private/Super Admin
router.put('/:id/status', async (req, res) => {
  try {
    const subAdminId = req.params.id

    // Check if sub admin exists
    const subAdmin = await AdminConfig.findById(subAdminId)
    if (!subAdmin) {
      return res.status(404).json({ message: 'Sub admin not found' })
    }

    // Ensure it's a sub admin
    if (subAdmin.role !== 'admin') {
      return res.status(400).json({ message: 'User is not a sub admin' })
    }

    // Toggle status
    subAdmin.isActive = !subAdmin.isActive
    await subAdmin.save()

    const subAdminResponse = subAdmin.toJSON()

    res.json({
      message: `Sub admin ${subAdmin.isActive ? 'activated' : 'deactivated'} successfully`,
      subAdmin: subAdminResponse
    })
  } catch (error) {
    console.error('Toggle sub admin status error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router 