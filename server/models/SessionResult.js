const mongoose = require('mongoose')

const sessionResultSchema = new mongoose.Schema({
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  gameName: { type: String, required: true },
  // Game day at 00:00:00 (local timezone)
  gameDate: { type: Date, required: true },
  session: { type: String, enum: ['open', 'close'], required: true },
  pana: { type: String, required: true, match: /^\d{3}$/ },
  digit: { type: Number, required: true, min: 0, max: 9 },
  declaredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true })

sessionResultSchema.index({ gameId: 1, gameDate: -1, session: 1 }, { unique: true })

module.exports = mongoose.model('SessionResult', sessionResultSchema)
