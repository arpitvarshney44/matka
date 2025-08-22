const express = require('express')
const { body, validationResult } = require('express-validator')
const Withdrawal = require('../models/Withdrawal')
const User = require('../models/User')
const MainSettings = require('../models/MainSettings')
const { auth } = require('../middleware/auth')

const router = express.Router()

// @route   POST /api/withdraw/request
// @desc    Create a withdrawal request
// @access  Private
router.post('/request', [
  auth,
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than 0'),
  body('method')
    .isIn(['bank', 'phonepe', 'googlepay', 'paytm'])
    .withMessage('Invalid withdrawal method')
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

    const { amount, method } = req.body
    const userId = req.user._id

    // Get user details
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Get main settings
    const settings = await MainSettings.findOne()
    const minWithdraw = settings?.minimumWithdraw || 1000

    // Validate minimum withdrawal amount
    if (amount < minWithdraw) {
      return res.status(400).json({ 
        message: `Minimum withdrawal amount is ₹${minWithdraw}` 
      })
    }

    // Check user balance
    if (amount > user.balance) {
      return res.status(400).json({ message: 'Insufficient balance' })
    }

    // Check withdrawal time (basic check - can be enhanced)
    const now = new Date()
    if (now.getDay() === 0) { // Sunday
      return res.status(400).json({ 
        message: 'Withdrawals are closed on Sundays' 
      })
    }

    // Get account details based on method
    let accountDetails = ''
    
    switch (method) {
      case 'bank':
        if (!user.bankDetails?.accountNumber || !user.bankDetails?.accountHolderName || 
            !user.bankDetails?.ifscCode || !user.bankDetails?.bankName) {
          return res.status(400).json({ 
            message: 'Please complete your bank account details first' 
          })
        }
        accountDetails = `${user.bankDetails.bankName} - ${user.bankDetails.accountNumber} (${user.bankDetails.accountHolderName})`
        break
      
      case 'phonepe':
        if (!user.paymentDetails?.phonepe) {
          return res.status(400).json({ 
            message: 'Please add your PhonePe number first' 
          })
        }
        accountDetails = user.paymentDetails.phonepe
        break
      
      case 'googlepay':
        if (!user.paymentDetails?.googlePay) {
          return res.status(400).json({ 
            message: 'Please add your Google Pay number first' 
          })
        }
        accountDetails = user.paymentDetails.googlePay
        break
      
      case 'paytm':
        if (!user.paymentDetails?.paytm) {
          return res.status(400).json({ 
            message: 'Please add your Paytm number first' 
          })
        }
        accountDetails = user.paymentDetails.paytm
        break
      
      default:
        return res.status(400).json({ message: 'Invalid withdrawal method' })
    }

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      userId,
      amount,
      method,
      accountDetails,
      status: 'pending'
    })

    await withdrawal.save()

    res.status(201).json({
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        _id: withdrawal._id,
        amount: withdrawal.amount,
        method: withdrawal.method,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt
      }
    })

  } catch (error) {
    console.error('Withdrawal request error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/withdraw/history
// @desc    Get user's withdrawal history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user._id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const withdrawals = await Withdrawal.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await Withdrawal.countDocuments({ userId })

    res.json({
      withdrawals,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Get withdrawal history error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/withdraw/admin/pending
// @desc    Get all pending withdrawal requests (Admin only)
// @access  Private (Admin)
router.get('/admin/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const withdrawals = await Withdrawal.find({ status: 'pending' })
      .populate('userId', 'name mobileNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await Withdrawal.countDocuments({ status: 'pending' })

    res.json({
      withdrawals,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Get pending withdrawals error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/withdraw/admin/all
// @desc    Get all withdrawal requests (Admin only)
// @access  Private (Admin)
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    const status = req.query.status

    let query = {}
    if (status && ['pending', 'approved', 'processing', 'completed', 'rejected'].includes(status)) {
      query.status = status
    }

    const withdrawals = await Withdrawal.find(query)
      .populate('userId', 'name mobileNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await Withdrawal.countDocuments(query)

    res.json({
      withdrawals,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Get all withdrawals error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/withdraw/admin/:id/status
// @desc    Update withdrawal status (Admin only)
// @access  Private (Admin)
router.put('/admin/:id/status', [
  auth,
  body('status')
    .isIn(['pending', 'approved', 'processing', 'completed', 'rejected'])
    .withMessage('Invalid status'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks must be less than 500 characters'),
  body('transactionId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Transaction ID must be less than 100 characters')
], async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const withdrawalId = req.params.id
    const { status, remarks, transactionId } = req.body

    const withdrawal = await Withdrawal.findById(withdrawalId)
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal request not found' })
    }

    // If approving withdrawal, deduct from user balance
    if (status === 'approved' && withdrawal.status === 'pending') {
      const user = await User.findById(withdrawal.userId)
      if (user.balance < withdrawal.amount) {
        return res.status(400).json({ message: 'User has insufficient balance' })
      }
      
      // Deduct amount from user balance
      user.balance -= withdrawal.amount
      await user.save()
    }

    // If rejecting a previously approved withdrawal, add back to user balance
    if (status === 'rejected' && withdrawal.status === 'approved') {
      const user = await User.findById(withdrawal.userId)
      user.balance += withdrawal.amount
      await user.save()
    }

    // Update withdrawal
    withdrawal.status = status
    withdrawal.approvedBy = req.user._id
    if (remarks) withdrawal.remarks = remarks
    if (transactionId) withdrawal.transactionId = transactionId

    await withdrawal.save()

    res.json({
      message: 'Withdrawal status updated successfully',
      withdrawal
    })

  } catch (error) {
    console.error('Update withdrawal status error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
