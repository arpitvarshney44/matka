const mongoose = require('mongoose')

const betSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  gameName: {
    type: String,
    required: true
  },
  // 'single' (digit), 'jodi' (pair), 'singlePanna', 'doublePanna', 'triplePanna', 'halfSangam', 'fullSangam'
  betType: {
    type: String,
    enum: ['single', 'jodi', 'singlePanna', 'doublePanna', 'triplePanna', 'halfSangam', 'fullSangam'],
    required: true
  },
  // For session-bound bets (single and pannas, half sangam), store session
  session: {
    type: String,
    enum: ['open', 'close', null],
    default: null
  },
  // Game day at 00:00:00 (local timezone)
  gameDate: {
    type: Date,
    required: true
  },
  // For simple types, store the picked number/panna as string; for sangam, pack a descriptor
  betNumber: {
    type: String,
    required: true
  },
  betAmount: {
    type: Number,
    required: true,
    min: [1, 'Bet amount must be at least 1']
  },
  potentialWin: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'won', 'lost', 'cancelled'],
    default: 'pending'
  },
  // Raw resolved result reference (useful for audits)
  result: {
    type: String,
    default: null
  },
  winAmount: {
    type: Number,
    default: 0
  },
  betDate: {
    type: Date,
    default: Date.now
  },
  resultDate: {
    type: Date,
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

// Indexes for efficient queries
betSchema.index({ userId: 1, betDate: -1 })
betSchema.index({ gameId: 1, betDate: -1 })
betSchema.index({ status: 1 })
betSchema.index({ betDate: -1 })
betSchema.index({ gameId: 1, gameDate: -1 })

module.exports = mongoose.model('Bet', betSchema) 
