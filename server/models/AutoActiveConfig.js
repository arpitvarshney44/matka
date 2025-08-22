const mongoose = require('mongoose')

const autoActiveConfigSchema = new mongoose.Schema({
  mode: {
    type: String,
    enum: ['AUTO', 'MANUAL'],
    default: 'MANUAL',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    default: 'Admin'
  }
}, { timestamps: true })

module.exports = mongoose.model('AutoActiveConfig', autoActiveConfigSchema) 