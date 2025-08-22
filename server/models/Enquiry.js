const mongoose = require('mongoose')

const enquirySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userMobile: {
    type: String,
    required: true
  },
  messages: [{
    sender: {
      type: String,
      enum: ['user', 'admin'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  isReadByAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Index for efficient querying
enquirySchema.index({ userId: 1, lastMessageAt: -1 })
enquirySchema.index({ status: 1, lastMessageAt: -1 })

module.exports = mongoose.model('Enquiry', enquirySchema) 