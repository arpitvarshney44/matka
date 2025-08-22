const express = require('express')
const { body, validationResult } = require('express-validator')
const router = express.Router()

// Models
const StarlineResult = require('../models/StarlineResult')
const StarlineGame = require('../models/StarlineGame')
const StarlineBet = require('../models/StarlineBet')
const StarlineGameRate = require('../models/StarlineGameRate')
const User = require('../models/User')

// Middleware
const { requireAdminOrSubAdmin } = require('../middleware/auth')

/**
 * @route   POST /api/starline/results
 * @desc    Declare a new Starline result and process payouts
 * @access  Admin only
 */
router.post('/', requireAdminOrSubAdmin, [
  body('gameId').isString().withMessage('Game ID is required'),
  body('winningNumber').matches(/^\d{3}$/).withMessage('Winning number must be 3 digits'),
  body('gameDate').optional().isISO8601().withMessage('Game date must be valid')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { gameId, winningNumber, gameDate } = req.body
    const declaredBy = req.user._id

    // Set game date to today if not provided
    const resultDate = gameDate ? new Date(gameDate) : new Date()
    resultDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(resultDate)
    nextDay.setDate(nextDay.getDate() + 1)

    // Check if game exists
    const game = await StarlineGame.findById(gameId)
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      })
    }

    // Check if result already exists for this game and date
    const existingResult = await StarlineResult.findOne({
      gameId,
      gameDate: resultDate
    })

    if (existingResult) {
      return res.status(400).json({
        success: false,
        message: 'Result already declared for this game on this date'
      })
    }

    // Get all pending bets for this game and date
    const pendingBets = await StarlineBet.find({
      gameId,
      createdAt: { $gte: resultDate, $lt: nextDay },
      status: 'pending'
    }).populate('userId')

    // Allow result declaration even if no pending bets
    if (pendingBets.length === 0) {
        console.log('No pending bets found, but allowing result declaration')
    }

    // Get starline rates for payout calculation
    const rates = await StarlineGameRate.findOne()
    const defaultRates = {
      singleDigit: { min: 9, max: 9.5 },
      singlePana: { min: 140, max: 150 },
      doublePana: { min: 280, max: 300 },
      triplePana: { min: 700, max: 800 }
    }
    const gameRates = rates || defaultRates

    // Process each bet and calculate payouts
    let totalBets = pendingBets.length
    let totalBetAmount = 0
    let totalPayout = 0
    let winningBets = 0

    const betTypeBreakdown = {
      'single digit': { totalBets: 0, winningBets: 0, totalBetAmount: 0, totalPayout: 0 },
      'single pana': { totalBets: 0, winningBets: 0, totalBetAmount: 0, totalPayout: 0 },
      'double pana': { totalBets: 0, winningBets: 0, totalBetAmount: 0, totalPayout: 0 },
      'triple pana': { totalBets: 0, winningBets: 0, totalBetAmount: 0, totalPayout: 0 }
    }

    // Process bets without transactions
    for (const bet of pendingBets) {
      totalBetAmount += bet.betAmount

      // Update bet type breakdown
      if (betTypeBreakdown[bet.betType]) {
        betTypeBreakdown[bet.betType].totalBets++
        betTypeBreakdown[bet.betType].totalBetAmount += bet.betAmount
      }

      // Check if bet wins
      let isWinner = false
      let winAmount = 0
      let multiplier = 0

      switch (bet.betType) {
        case 'single digit':
          // Check if the last digit of winning number matches bet number
          isWinner = winningNumber.slice(-1) === bet.betNumber
          if (isWinner) {
            multiplier = gameRates.singleDigit?.max || 9.5
            winAmount = bet.betAmount * multiplier
          }
          break

        case 'single pana':
        case 'double pana':
        case 'triple pana':
          isWinner = winningNumber === bet.betNumber
          if (isWinner) {
            const rateMap = {
              'single pana': gameRates.singlePana?.max || 150,
              'double pana': gameRates.doublePana?.max || 300,
              'triple pana': gameRates.triplePana?.max || 800
            }
            multiplier = rateMap[bet.betType]
            winAmount = bet.betAmount * multiplier
          }
          break
      }

      // Update bet status
      bet.status = isWinner ? 'won' : 'lost'
      bet.winAmount = isWinner ? Math.round(winAmount) : 0
      bet.resultDate = new Date()
      bet.result = winningNumber

      // Update user balance if bet won
      if (isWinner && winAmount > 0) {
        const user = await User.findById(bet.userId._id)
        if (user) {
          user.balance += Math.round(winAmount)
          await user.save()
          totalPayout += Math.round(winAmount)
          winningBets++

          // Update bet type breakdown
          if (betTypeBreakdown[bet.betType]) {
            betTypeBreakdown[bet.betType].winningBets++
            betTypeBreakdown[bet.betType].totalPayout += Math.round(winAmount)
          }
        }
      }

      // Save the updated bet
      await bet.save()
    }

    // Create the result record
    const newResult = new StarlineResult({
      gameId,
      gameName: game.gameName,
      gameDate: resultDate,
      winningNumber,
      declaredBy,
      totalBets,
      totalBetAmount,
      totalPayout,
      winningBets,
      betTypeBreakdown,
      status: 'completed',
      declaredAt: new Date()
    })

    const savedResult = await newResult.save()

    // Result is stored in the StarlineResult collection (same as regular games use SessionResult)

    res.status(201).json({
      success: true,
      message: 'Result declared and payouts processed successfully',
      data: {
        result: savedResult,
        summary: {
          totalBetsProcessed: totalBets,
          totalBetAmount,
          totalPayout,
          winningBets,
          profitLoss: totalBetAmount - totalPayout,
          winPercentage: totalBets > 0 ? ((winningBets / totalBets) * 100).toFixed(2) : 0
        }
      }
    })

  } catch (error) {
    console.error('Declare starline result error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while declaring result',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

/**
 * @route   GET /api/starline/results
 * @desc    Get Starline results with filtering
 * @access  Public (for recent results), Admin (for all results)
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      gameId,
      startDate,
      endDate
    } = req.query

    const isAdmin = req.user && ['admin', 'subadmin'].includes(req.user.role)

    // Build query
    let query = { status: 'completed' }

    if (gameId) {
      query.gameId = gameId
    }

    if (startDate && endDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      
      query.gameDate = {
        $gte: start,
        $lte: end
      }
      console.log('Date filter applied:', { start, end, query: query.gameDate }) // Debug log
    } else if (!isAdmin) {
      // Non-admin users only see last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      query.gameDate = { $gte: thirtyDaysAgo }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Execute query
    console.log('Starline results query:', JSON.stringify(query, null, 2)) // Debug log
    const results = await StarlineResult.find(query)
      .populate('gameId', 'gameName gameType')
      .populate('declaredBy', 'name')
      .sort({ gameDate: -1, declaredAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await StarlineResult.countDocuments(query)
    console.log('Starline results found:', results.length, 'total:', total) // Debug log

    res.json({
      success: true,
      data: {
        results,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    })

  } catch (error) {
    console.error('Get starline results error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching results'
    })
  }
})

/**
 * @route   GET /api/starline/results/:id
 * @desc    Get specific result details
 * @access  Public (basic info), Admin (full details)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const isAdmin = req.user && ['admin', 'subadmin'].includes(req.user.role)

    const result = await StarlineResult.findById(id)
      .populate('gameId', 'gameName gameType')
      .populate('declaredBy', 'name')

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      })
    }

    // Return limited info for non-admin users
    if (!isAdmin) {
      const publicResult = {
        _id: result._id,
        gameId: result.gameId,
        gameName: result.gameName,
        gameDate: result.gameDate,
        winningNumber: result.winningNumber,
        declaredAt: result.declaredAt
      }

      return res.json({
        success: true,
        data: publicResult
      })
    }

    res.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Get starline result error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching result'
    })
  }
})

/**
 * @route   GET /api/starline/results/game/:gameId/recent
 * @desc    Get recent results for a specific game
 * @access  Public
 */
router.get('/game/:gameId/recent', async (req, res) => {
  try {
    const { gameId } = req.params
    const { limit = 10 } = req.query

    // Check if game exists
    const game = await StarlineGame.findById(gameId)
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      })
    }

    // Get recent results
    const results = await StarlineResult.find({
      gameId,
      status: 'completed'
    })
      .select('gameDate winningNumber declaredAt')
      .sort({ gameDate: -1, declaredAt: -1 })
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: {
        game: {
          _id: game._id,
          gameName: game.gameName,
          gameType: game.gameType
        },
        results
      }
    })

  } catch (error) {
    console.error('Get game recent results error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recent results'
    })
  }
})

module.exports = router