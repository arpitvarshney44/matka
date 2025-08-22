const mongoose = require('mongoose')

const mainSettingsSchema = new mongoose.Schema({
  // Account Details
  accountHolderName: {
    type: String,
    default: 'Raj Kumar'
  },
  accountNumber: {
    type: String,
    default: '112233445566778899'
  },
  ifscCode: {
    type: String,
    default: 'PYTM01234'
  },

  // Contact Settings
  whatsappNumber: {
    type: String,
    default: '91766500780'
  },
  phoneNumber: {
    type: String,
    default: '766500780'
  },

  // UPI Settings
  upiId: {
    type: String,
    default: '787794312@kbl'
  },
  phonepeUpi: {
    type: String,
    default: '918000449710'
  },
  gpayUpi: {
    type: String,
    default: '918000449710'
  },
  paytmUpi: {
    type: String,
    default: '918000449710'
  },

  // App Settings
  appLink: {
    type: String,
    default: 'https://play.google.com/store/apps/details?id=com.superstar.starkalyan'
  },
  shareMessage: {
    type: String,
    default: 'Hey there, I\'m using this amazing app!'
  },

  // Game Settings
  minimumBid: {
    type: Number,
    default: 10
  },
  minimumWithdraw: {
    type: Number,
    default: 1000
  },
  minimumDeposit: {
    type: Number,
    default: 1
  },
  userStartingBalance: {
    type: Number,
    default: 0
  },

  // Withdrawal Time Settings
  withdrawalOpenTime: {
    type: String,
    default: '6:00 AM'
  },
  withdrawalCloseTime: {
    type: String,
    default: '9:10 AM'
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
mainSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model('MainSettings', mainSettingsSchema) 