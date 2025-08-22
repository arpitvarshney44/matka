const mongoose = require('mongoose')

const contactSettingsSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: true,
    default: '766500780'
  },
  email: {
    type: String,
    required: true,
    default: 'rajkumar@projectgaming.in'
  },
  whatsappNumber: {
    type: String,
    required: true,
    default: '91766500780'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    default: 'Admin'
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('ContactSettings', contactSettingsSchema) 