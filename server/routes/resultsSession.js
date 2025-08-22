const express = require('express')
const { body, validationResult } = require('express-validator')
const { requireAdminOrSubAdmin, auth } = require('../middleware/auth')
const Game = require('../models/Game')
const Bet = require('../models/Bet')
const SessionResult = require('../models/SessionResult')
const GameRate = require('../models/GameRate')
const { payoutFromRate } = require('../utils/gameRates')
const { sumToDigit, buildJodi } = require('../utils/matka')

const router = express.Router()

// Normalize provided date to 00:00:00 local
function normalizeDate(d) {
  const dt = new Date(d)
  dt.setHours(0,0,0,0)
  return dt
}

// Declare a session result (Open/Close) with panna and optional digit (auto-computed if omitted)
router.post('/declare', requireAdminOrSubAdmin, [
  body('gameId').isString(),
  body('gameDate').isISO8601().toDate(),
  body('session').isIn(['open','close']),
  body('panna').matches(/^\d{3}$/),
  body('digit').optional().isInt({ min:0, max:9 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ message:'Validation failed', errors: errors.array() })

    const { gameId, session, panna } = req.body
    let { digit } = req.body
    const gameDate = normalizeDate(req.body.gameDate)

    const game = await Game.findById(gameId)
    if (!game) return res.status(404).json({ message:'Game not found' })

    digit = typeof digit === 'number' ? digit : sumToDigit(panna)

    const doc = await SessionResult.findOneAndUpdate(
      { gameId, gameDate, session },
      { gameId, gameName: game.gameName, gameDate, session, panna, digit, declaredBy: req.user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    // After declare, process bets that can be settled
    await settleBetsForGameDate(gameId, gameDate)

    res.json({ message:'Result declared', result: doc })
  } catch (err) {
    console.error('Declare session result error:', err)
    res.status(500).json({ message:'Server error' })
  }
})

// Get results for a date - accessible by all authenticated users
router.get('/', auth, async (req, res) => {
  try {
    const { gameId, date } = req.query
    const query = {}
    if (gameId) query.gameId = gameId
    if (date) query.gameDate = normalizeDate(date)
    const results = await SessionResult.find(query).sort({ gameDate:-1, session:1 })
    res.json({ results })
  } catch (err) {
    res.status(500).json({ message:'Server error' })
  }
})

async function getGlobalRates() {
  const rates = await GameRate.findOne().lean()
  return rates || null
}

async function settleBetsForGameDate(gameId, gameDate) {
  const rates = await getGlobalRates()
  if (!rates) return
  const results = await SessionResult.find({ gameId, gameDate }).lean()
  const open = results.find(r => r.session === 'open')
  const close = results.find(r => r.session === 'close')
  const haveOpen = !!open, haveClose = !!close

  const jodiString = haveOpen && haveClose ? buildJodi(open.digit, close.digit) : null

  const pending = await Bet.find({ gameId, gameDate, status:'pending' })
  for (const bet of pending) {
    let isWon = false
    let winAmount = 0
    const amount = bet.betAmount

    switch (bet.betType) {
      case 'single': {
        const sessionRes = bet.session === 'open' ? open : close
        if (sessionRes) {
          const rate = rates.singleDigit
          if (sessionRes.digit === Number(bet.betNumber)) {
            isWon = true
            winAmount = payoutFromRate(rate.min, rate.max, amount)
          }
          bet.result = `${sessionRes.panna}-${sessionRes.digit}`
        } else {
          continue // cannot settle yet
        }
        break
      }
      case 'singlePanna':
      case 'doublePanna':
      case 'triplePanna': {
        const sessionRes = bet.session === 'open' ? open : close
        if (sessionRes) {
          const rateMap = { singlePanna: rates.singlePana, doublePanna: rates.doublePana, triplePanna: rates.triplePana }
          const rate = rateMap[bet.betType]
          if (sessionRes.panna === bet.betNumber) {
            isWon = true
            winAmount = payoutFromRate(rate.min, rate.max, amount)
          }
          bet.result = `${sessionRes.panna}-${sessionRes.digit}`
        } else {
          continue
        }
        break
      }
      case 'jodi': {
        if (jodiString) {
          const rate = rates.jodiDigit
          if (jodiString === bet.betNumber) {
            isWon = true
            winAmount = payoutFromRate(rate.min, rate.max, amount)
          }
          bet.result = `${open.panna}-${open.digit}-${close.panna}-${close.digit}`
        } else {
          continue
        }
        break
      }
      case 'halfSangam': {
        // betNumber format: side|digit|panna where side=openDigitClosePanna or closeDigitOpenPanna
        if (haveOpen && haveClose) {
          const rate = rates.halfSangam
          const [side, digitStr, pannaStr] = bet.betNumber.split('|')
          let ok = false
          if (side === 'openDigitClosePanna') ok = (open.digit === Number(digitStr) && close.panna === pannaStr)
          if (side === 'closeDigitOpenPanna') ok = (close.digit === Number(digitStr) && open.panna === pannaStr)
          if (ok) {
            isWon = true
            winAmount = payoutFromRate(rate.min, rate.max, amount)
          }
          bet.result = `${open.panna}-${open.digit}/${close.panna}-${close.digit}`
        } else {
          continue
        }
        break
      }
      case 'fullSangam': {
        if (haveOpen && haveClose) {
          const rate = rates.fullSangam
          const [openP, closeP] = bet.betNumber.split('|')
          if (open.panna === openP && close.panna === closeP) {
            isWon = true
            winAmount = payoutFromRate(rate.min, rate.max, amount)
          }
          bet.result = `${open.panna}-${open.digit}/${close.panna}-${close.digit}`
        } else {
          continue
        }
        break
      }
      default:
        continue
    }

    bet.status = isWon ? 'won' : 'lost'
    bet.winAmount = isWon ? Math.round(winAmount) : 0
    bet.resultDate = new Date()
    await bet.save()
  }
}

module.exports = router
