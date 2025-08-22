const mongoose = require('mongoose')

const gameRateSchema = new mongoose.Schema({
  singleDigit: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  jodiDigit: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  singlePana: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  doublePana: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  triplePana: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  halfSangam: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  fullSangam: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  }
}, { timestamps: true })

module.exports = mongoose.model('GameRate', gameRateSchema)
