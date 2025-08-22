const mongoose = require('mongoose')

const fundRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [1, 'Amount must be greater than 0']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['UPI', 'QR', 'Bank Transfer', 'Other']
  },
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
    trim: true
  },
  requestId: {
    type: String,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  proofOfPayment: {
    type: String, // URL to uploaded payment proof if any
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Index for efficient queries
fundRequestSchema.index({ userId: 1, createdAt: -1 })
fundRequestSchema.index({ status: 1 })
fundRequestSchema.index({ requestId: 1 })

// Auto-generate requestId before saving
fundRequestSchema.pre('save', function(next) {
  if (!this.requestId) {
    // Generate a unique request ID like "FR" + timestamp + random
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    this.requestId = `FR${timestamp}${random}`
  }
  
  // Update status timestamps
  if (this.isModified('status')) {
    if (this.status === 'approved' && !this.approvedAt) {
      this.approvedAt = new Date()
    }
    if (this.status === 'rejected' && !this.rejectedAt) {
      this.rejectedAt = new Date()
    }
  }
  next()
})

// Virtual for formatted date
fundRequestSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

module.exports = mongoose.model('FundRequest', fundRequestSchema)
