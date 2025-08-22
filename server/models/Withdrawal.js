const mongoose = require('mongoose')

const withdrawalSchema = new mongoose.Schema({
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
  method: {
    type: String,
    required: [true, 'Withdrawal method is required'],
    enum: ['bank', 'phonepe', 'googlepay', 'paytm']
  },
  accountDetails: {
    type: String,
    required: [true, 'Account details are required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'completed', 'rejected'],
    default: 'pending'
  },
  transactionId: {
    type: String,
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
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Index for efficient queries
withdrawalSchema.index({ userId: 1, createdAt: -1 })
withdrawalSchema.index({ status: 1 })

// Virtual for formatted date
withdrawalSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// Pre-save middleware to update status timestamps
withdrawalSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'approved' && !this.approvedAt) {
      this.approvedAt = new Date()
    }
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date()
    }
  }
  next()
})

module.exports = mongoose.model('Withdrawal', withdrawalSchema)
