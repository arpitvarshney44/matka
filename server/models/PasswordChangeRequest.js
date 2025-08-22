const mongoose = require('mongoose')

const passwordChangeRequestSchema = new mongoose.Schema({
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
  newPassword: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminConfig',
    default: null
  },
  adminName: {
    type: String,
    default: null
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('PasswordChangeRequest', passwordChangeRequestSchema) 