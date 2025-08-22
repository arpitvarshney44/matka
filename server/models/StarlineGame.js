const mongoose = require('mongoose')

const starlineGameSchema = new mongoose.Schema({
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
  isActive: {
    type: Boolean,
    default: true
  },
  openTime: {
    type: String,
    required: [true, 'Open time is required'],
    // Format: "HH:MM" (24-hour)
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v)
      },
      message: 'Open time must be in HH:MM format'
    }
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Indexes for efficient queries
starlineGameSchema.index({ gameName: 1 })
starlineGameSchema.index({ isActive: 1 })
starlineGameSchema.index({ createdBy: 1 })
starlineGameSchema.index({ openTime: 1 })

// Instance method to check if game is currently open
starlineGameSchema.methods.isCurrentlyOpen = function() {
  const now = new Date()
  const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
  
  // Check if game is active
  if (!this.isActive) return false
  
  // Starline games are open from start of day (00:00) until open time, then closed
  const currentTotalMinutes = parseInt(currentTime.split(':')[0]) * 60 + parseInt(currentTime.split(':')[1])
  const openTotalMinutes = parseInt(this.openTime.split(':')[0]) * 60 + parseInt(this.openTime.split(':')[1])
  
  return currentTotalMinutes <= openTotalMinutes
}

// Static method to get active games
starlineGameSchema.statics.getActiveGames = function() {
  return this.find({ isActive: true }).sort({ openTime: 1 })
}

module.exports = mongoose.model('StarlineGame', starlineGameSchema)