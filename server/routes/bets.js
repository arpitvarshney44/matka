const express = require('express')
const { body, validationResult } = require('express-validator')
const { auth } = require('../middleware/auth')
const Game = require('../models/Game')
const Bet = require('../models/Bet')
const GameRate = require('../models/GameRate')
const User = require('../models/User')
const { payoutFromRate } = require('../utils/gameRates')

const router = express.Router()
router.use(auth)

function normalizeDate(d) {
  const dt = new Date(d)
  dt.setHours(0,0,0,0)
  return dt
}

async function getRates() {
  const r = await GameRate.findOne().lean()
  return r
}

// Place a bet
router.post('/', [
  body('gameId').isString(),
  body('gameName').optional().isString(),
  body('betType').isIn(['single','jodi','singlePanna','doublePanna','triplePanna','halfSangam','fullSangam']),
  body('session').optional().isIn(['open','close',null]),
  body('gameDate').isISO8601().toDate(),
  body('betNumber').isString(),
  body('betAmount').isFloat({ gt: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ message:'Validation failed', errors: errors.array() })

    const { gameId, betType, betAmount } = req.body
    const session = req.body.session || null
    const gameDate = normalizeDate(req.body.gameDate)
    const game = await Game.findById(gameId)
    if (!game) return res.status(404).json({ message: 'Game not found' })

    // Check user balance first
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    
    const betAmountNum = Number(betAmount)
    if (user.balance < betAmountNum) {
      return res.status(400).json({ message: 'Insufficient balance' })
    }

    const rates = await getRates()
    if (!rates) return res.status(400).json({ message:'Game rates missing' })

    // Compute potential payout
    const rateMap = {
      single: rates.singleDigit,
      jodi: rates.jodiDigit,
      singlePanna: rates.singlePana,
      doublePanna: rates.doublePana,
      triplePanna: rates.triplePana,
      halfSangam: rates.halfSangam,
      fullSangam: rates.fullSangam
    }
    const rate = rateMap[betType]
    const potentialWin = Math.round(payoutFromRate(rate.min, rate.max, Number(betAmount)))

    const bet = new Bet({
      userId: req.user._id,
      gameId: game._id,
      gameName: game.gameName,
      betType,
      session,
      gameDate,
      betNumber: String(req.body.betNumber),
      betAmount: Number(betAmount),
      potentialWin
    })

    await bet.save()

    // Deduct bet amount from user balance
    user.balance -= betAmountNum
    await user.save()
    
    console.log(`Bet placed: User ${user.name} bet ₹${betAmountNum}, new balance: ₹${user.balance}`)

    res.status(201).json({ 
      message:'Bet placed successfully', 
      bet,
      newBalance: user.balance
    })
  } catch (err) {
    console.error('Place bet error:', err)
    res.status(500).json({ message:'Server error' })
  }
})

// Get my bets
router.get('/me', async (req, res) => {
  try {
    const { from, to } = req.query
    const query = { userId: req.user._id }
    if (from && to) {
      const f = normalizeDate(from)
      const t = normalizeDate(to)
      const t2 = new Date(t); t2.setDate(t2.getDate()+1)
      query.betDate = { $gte: f, $lt: t2 }
    }
    const bets = await Bet.find(query).sort({ betDate: -1 })
    res.json({ bets })
  } catch (err) {
    res.status(500).json({ message:'Server error' })
  }
})

module.exports = router
