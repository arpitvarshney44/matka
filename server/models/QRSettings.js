const mongoose = require('mongoose')

const qrSettingsSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'QR Code'
  },
  description: {
    type: String,
    default: ''
  },
  imagePath: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Update the updatedAt field before saving
qrSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model('QRSettings', qrSettingsSchema) 