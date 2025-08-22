const express = require('express')
const { body, validationResult } = require('express-validator')
const FundRequest = require('../models/FundRequest')
const User = require('../models/User')
const MainSettings = require('../models/MainSettings')
const { auth } = require('../middleware/auth')

const router = express.Router()

// @route   POST /api/fund-request/create
// @desc    Create a fund request (User)
// @access  Private
router.post('/create', [
  auth,
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than 0'),
  body('paymentMethod')
    .isIn(['UPI', 'QR', 'Bank Transfer', 'Other'])
    .withMessage('Invalid payment method'),
  body('transactionId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Transaction ID is required')
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

    const { amount, paymentMethod, transactionId, proofOfPayment } = req.body
    const userId = req.user._id

    // Get user details
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Get main settings
    const settings = await MainSettings.findOne()
    const minDeposit = settings?.minimumDeposit || 1

    // Validate minimum deposit amount
    if (amount < minDeposit) {
      return res.status(400).json({ 
        message: `Minimum deposit amount is ₹${minDeposit}` 
      })
    }

    // Check for duplicate transaction ID
    const existingRequest = await FundRequest.findOne({ transactionId })
    if (existingRequest) {
      return res.status(400).json({ 
        message: 'Transaction ID already exists. Please use a unique transaction ID.' 
      })
    }

    // Create fund request
    const fundRequest = new FundRequest({
      userId,
      amount,
      paymentMethod,
      transactionId,
      proofOfPayment,
      status: 'pending'
    })

    await fundRequest.save()

    res.status(201).json({
      success: true,
      message: 'Fund request submitted successfully. Please wait for admin approval.',
      request: {
        _id: fundRequest._id,
        requestId: fundRequest.requestId,
        amount: fundRequest.amount,
        paymentMethod: fundRequest.paymentMethod,
        status: fundRequest.status,
        createdAt: fundRequest.createdAt
      }
    })

  } catch (error) {
    console.error('Fund request creation error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/fund-request/history
// @desc    Get user's fund request history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user._id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const requests = await FundRequest.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await FundRequest.countDocuments({ userId })

    res.json({
      success: true,
      requests,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Get fund request history error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
