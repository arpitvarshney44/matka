const mongoose = require('mongoose')

const starlineBetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StarlineGame',
    required: true
  },
  gameName: {
    type: String,
    required: true
  },
  betType: {
    type: String,
    enum: ['single digit', 'single pana', 'double pana', 'triple pana'],
    required: true
  },
  betNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Validate based on bet type
        if (this.betType === 'single digit') {
          return /^[0-9]$/.test(v) // Single digit 0-9
        } else if (this.betType === 'single pana') {
          return /^[0-9]{3}$/.test(v) // Three digits 000-999
        } else if (this.betType === 'double pana') {
          return /^[0-9]{3}$/.test(v) // Three digits 000-999
        } else if (this.betType === 'triple pana') {
          return /^[0-9]{3}$/.test(v) // Three digits 000-999
        }
        return false
      },
      message: 'Invalid bet number format for the selected bet type'
    }
  },
  betAmount: {
    type: Number,
    required: true,
    min: [1, 'Bet amount must be at least 1']
  },
  potentialWin: {
    type: Number,
    required: true,
    min: [0, 'Potential win cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'won', 'lost', 'cancelled'],
    default: 'pending'
  },
  gameDate: {
    type: Date,
    required: true,
    default: function() {
      // Set to today's date at 00:00:00
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return today
    }
  },
  result: {
    type: String,
    default: null
  },
  winAmount: {
    type: Number,
    default: 0,
    min: [0, 'Win amount cannot be negative']
  },
  betDate: {
    type: Date,
    default: Date.now
  },
  resultDate: {
    type: Date,
    default: null
  },
  // Additional fields for audit and tracking
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  // Admin modifications log
  adminModifications: [{
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    action: {
      type: String,
      required: true
    },
    originalBetNumber: String,
    newBetNumber: String,
    originalStatus: String,
    originalWinAmount: Number,
    reason: String
  }]
}, {
  timestamps: true
})

// Pre-save validation
starlineBetSchema.pre('save', function(next) {
  // Ensure potential win is calculated correctly
  if (this.isNew && this.potentialWin <= this.betAmount) {
    return next(new Error('Potential win must be greater than bet amount'))
  }
  
  // If status is won, ensure winAmount is set
  if (this.status === 'won' && this.winAmount <= 0) {
    return next(new Error('Win amount must be greater than 0 for won bets'))
  }
  
  // If status is won or lost, ensure result is set
  if ((this.status === 'won' || this.status === 'lost') && !this.result) {
    return next(new Error('Result must be set for completed bets'))
  }
  
  next()
})

// Indexes for efficient queries
starlineBetSchema.index({ userId: 1, betDate: -1 })
starlineBetSchema.index({ gameId: 1, betDate: -1 })
starlineBetSchema.index({ gameId: 1, gameDate: -1 })
starlineBetSchema.index({ status: 1 })
starlineBetSchema.index({ betDate: -1 })
starlineBetSchema.index({ gameDate: -1 })
starlineBetSchema.index({ userId: 1, status: 1 })
starlineBetSchema.index({ gameName: 1, gameDate: -1 })

// Instance method to check if bet is a winner
starlineBetSchema.methods.checkWin = function(winningNumber) {
  if (!winningNumber || !this.betNumber) return false
  
  // Convert to strings to ensure consistent comparison
  const betNumberStr = String(this.betNumber).trim()
  const winningNumberStr = String(winningNumber).trim()
  
  switch (this.betType) {
    case 'single digit':
      // For single digit, check if the last digit of winning number matches
      return winningNumberStr.slice(-1) === betNumberStr
    case 'single pana':
      // For single pana, check exact match
      return winningNumberStr === betNumberStr
    case 'double pana':
      // For double pana, check exact match
      return winningNumberStr === betNumberStr
    case 'triple pana':
      // For triple pana, check exact match
      return winningNumberStr === betNumberStr
    default:
      return false
  }
}

// Instance method to calculate win amount based on rate
starlineBetSchema.methods.calculateWinAmount = function(rate) {
  if (!rate || rate <= 0) return 0
  return this.betAmount * rate
}

// Static method to get bets by game and date
starlineBetSchema.statics.getBetsByGameAndDate = function(gameId, gameDate) {
  const startDate = new Date(gameDate)
  startDate.setHours(0, 0, 0, 0)
  
  const endDate = new Date(gameDate)
  endDate.setHours(23, 59, 59, 999)
  
  return this.find({
    gameId: gameId,
    gameDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('userId', 'username email')
}

// Static method to get user betting statistics
starlineBetSchema.statics.getUserStats = function(userId, startDate, endDate) {
  const matchConditions = { userId: userId }
  
  if (startDate && endDate) {
    matchConditions.betDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }
  
  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBetAmount: { $sum: '$betAmount' },
        totalWinAmount: { $sum: '$winAmount' }
      }
    }
  ])
}

module.exports = mongoose.model('StarlineBet', starlineBetSchema)