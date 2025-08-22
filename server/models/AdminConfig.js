const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const adminConfigSchema = new mongoose.Schema({
  adminName: {
    type: String,
    required: true,
    default: 'Admin'
  },
  mobileNumber: {
    type: String,
    required: true,
    default: '7665007800'
  },
  password: {
    type: String,
    required: true,
    default: 'admin123'
  },
  upiId: {
    type: String,
    required: true,
    default: '787794312@kbl'
  },
  email: {
    type: String,
    required: true,
    default: 'admin@gmail.com'
  },
  role: {
    type: String,
    enum: ['admin'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
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

// Hash password before saving
adminConfigSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10)
  }
  next()
})

// Method to compare password
adminConfigSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('AdminConfig', adminConfigSchema) 