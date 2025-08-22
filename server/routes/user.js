const express = require('express')
const { body, validationResult } = require('express-validator')
const User = require('../models/User')
const { auth, requireAdmin } = require('../middleware/auth')
const PasswordChangeRequest = require('../models/PasswordChangeRequest')  
const router = express.Router()

// @route   GET /api/user/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        mobileNumber: req.user.mobileNumber,
        role: req.user.role,
        balance: req.user.balance,
        bankDetails: req.user.bankDetails,
        paymentDetails: req.user.paymentDetails,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      }
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address')
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

    const { name, email } = req.body
    const updateData = {}

    if (name) {
      updateData.name = name
    }

    if (email) {
      updateData.email = email
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password')

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        balance: user.balance,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/user/all
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/all', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 })
    
    res.json({
      users,
      total: users.length
    })
  } catch (error) {
    console.error('Get all users error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/user/:id/role
// @desc    Update user role (admin only)
// @access  Private/Admin
router.put('/:id/role', [
  requireAdmin,
  body('role')
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin')
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

    const { role } = req.body
    const userId = req.params.id

    // Prevent admin from changing their own role
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own role' })
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Update user role error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/user/:id/status
// @desc    Toggle user active status (admin only)
// @access  Private/Admin
router.put('/:id/status', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id

    // Prevent admin from deactivating themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.isActive = !user.isActive
    await user.save()

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Toggle user status error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/user/change-password
// @desc    Request password change (creates a request for admin approval)
// @access  Private
router.put('/change-password', [
  auth,
  body('mobileNumber')
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please enter a valid 10-digit mobile number'),
  body('newPassword')
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

    const { mobileNumber, newPassword } = req.body

    // Find user by mobile number
    const user = await User.findOne({ mobileNumber })
    if (!user) {
      return res.status(404).json({ message: 'User not found with this mobile number' })
    }

    // Create a new password change request
    const passwordChangeRequest = new PasswordChangeRequest({
      userId: user._id,
      userName: user.name,
      userMobile: user.mobileNumber,
      newPassword: newPassword,
      status: 'pending'
    })
    await passwordChangeRequest.save()

    res.json({
      message: 'Password change request submitted successfully. It will be reviewed by an administrator.',
      requestId: passwordChangeRequest._id
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/user/admin/user/:userId
// @desc    Get specific user details (admin only)
// @access  Private/Admin
router.get('/admin/user/:userId', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Convert to plain object and include password hash for admin
    const userObject = user.toObject()
    
    // Add a note about the password being hashed
    userObject.passwordNote = 'Password is stored as a secure hash and cannot be displayed in plain text'
    
    res.json({ user: userObject })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/user/admin/password-requests/:userId
// @desc    Get password change requests for a specific user (admin only)
// @access  Private/Admin
router.get('/admin/password-requests/:userId', requireAdmin, async (req, res) => {
  try {
    const requests = await PasswordChangeRequest.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })

    res.json({ requests })
  } catch (error) {
    console.error('Get password requests error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/user/admin/password-requests
// @desc    Get all password change requests (admin only)
// @access  Private/Admin
router.get('/admin/password-requests', requireAdmin, async (req, res) => {
  try {
    const requests = await PasswordChangeRequest.find()
      .sort({ createdAt: -1 })
      .limit(50) // Limit to recent 50 requests

    res.json({ requests })
  } catch (error) {
    console.error('Get all password requests error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/user/admin/password-requests/:requestId/approve
// @desc    Approve password change request (admin only)
// @access  Private/Admin
router.put('/admin/password-requests/:requestId/approve', requireAdmin, async (req, res) => {
  try {
    const request = await PasswordChangeRequest.findById(req.params.requestId)
    
    if (!request) {
      return res.status(404).json({ message: 'Password change request not found' })
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' })
    }

    // Update user's password
    const user = await User.findById(request.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.password = request.newPassword
    await user.save()

    // Update request status
    request.status = 'approved'
    request.approvedAt = new Date()
    request.approvedBy = req.user._id
    request.adminName = req.user.name
    await request.save()

    res.json({
      message: 'Password change request approved successfully',
      request
    })
  } catch (error) {
    console.error('Approve password request error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/user/admin/password-requests/:requestId/reject
// @desc    Reject password change request (admin only)
// @access  Private/Admin
router.put('/admin/password-requests/:requestId/reject', [
  requireAdmin,
  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Rejection reason must be between 1 and 200 characters')
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

    const request = await PasswordChangeRequest.findById(req.params.requestId)
    
    if (!request) {
      return res.status(404).json({ message: 'Password change request not found' })
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' })
    }

    // Update request status
    request.status = 'rejected'
    request.rejectionReason = req.body.rejectionReason || 'Request rejected by administrator'
    await request.save()

    res.json({
      message: 'Password change request rejected successfully',
      request
    })
  } catch (error) {
    console.error('Reject password request error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})



// @route   GET /api/user/bank-details
// @desc    Get user's bank details
// @access  Private
router.get('/bank-details', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('bankDetails')
    res.json({ bankDetails: user.bankDetails })
  } catch (error) {
    console.error('Get bank details error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/user/bank-details
// @desc    Update user's bank details
// @access  Private
router.put('/bank-details', [
  auth,
  body('accountHolderName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Account holder name must be between 1 and 100 characters'),
  body('accountNumber')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Account number must be between 1 and 50 characters'),
  body('confirmAccountNumber')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Confirm account number must be between 1 and 50 characters'),
  body('ifscCode')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('IFSC code must be between 1 and 20 characters'),
  body('bankName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Bank name must be between 1 and 100 characters')
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

    const { accountHolderName, accountNumber, confirmAccountNumber, ifscCode, bankName } = req.body

    // Validate that account numbers match
    if (accountNumber !== confirmAccountNumber) {
      return res.status(400).json({ message: 'Account numbers do not match' })
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        'bankDetails.accountHolderName': accountHolderName,
        'bankDetails.accountNumber': accountNumber,
        'bankDetails.confirmAccountNumber': confirmAccountNumber,
        'bankDetails.ifscCode': ifscCode,
        'bankDetails.bankName': bankName
      },
      { new: true, runValidators: true }
    ).select('bankDetails')

    res.json({
      message: 'Bank details updated successfully',
      bankDetails: user.bankDetails
    })
  } catch (error) {
    console.error('Update bank details error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/user/payment-details
// @desc    Get user's payment details
// @access  Private
router.get('/payment-details', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('paymentDetails')
    res.json({ paymentDetails: user.paymentDetails })
  } catch (error) {
    console.error('Get payment details error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/user/payment-details
// @desc    Update user's payment details
// @access  Private
router.put('/payment-details', [
  auth,
  body('paytm')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Paytm number must be a valid 10-digit mobile number'),
  body('phonepe')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('PhonePe number must be a valid 10-digit mobile number'),
  body('googlePay')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Google Pay number must be a valid 10-digit mobile number'),
  body('upiId')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('UPI ID must be between 1 and 50 characters')
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

    const updateData = {}
    
    if (req.body.paytm !== undefined) {
      updateData['paymentDetails.paytm'] = req.body.paytm
    }
    if (req.body.phonepe !== undefined) {
      updateData['paymentDetails.phonepe'] = req.body.phonepe
    }
    if (req.body.googlePay !== undefined) {
      updateData['paymentDetails.googlePay'] = req.body.googlePay
    }
    if (req.body.upiId !== undefined) {
      updateData['paymentDetails.upiId'] = req.body.upiId
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('paymentDetails')

    res.json({
      message: 'Payment details updated successfully',
      paymentDetails: user.paymentDetails
    })
  } catch (error) {
    console.error('Update payment details error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router  