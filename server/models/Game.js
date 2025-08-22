const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
  gameName: {
    type: String,
    required: [true, 'Game name is required'],
    trim: true,
    unique: true
  },
  gameNameHindi: {
    type: String,
    trim: true
  },
  gameType: {
    type: String,
    enum: ['standard', 'custom'],
    default: 'standard'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  openTime: {
    type: String,
    required: [true, 'Open time is required'],
    // Format: "HH:MM" (24-hour)
  },
  closeTime: {
    type: String,
    required: [true, 'Close time is required'],
    // Format: "HH:MM" (24-hour)
  },
  resultTime: {
    type: String,
    required: false,
    // Format: "HH:MM" (24-hour)
  },
  gameRates: {
    single: { type: Number, default: 9.5 },
    jodi: { type: Number, default: 95 },
    panna: { type: Number, default: 1500 },
    halfSangam: { type: Number, default: 10000 },
    fullSangam: { type: Number, default: 100000 }
  },
  todayResult: {
    type: String,
    default: null
  },
  yesterdayResult: {
    type: String,
    default: null
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schedule: {
    type: [
      {
        day: { type: String, required: true }, // e.g. "Monday"
        openTime: { type: String, required: true },
        closeTime: { type: String, required: true },
        isActive: { type: Boolean, default: true }
      }
    ],
    required: true
  }
}, {
  timestamps: true
})

// Index for efficient queries
gameSchema.index({ gameName: 1 })
gameSchema.index({ gameType: 1 })
gameSchema.index({ isActive: 1 })

module.exports = mongoose.model('Game', gameSchema) 