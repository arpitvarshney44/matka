const express = require('express')
const { body, validationResult } = require('express-validator')
const { requireAdminOrSubAdmin, requireAdmin } = require('../middleware/auth')
const User = require('../models/User')
const Game = require('../models/Game')
const Bet = require('../models/Bet')
const StarlineBet = require('../models/StarlineBet')
const StarlineGame = require('../models/StarlineGame')
const FundRequest = require('../models/FundRequest')
const Withdrawal = require('../models/Withdrawal')
const SessionResult = require('../models/SessionResult')
const GameRate = require('../models/GameRate')
const { payoutFromRate } = require('../utils/gameRates')
const { sumToDigit, buildJodi } = require('../utils/matka')

const router = express.Router()

// All routes require admin or subadmin authentication
router.use(requireAdminOrSubAdmin)

// Log admin access
router.use((req, res, next) => {
  console.log(`Admin access: ${req.method} ${req.path} by ${req.user.name} (${req.user.mobileNumber})`)
  next()
})

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get statistics (including both regular and starline)
    const totalUsers = await User.countDocuments({ role: 'user' })
    const activeUsers = await User.countDocuments({ role: 'user', isActive: true })
    const inactiveUsers = totalUsers - activeUsers

    // Total games (regular + starline)
    const totalRegularGames = await Game.countDocuments()
    const totalStarlineGames = await StarlineGame.countDocuments()
    const totalGames = totalRegularGames + totalStarlineGames

    const activeRegularGames = await Game.countDocuments({ isActive: true })
    const activeStarlineGames = await StarlineGame.countDocuments({ isActive: true })
    const activeGames = activeRegularGames + activeStarlineGames

    // Total bets (regular + starline)
    const totalRegularBets = await Bet.countDocuments()
    const totalStarlineBets = await StarlineBet.countDocuments()
    const totalBets = totalRegularBets + totalStarlineBets

    const todayRegularBets = await Bet.countDocuments({
      betDate: { $gte: today, $lt: tomorrow }
    })
    const todayStarlineBets = await StarlineBet.countDocuments({
      betDate: { $gte: today, $lt: tomorrow }
    })
    const todayBets = todayRegularBets + todayStarlineBets

    // Get today's withdrawals amount
    const todayWithdrawalsResult = await Withdrawal.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ])
    const todayWithdrawals = todayWithdrawalsResult[0]?.total || 0
    const todayWithdrawalsCount = todayWithdrawalsResult[0]?.count || 0

    // Calculate revenue - get today's bet amounts (regular + starline)
    const todayRegularBetAmount = await Bet.aggregate([
      { $match: { betDate: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, total: { $sum: '$betAmount' } } }
    ])

    const todayStarlineBetAmount = await StarlineBet.aggregate([
      { $match: { betDate: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, total: { $sum: '$betAmount' } } }
    ])

    const todayTotalBetAmount = (todayRegularBetAmount[0]?.total || 0) + (todayStarlineBetAmount[0]?.total || 0)

    const todayRegularWinAmount = await Bet.aggregate([
      { $match: { betDate: { $gte: today, $lt: tomorrow }, status: 'won' } },
      { $group: { _id: null, total: { $sum: '$winAmount' } } }
    ])

    const todayStarlineWinAmount = await StarlineBet.aggregate([
      { $match: { betDate: { $gte: today, $lt: tomorrow }, status: 'won' } },
      { $group: { _id: null, total: { $sum: '$winAmount' } } }
    ])

    const todayTotalWinAmount = (todayRegularWinAmount[0]?.total || 0) + (todayStarlineWinAmount[0]?.total || 0)

    // Calculate today's profit: Bet Amount - Win Amount - Withdrawal Amount
    const todayProfit = todayTotalBetAmount - todayTotalWinAmount - todayWithdrawals

    // Also calculate total revenue for stats (regular + starline)
    const totalRegularBetAmount = await Bet.aggregate([
      { $group: { _id: null, total: { $sum: '$betAmount' } } }
    ])

    const totalStarlineBetAmount = await StarlineBet.aggregate([
      { $group: { _id: null, total: { $sum: '$betAmount' } } }
    ])

    const totalCombinedBetAmount = (totalRegularBetAmount[0]?.total || 0) + (totalStarlineBetAmount[0]?.total || 0)

    const totalRegularWinAmount = await Bet.aggregate([
      { $match: { status: 'won' } },
      { $group: { _id: null, total: { $sum: '$winAmount' } } }
    ])

    const totalStarlineWinAmount = await StarlineBet.aggregate([
      { $match: { status: 'won' } },
      { $group: { _id: null, total: { $sum: '$winAmount' } } }
    ])

    const totalCombinedWinAmount = (totalRegularWinAmount[0]?.total || 0) + (totalStarlineWinAmount[0]?.total || 0)

    const revenue = totalCombinedBetAmount - totalCombinedWinAmount

    // Get recent activities
    const recentBets = await Bet.find()
      .populate('userId', 'name mobileNumber')
      .populate('gameId', 'gameName')
      .sort({ betDate: -1 })
      .limit(10)

    const recentResults = await SessionResult.find()
      .populate('gameId', 'gameName')
      .populate('declaredBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10)

    // Get monthly and yearly statistics
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const currentYear = new Date()
    currentYear.setMonth(0, 1)
    currentYear.setHours(0, 0, 0, 0)

    // Monthly and yearly bets (regular + starline)
    const monthlyRegularBets = await Bet.countDocuments({
      betDate: { $gte: currentMonth }
    })

    const monthlyStarlineBets = await StarlineBet.countDocuments({
      betDate: { $gte: currentMonth }
    })

    const monthlyBets = monthlyRegularBets + monthlyStarlineBets

    const yearlyRegularBets = await Bet.countDocuments({
      betDate: { $gte: currentYear }
    })

    const yearlyStarlineBets = await StarlineBet.countDocuments({
      betDate: { $gte: currentYear }
    })

    const yearlyBets = yearlyRegularBets + yearlyStarlineBets

    const monthlyWithdrawalsResult = await Withdrawal.aggregate([
      {
        $match: {
          createdAt: { $gte: currentMonth },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ])
    const monthlyWithdrawals = monthlyWithdrawalsResult[0]?.total || 0

    const yearlyWithdrawalsResult = await Withdrawal.aggregate([
      {
        $match: {
          createdAt: { $gte: currentYear },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ])
    const yearlyWithdrawals = yearlyWithdrawalsResult[0]?.total || 0

    // Calculate monthly and yearly revenue (regular + starline)
    const monthlyRegularBetAmount = await Bet.aggregate([
      { $match: { betDate: { $gte: currentMonth } } },
      { $group: { _id: null, total: { $sum: '$betAmount' } } }
    ])

    const monthlyStarlineBetAmount = await StarlineBet.aggregate([
      { $match: { betDate: { $gte: currentMonth } } },
      { $group: { _id: null, total: { $sum: '$betAmount' } } }
    ])

    const monthlyTotalBetAmount = (monthlyRegularBetAmount[0]?.total || 0) + (monthlyStarlineBetAmount[0]?.total || 0)

    const monthlyRegularWinAmount = await Bet.aggregate([
      { $match: { betDate: { $gte: currentMonth }, status: 'won' } },
      { $group: { _id: null, total: { $sum: '$winAmount' } } }
    ])

    const monthlyStarlineWinAmount = await StarlineBet.aggregate([
      { $match: { betDate: { $gte: currentMonth }, status: 'won' } },
      { $group: { _id: null, total: { $sum: '$winAmount' } } }
    ])

    const monthlyTotalWinAmount = (monthlyRegularWinAmount[0]?.total || 0) + (monthlyStarlineWinAmount[0]?.total || 0)

    const yearlyRegularBetAmount = await Bet.aggregate([
      { $match: { betDate: { $gte: currentYear } } },
      { $group: { _id: null, total: { $sum: '$betAmount' } } }
    ])

    const yearlyStarlineBetAmount = await StarlineBet.aggregate([
      { $match: { betDate: { $gte: currentYear } } },
      { $group: { _id: null, total: { $sum: '$betAmount' } } }
    ])

    const yearlyTotalBetAmount = (yearlyRegularBetAmount[0]?.total || 0) + (yearlyStarlineBetAmount[0]?.total || 0)

    const yearlyRegularWinAmount = await Bet.aggregate([
      { $match: { betDate: { $gte: currentYear }, status: 'won' } },
      { $group: { _id: null, total: { $sum: '$winAmount' } } }
    ])

    const yearlyStarlineWinAmount = await StarlineBet.aggregate([
      { $match: { betDate: { $gte: currentYear }, status: 'won' } },
      { $group: { _id: null, total: { $sum: '$winAmount' } } }
    ])

    const yearlyTotalWinAmount = (yearlyRegularWinAmount[0]?.total || 0) + (yearlyStarlineWinAmount[0]?.total || 0)

    const monthlyRevenue = monthlyTotalBetAmount - monthlyTotalWinAmount - monthlyWithdrawals
    const yearlyRevenue = yearlyTotalBetAmount - yearlyTotalWinAmount - yearlyWithdrawals

    // Get daily user signup data for the last 7 days
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      last7Days.push(date)
    }

    const dailySignups = await Promise.all(
      last7Days.map(async (date) => {
        const nextDay = new Date(date)
        nextDay.setDate(nextDay.getDate() + 1)

        const count = await User.countDocuments({
          role: 'user',
          createdAt: { $gte: date, $lt: nextDay }
        })

        return {
          date: date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
          signups: count
        }
      })
    )

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalGames,
        activeGames,
        totalBets,
        todayBets,
        revenue: Math.round(revenue * 100) / 100
      },
      analytics: {
        today: {
          bets: todayBets,
          withdrawals: todayWithdrawals,
          profit: Math.round(todayProfit * 100) / 100
        },
        monthly: {
          bets: monthlyBets,
          withdrawals: monthlyWithdrawals,
          profit: Math.round(monthlyRevenue * 100) / 100
        },
        yearly: {
          bets: yearlyBets,
          withdrawals: yearlyWithdrawals,
          profit: Math.round(yearlyRevenue * 100) / 100
        }
      },
      userAnalytics: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        activePercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
      },
      userGrowth: {
        dailySignups
      },
      recentBets,
      recentResults
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/overview
// @desc    Get admin overview data
// @access  Private/Admin
router.get('/overview', async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Get today's stats
    const todayStats = {
      newUsers: await User.countDocuments({
        role: 'user',
        createdAt: { $gte: today }
      }),
      newBets: await Bet.countDocuments({
        betDate: { $gte: today }
      }),
      newResults: await SessionResult.countDocuments({
        createdAt: { $gte: today }
      })
    }

    // Get yesterday's stats for comparison
    const yesterdayStats = {
      newUsers: await User.countDocuments({
        role: 'user',
        createdAt: { $gte: yesterday, $lt: today }
      }),
      newBets: await Bet.countDocuments({
        betDate: { $gte: yesterday, $lt: today }
      }),
      newResults: await SessionResult.countDocuments({
        createdAt: { $gte: yesterday, $lt: today }
      })
    }

    res.json({
      today: todayStats,
      yesterday: yesterdayStats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Overview error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/games
// @desc    Get all games
// @access  Private/Admin
router.get('/games', async (req, res) => {
  try {
    const { type, active } = req.query
    let query = {}

    if (type) query.gameType = type
    if (active !== undefined) query.isActive = active === 'true'

    const games = await Game.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })

    res.json({ games })
  } catch (error) {
    console.error('Get games error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/admin/games
// @desc    Create a new game
// @access  Private/Admin
router.post('/games', [
  body('gameName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Game name must be between 2 and 50 characters'),
  body('openTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Open time must be in HH:MM format'),
  body('closeTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Close time must be in HH:MM format'),
  body('resultTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Result time must be in HH:MM format'),
  body('gameRates.single').isNumeric().withMessage('Single rate must be numeric'),
  body('gameRates.jodi').isNumeric().withMessage('Jodi rate must be numeric'),
  body('gameRates.panna').isNumeric().withMessage('Panna rate must be numeric'),
  body('gameRates.halfSangam').isNumeric().withMessage('Half Sangam rate must be numeric'),
  body('gameRates.fullSangam').isNumeric().withMessage('Full Sangam rate must be numeric')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const {
      gameName,
      gameNameHindi,
      gameType = 'standard',
      openTime,
      closeTime,
      resultTime,
      gameRates,
      description
    } = req.body

    // Check if game name already exists
    const existingGame = await Game.findOne({ gameName })
    if (existingGame) {
      return res.status(400).json({ message: 'Game name already exists' })
    }

    // Create a default 7-day schedule since Game model requires it
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const schedule = daysOfWeek.map(day => ({
      day,
      openTime,
      closeTime,
      isActive: true
    }))

    const game = new Game({
      gameName,
      gameNameHindi,
      gameType,
      openTime,
      closeTime,
      resultTime,
      gameRates,
      description,
      schedule, // Add the required schedule field
      createdBy: req.user._id
    })

    await game.save()

    res.status(201).json({
      message: 'Game created successfully',
      game
    })
  } catch (error) {
    console.error('Create game error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/games/:id
// @desc    Update a game
// @access  Private/Admin
router.put('/games/:id', [
  body('gameName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Game name must be between 2 and 50 characters'),
  body('openTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Open time must be in HH:MM format'),
  body('closeTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Close time must be in HH:MM format'),
  body('resultTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Result time must be in HH:MM format')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const gameId = req.params.id
    const updateData = req.body

    // Check if game exists
    const game = await Game.findById(gameId)
    if (!game) {
      return res.status(404).json({ message: 'Game not found' })
    }

    // Check if game name is being changed and if it already exists
    if (updateData.gameName && updateData.gameName !== game.gameName) {
      const existingGame = await Game.findOne({ gameName: updateData.gameName })
      if (existingGame) {
        return res.status(400).json({ message: 'Game name already exists' })
      }
    }

    const updatedGame = await Game.findByIdAndUpdate(
      gameId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name')

    res.json({
      message: 'Game updated successfully',
      game: updatedGame
    })
  } catch (error) {
    console.error('Update game error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/admin/games/:id
// @desc    Delete a game
// @access  Private/Admin
router.delete('/games/:id', async (req, res) => {
  try {
    const gameId = req.params.id

    // Check if game exists
    const game = await Game.findById(gameId)
    if (!game) {
      return res.status(404).json({ message: 'Game not found' })
    }

    // Check if there are any bets for this game
    const betCount = await Bet.countDocuments({ gameId })
    if (betCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete game with existing bets. Deactivate instead.'
      })
    }

    await Game.findByIdAndDelete(gameId)

    res.json({ message: 'Game deleted successfully' })
  } catch (error) {
    console.error('Delete game error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Legacy route removed - use /api/admin/declare-result instead

// @route   GET /api/admin/results
// @desc    Get all results
// @access  Private/Admin
router.get('/results', async (req, res) => {
  try {
    const { gameId, date } = req.query
    let query = {}

    if (gameId) query.gameId = gameId
    if (date) {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
      query.gameDate = { $gte: startDate, $lt: endDate }
    }

    const results = await SessionResult.find(query)
      .populate('gameId', 'gameName')
      .populate('declaredBy', 'name')
      .sort({ createdAt: -1 })

    res.json({ results })
  } catch (error) {
    console.error('Get results error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/bets
// @desc    Get all bets
// @access  Private/Admin
router.get('/bets', async (req, res) => {
  try {
    const { gameId, userId, status, date } = req.query
    let query = {}

    if (gameId) query.gameId = gameId
    if (userId) query.userId = userId
    if (status) query.status = status
    if (date) {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
      query.betDate = { $gte: startDate, $lt: endDate }
    }

    const bets = await Bet.find(query)
      .populate('userId', 'name mobileNumber')
      .populate('gameId', 'gameName')
      .sort({ betDate: -1 })

    res.json({ bets })
  } catch (error) {
    console.error('Get bets error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// ============ BET SETTLEMENT LOGIC ============

async function getGlobalRates() {
  const rates = await GameRate.findOne().lean()
  return rates || null
}

async function settleBetsForGameDate(gameId, gameDate) {
  console.log(`Starting settlement for gameId: ${gameId}, gameDate: ${gameDate}`)

  const rates = await getGlobalRates()
  if (!rates) {
    console.log('No game rates found, skipping bet settlement')
    return
  }
  console.log('Game rates found:', rates)

  const results = await SessionResult.find({ gameId, gameDate }).lean()
  console.log(`Found ${results.length} session results:`, results)

  const open = results.find(r => r.session === 'open')
  const close = results.find(r => r.session === 'close')
  const haveOpen = !!open, haveClose = !!close

  console.log('Session results:', { open, close, haveOpen, haveClose })

  const jodiString = haveOpen && haveClose ? buildJodi(open.digit, close.digit) : null

  // Check all bets for this game and date
  const allBets = await Bet.find({ gameId, gameDate })
  console.log(`Found ${allBets.length} total bets for this game/date`)

  const pending = await Bet.find({ gameId, gameDate, status: 'pending' })
  console.log(`Found ${pending.length} pending bets to settle for game ${gameId} on ${gameDate}`)

  if (pending.length === 0) {
    console.log('No pending bets found. Checking bet details:')
    allBets.forEach(bet => {
      console.log(`Bet ${bet._id}: status=${bet.status}, gameId=${bet.gameId}, gameDate=${bet.gameDate}`)
    })
  }

  for (const bet of pending) {
    console.log(`Processing bet ${bet._id}: type=${bet.betType}, number=${bet.betNumber}, session=${bet.session}, amount=${bet.betAmount}`)

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
          bet.result = `${sessionRes.pana}-${sessionRes.digit}`
        } else {
          continue // cannot settle yet
        }
        break
      }
      case 'singlePanna':
      case 'doublePanna':
      case 'triplePanna': {
        const sessionRes = bet.session === 'open' ? open : close
        console.log(`Panna bet: session=${bet.session}, sessionRes=`, sessionRes)
        if (sessionRes) {
          const rateMap = { singlePanna: rates.singlePana, doublePanna: rates.doublePana, triplePanna: rates.triplePana }
          const rate = rateMap[bet.betType]
          console.log(`Comparing: bet pana ${bet.betNumber} vs result pana ${sessionRes.pana}`)
          if (sessionRes.pana === bet.betNumber) {
            isWon = true
            winAmount = payoutFromRate(rate.min, rate.max, amount)
            console.log(`Panna bet WON! Win amount: ${winAmount}`)
          } else {
            console.log(`Panna bet LOST`)
          }
          bet.result = `${sessionRes.pana}-${sessionRes.digit}`
        } else {
          console.log(`Cannot settle panna bet - no session result for ${bet.session}`)
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
          bet.result = `${open.pana}-${open.digit}-${close.pana}-${close.digit}`
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
          if (side === 'openDigitClosePanna') ok = (open.digit === Number(digitStr) && close.pana === pannaStr)
          if (side === 'closeDigitOpenPanna') ok = (close.digit === Number(digitStr) && open.pana === pannaStr)
          if (ok) {
            isWon = true
            winAmount = payoutFromRate(rate.min, rate.max, amount)
          }
          bet.result = `${open.pana}-${open.digit}/${close.pana}-${close.digit}`
        } else {
          continue
        }
        break
      }
      case 'fullSangam': {
        if (haveOpen && haveClose) {
          console.log(`Full Sangam bet processing:`)
          console.log(`  Open result: pana=${open.pana}, digit=${open.digit}`)
          console.log(`  Close result: pana=${close.pana}, digit=${close.digit}`)
          console.log(`  Bet number: ${bet.betNumber}`)

          const rate = rates.fullSangam
          const [openP, closeP] = bet.betNumber.split('|')
          console.log(`  Split bet number: openP=${openP}, closeP=${closeP}`)

          if (open.pana === openP && close.pana === closeP) {
            isWon = true
            winAmount = payoutFromRate(rate.min, rate.max, amount)
            console.log(`  Full Sangam bet WON! Win amount: ${winAmount}`)
          } else {
            console.log(`  Full Sangam bet LOST`)
          }
          bet.result = `${open.pana}-${open.digit}/${close.pana}-${close.digit}`
          console.log(`  Setting bet.result to: ${bet.result}`)
        } else {
          console.log(`Cannot settle full sangam bet - missing session results`)
          continue
        }
        break
      }
      default:
        continue
    }

    const finalStatus = isWon ? 'won' : 'lost'
    const finalWinAmount = isWon ? Math.round(winAmount) : 0

    console.log(`Setting bet ${bet._id} status to: ${finalStatus}, winAmount: ${finalWinAmount}`)

    bet.status = finalStatus
    bet.winAmount = finalWinAmount
    bet.resultDate = new Date()

    // Update user balance if bet won
    if (isWon && winAmount > 0) {
      const user = await User.findById(bet.userId)
      if (user) {
        const oldBalance = user.balance
        user.balance += Math.round(winAmount)
        await user.save()
        console.log(`User ${user.name} won ₹${Math.round(winAmount)} on bet ${bet._id}. Balance: ${oldBalance} → ${user.balance}`)
      }
    }

    const savedBet = await bet.save()
    console.log(`Bet ${bet._id} saved successfully. Final status: ${savedBet.status}, winAmount: ${savedBet.winAmount}`)
  }

  console.log('Settlement process completed')
}

// ============ NEW DECLARE RESULT AND CHECK WINNERS ENDPOINTS ============

// @route   POST /api/admin/declare-result
// @desc    Declare game result with session support
// @access  Private/Admin
router.post('/declare-result', [
  body('gameId').isString().withMessage('Game ID is required'),
  body('date').isISO8601().withMessage('Date must be in ISO format'),
  body('session').isIn(['open', 'close']).withMessage('Session must be open or close'),
  body('pana').matches(/^\d{3}$/).withMessage('Pana must be 3 digits'),
  body('digit').matches(/^\d{1}$/).withMessage('Digit must be 1 digit')
], async (req, res) => {
  try {
    // Debug log the request body
    console.log('Declare result request body:', JSON.stringify(req.body, null, 2))

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array())
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { gameId, date, session, pana, digit } = req.body
    console.log('Extracted values:', { gameId, date, session, pana, digit })
    const gameDate = new Date(date)
    gameDate.setHours(0, 0, 0, 0)

    // Check if game exists
    const game = await Game.findById(gameId)
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      })
    }

    // Check if result already exists for this game, date, and session
    const existingResult = await SessionResult.findOne({
      gameId,
      gameDate,
      session
    })

    if (existingResult) {
      return res.status(400).json({
        success: false,
        message: `Result already declared for ${session} session on ${date}`
      })
    }

    // Create session result
    const sessionResult = new SessionResult({
      gameId,
      gameName: game.gameName,
      gameDate,
      session,
      pana,
      digit: parseInt(digit),
      declaredBy: req.user._id
    })

    console.log('Attempting to save session result:', sessionResult)

    // Save the session result with explicit error handling
    const savedResult = await sessionResult.save()
    console.log('Session result saved successfully:', savedResult._id)

    // Update game with today's result
    const resultString = `${pana}-${digit}`
    game.todayResult = resultString
    await game.save()
    console.log('Game updated with result:', resultString)

    // Process winning bets - settle all pending bets for this game and date
    console.log('Starting bet settlement process...')
    await settleBetsForGameDate(gameId, gameDate)
    console.log('Bet settlement completed')

    res.json({
      success: true,
      message: 'Result declared successfully',
      result: savedResult
    })

  } catch (error) {
    console.error('Declare result error:', error)

    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
        details: error.message
      })
    }

    // Check if it's a duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Result already exists for this game, date, and session',
        details: error.message
      })
    }

    // Generic server error
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// @route   GET /api/admin/check-winners
// @desc    Check winners for a specific game, date, and session
// @access  Private/Admin
router.get('/check-winners', async (req, res) => {
  try {
    const { gameId, date, session, pana, digit } = req.query

    if (!gameId || !date || !session) {
      return res.status(400).json({
        success: false,
        message: 'Game ID, date, and session are required'
      })
    }

    const gameDate = new Date(date)
    gameDate.setHours(0, 0, 0, 0)

    // Build query for finding bets
    let betQuery = {
      gameId,
      gameDate,
      session,
      status: { $in: ['won', 'pending'] }
    }

    // If specific result provided, we can check for winners
    let winners = []
    let stats = {
      totalWinners: 0,
      totalWinAmount: 0,
      totalBetAmount: 0
    }

    if (pana && digit) {
      // Find all bets for this game/date/session
      const allBets = await Bet.find({
        gameId,
        gameDate,
        session
      }).populate('userId', 'name mobileNumber')

      // Check which bets are winners based on result
      for (const bet of allBets) {
        let isWinner = false
        const betAmount = bet.betAmount
        let winAmount = 0

        console.log(`Checking regular matka bet: Type=${bet.betType}, Number=${bet.betNumber} (${typeof bet.betNumber}), Pana=${pana} (${typeof pana}), Digit=${digit} (${typeof digit})`)

        switch (bet.betType) {
          case 'single':
            // Convert both to strings and compare
            isWinner = String(digit).trim() === String(bet.betNumber).trim()
            if (isWinner) {
              winAmount = bet.winAmount || betAmount * 10 // Default multiplier
            }
            break

          case 'singlePanna':
          case 'doublePanna':
          case 'triplePanna':
            // Convert both to strings and compare
            isWinner = String(pana).trim() === String(bet.betNumber).trim()
            if (isWinner) {
              const multipliers = { singlePanna: 140, doublePanna: 280, triplePanna: 700 }
              winAmount = bet.winAmount || betAmount * (multipliers[bet.betType] / 10)
            }
            break

          case 'jodi':
            // For jodi, we need both open and close results
            // This is simplified - in practice you'd check both sessions
            break

          case 'halfSangam':
          case 'fullSangam':
            // Complex logic for sangam bets
            break
        }

        if (isWinner) {
          winners.push({
            _id: bet._id,
            userId: bet.userId._id,
            userName: bet.userId.name,
            userMobile: bet.userId.mobileNumber,
            betType: bet.betType,
            betNumber: bet.betNumber,
            betAmount: betAmount,
            winAmount: winAmount,
            session: bet.session,
            betDate: bet.betDate,
            result: `${pana}-${digit}`
          })

          stats.totalWinAmount += winAmount
        }

        stats.totalBetAmount += betAmount
      }

      stats.totalWinners = winners.length
    } else {
      // No specific result provided, just return pending bets
      const pendingBets = await Bet.find({
        gameId,
        gameDate,
        session,
        status: 'pending'
      }).populate('userId', 'name mobileNumber')

      stats.totalBetAmount = pendingBets.reduce((sum, bet) => sum + bet.betAmount, 0)
    }

    res.json({
      success: true,
      winners,
      stats,
      message: `Found ${winners.length} winners`
    })

  } catch (error) {
    console.error('Check winners error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
})

// @route   GET /api/admin/starline-check-winners
// @desc    Check winners for starline games
// @access  Private/Admin
router.get('/starline-check-winners', async (req, res) => {
  try {
    const { gameId, date, winningNumber } = req.query

    if (!gameId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Game ID and date are required'
      })
    }

    const gameDate = new Date(date)
    gameDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(gameDate)
    nextDay.setDate(nextDay.getDate() + 1)

    // Import StarlineBet model
    const StarlineBet = require('../models/StarlineBet')
    const StarlineGameRate = require('../models/StarlineGameRate')

    // Find all bets for this game and date (robust across different date fields)
    const allBets = await StarlineBet.find({
      gameId,
      $or: [
        { gameDate: { $gte: gameDate, $lt: nextDay } },
        { createdAt: { $gte: gameDate, $lt: nextDay } },
        { betDate: { $gte: gameDate, $lt: nextDay } }
      ]
    })
      .populate('userId', 'name username mobileNumber')
      .sort({ createdAt: -1 })

    let winners = []
    const totalBets = allBets.length
    const totalBetAmount = allBets.reduce((sum, bet) => sum + (bet.betAmount || 0), 0)
    const pendingBets = allBets.filter(b => (b.status || 'pending') === 'pending')
    const pendingCount = pendingBets.length
    const pendingBetAmount = pendingBets.reduce((sum, bet) => sum + (bet.betAmount || 0), 0)

    let stats = {
      totalBets,
      totalBetAmount,
      totalWinners: 0,
      totalWinAmount: 0,
      profitLoss: 0,
      pendingBets: pendingCount,
      pendingBetAmount
    }

    // If winning number is provided, calculate winners
    if (winningNumber && winningNumber.length === 3) {
      // Get starline rates for payout calculation
      const rates = await StarlineGameRate.findOne()
      const defaultRates = {
        singleDigit: { min: 9, max: 9.5 },
        singlePana: { min: 140, max: 150 },
        doublePana: { min: 280, max: 300 },
        triplePana: { min: 700, max: 800 }
      }
      const gameRates = rates || defaultRates

      for (const bet of allBets) {
        let isWinner = false
        let winAmount = 0
        let multiplier = 0

        // Convert to strings to ensure consistent comparison
        const betNumberStr = String(bet.betNumber).trim()
        const winningNumberStr = String(winningNumber).trim()

        console.log(`Checking starline bet: Type=${bet.betType}, Number=${bet.betNumber} (${typeof bet.betNumber}) -> ${betNumberStr}, WinningNumber=${winningNumber} (${typeof winningNumber}) -> ${winningNumberStr}`)

        switch (bet.betType) {
          case 'single digit':
            // Check if the last digit of winning number matches bet number
            isWinner = winningNumberStr.slice(-1) === betNumberStr
            if (isWinner) {
              multiplier = gameRates.singleDigit?.max || 9.5
              winAmount = bet.betAmount * multiplier
            }
            break

          case 'single pana':
          case 'double pana':
          case 'triple pana':
            isWinner = winningNumberStr === betNumberStr
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

        if (isWinner) {
          winners.push({
            _id: bet._id,
            userId: bet.userId,
            betType: bet.betType,
            betNumber: bet.betNumber,
            betAmount: bet.betAmount,
            winAmount: Math.round(winAmount),
            multiplier: multiplier,
            createdAt: bet.createdAt
          })

          stats.totalWinAmount += Math.round(winAmount)
        }
      }

      stats.totalWinners = winners.length
      stats.profitLoss = stats.totalBetAmount - stats.totalWinAmount
    }

    res.json({
      success: true,
      data: {
        winners,
        allBets,
        stats
      },
      message: winningNumber
        ? `Found ${winners.length} winners for number ${winningNumber}`
        : `Found ${allBets.length} bets for selected date`
    })

  } catch (error) {
    console.error('Starline check winners error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
})

// ============ FUND REQUEST ADMIN ROUTES ============

// @route   GET /api/admin/fund-requests
// @desc    Get all fund requests for admin
// @access  Private/Admin
router.get('/fund-requests', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    let query = {}

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const requests = await FundRequest.find(query)
      .populate('userId', 'name mobile email balance bankDetails paymentDetails')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()

    // Map requests with proper user field name
    const formattedRequests = requests.map(request => ({
      ...request,
      user: request.userId
    }))

    const total = await FundRequest.countDocuments(query)

    res.json({
      success: true,
      requests: formattedRequests,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: page < Math.ceil(total / parseInt(limit)),
        hasPrev: page > 1
      },
      totalCount: total
    })
  } catch (error) {
    console.error('Get fund requests error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/fund-requests/:id
// @desc    Update fund request status (approve/reject)
// @access  Private/Admin
router.put('/fund-requests/:id', [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either approved or rejected'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { status, remarks } = req.body
    const requestId = req.params.id

    const fundRequest = await FundRequest.findById(requestId)
    if (!fundRequest) {
      return res.status(404).json({ message: 'Fund request not found' })
    }

    if (fundRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' })
    }

    // If approving, add amount to user balance
    if (status === 'approved') {
      const user = await User.findById(fundRequest.userId)
      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }

      user.balance += fundRequest.amount
      await user.save()

      console.log(`Fund request ${requestId} approved. User ${user.name} balance updated to ${user.balance}`)
    }

    // Update fund request
    fundRequest.status = status
    fundRequest.approvedBy = req.user._id
    if (remarks) fundRequest.remarks = remarks

    await fundRequest.save()

    res.json({
      success: true,
      message: `Fund request ${status} successfully`,
      request: fundRequest
    })

  } catch (error) {
    console.error('Update fund request error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// ============ WITHDRAW REQUEST ADMIN ROUTES ============

// @route   GET /api/admin/withdraw-requests
// @desc    Get all withdraw requests for admin
// @access  Private/Admin
router.get('/withdraw-requests', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    let query = {}

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const requests = await Withdrawal.find(query)
      .populate('userId', 'name mobile email balance bankDetails paymentDetails')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()

    // Map requests with proper user field name
    const formattedRequests = requests.map(request => ({
      ...request,
      user: request.userId
    }))

    const total = await Withdrawal.countDocuments(query)

    res.json({
      success: true,
      requests: formattedRequests,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: page < Math.ceil(total / parseInt(limit)),
        hasPrev: page > 1
      },
      totalCount: total
    })
  } catch (error) {
    console.error('Get withdraw requests error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/withdraw-requests/:id
// @desc    Update withdraw request status (approve/reject)
// @access  Private/Admin
router.put('/withdraw-requests/:id', [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either approved or rejected'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks must be less than 500 characters'),
  body('transactionId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Transaction ID must be less than 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { status, remarks, transactionId } = req.body
    const requestId = req.params.id

    const withdrawRequest = await Withdrawal.findById(requestId)
    if (!withdrawRequest) {
      return res.status(404).json({ message: 'Withdraw request not found' })
    }

    if (withdrawRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' })
    }

    // If approving withdrawal, deduct from user balance
    if (status === 'approved') {
      const user = await User.findById(withdrawRequest.userId)
      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }

      if (user.balance < withdrawRequest.amount) {
        return res.status(400).json({ message: 'User has insufficient balance' })
      }

      user.balance -= withdrawRequest.amount
      await user.save()

      console.log(`Withdraw request ${requestId} approved. User ${user.name} balance updated to ${user.balance}`)
    }

    // Update withdraw request
    withdrawRequest.status = status
    withdrawRequest.approvedBy = req.user._id
    if (remarks) withdrawRequest.remarks = remarks
    if (transactionId) withdrawRequest.transactionId = transactionId

    await withdrawRequest.save()

    res.json({
      success: true,
      message: `Withdraw request ${status} successfully`,
      request: withdrawRequest
    })

  } catch (error) {
    console.error('Update withdraw request error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// ============ USER-SPECIFIC DATA ROUTES FOR ADMIN ============

// @route   GET /api/admin/user/:userId/fund-requests
// @desc    Get specific user's fund request history (Admin only)
// @access  Private/Admin
router.get('/user/:userId/fund-requests', async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 20 } = req.query

    // Check if user exists
    const user = await User.findById(userId).select('name mobileNumber balance')
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const requests = await FundRequest.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()

    const total = await FundRequest.countDocuments({ userId })

    res.json({
      success: true,
      user,
      requests,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: page < Math.ceil(total / parseInt(limit)),
        hasPrev: page > 1
      },
      totalCount: total
    })

  } catch (error) {
    console.error('Get user fund requests error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
})

// @route   GET /api/admin/user/:userId/withdrawals
// @desc    Get specific user's withdrawal history (Admin only)
// @access  Private/Admin
router.get('/user/:userId/withdrawals', async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 20 } = req.query

    // Check if user exists
    const user = await User.findById(userId).select('name mobileNumber balance')
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const withdrawals = await Withdrawal.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()

    const total = await Withdrawal.countDocuments({ userId })

    res.json({
      success: true,
      user,
      withdrawals,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: page < Math.ceil(total / parseInt(limit)),
        hasPrev: page > 1
      },
      totalCount: total
    })

  } catch (error) {
    console.error('Get user withdrawals error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
})

// @route   GET /api/admin/user/:userId/bets
// @desc    Get specific user's bet history (Admin only)
// @access  Private/Admin
router.get('/user/:userId/bets', async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 20, status, gameId } = req.query

    // Check if user exists
    const user = await User.findById(userId).select('name mobileNumber balance')
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Build query
    let query = { userId }
    if (status) query.status = status
    if (gameId) query.gameId = gameId

    const bets = await Bet.find(query)
      .populate('gameId', 'gameName')
      .sort({ betDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Bet.countDocuments(query)

    // Calculate summary statistics
    const stats = await Bet.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalBets: { $sum: 1 },
          totalBetAmount: { $sum: '$betAmount' },
          totalWinAmount: { $sum: '$winAmount' },
          pendingBets: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          wonBets: {
            $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] }
          },
          lostBets: {
            $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] }
          }
        }
      }
    ])

    const summary = stats[0] || {
      totalBets: 0,
      totalBetAmount: 0,
      totalWinAmount: 0,
      pendingBets: 0,
      wonBets: 0,
      lostBets: 0
    }

    res.json({
      success: true,
      user,
      bets,
      summary: {
        ...summary,
        netProfitLoss: summary.totalWinAmount - summary.totalBetAmount
      },
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: page < Math.ceil(total / parseInt(limit)),
        hasPrev: page > 1
      },
      totalCount: total
    })

  } catch (error) {
    console.error('Get user bets error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
})

// @route   GET /api/admin/user/:userId/winning-history
// @desc    Get specific user's winning history (Admin only)
// @access  Private/Admin
router.get('/user/:userId/winning-history', async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 20, gameId } = req.query

    // Check if user exists
    const user = await User.findById(userId).select('name mobileNumber balance')
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Build query for winning bets (both regular and starline)
    let regularQuery = { userId, status: 'won', winAmount: { $gt: 0 } }
    let starlineQuery = { userId, status: 'won', winAmount: { $gt: 0 } }

    if (gameId) {
      regularQuery.gameId = gameId
      starlineQuery.gameId = gameId
    }

    // Get winning bets from both regular and starline
    const [regularWinnings, starlineWinnings] = await Promise.all([
      Bet.find(regularQuery)
        .populate('gameId', 'gameName')
        .sort({ resultDate: -1, betDate: -1 })
        .lean(),
      StarlineBet.find(starlineQuery)
        .populate('gameId', 'gameName gameType')
        .sort({ resultDate: -1, betDate: -1 })
        .lean()
    ])

    // Combine and mark source
    const allWinnings = [
      ...regularWinnings.map(bet => ({ ...bet, source: 'regular' })),
      ...starlineWinnings.map(bet => ({ ...bet, source: 'starline' }))
    ].sort((a, b) => {
      const dateA = new Date(a.resultDate || a.betDate)
      const dateB = new Date(b.resultDate || b.betDate)
      return dateB - dateA
    })

    // Apply pagination to combined results
    const paginatedWinnings = allWinnings.slice(skip, skip + parseInt(limit))
    const total = allWinnings.length

    // Calculate summary statistics
    const totalWinAmount = allWinnings.reduce((sum, bet) => sum + (bet.winAmount || 0), 0)
    const totalBetAmount = allWinnings.reduce((sum, bet) => sum + (bet.betAmount || 0), 0)

    const summary = {
      totalWinnings: allWinnings.length,
      totalWinAmount,
      totalBetAmount,
      netProfit: totalWinAmount - totalBetAmount,
      regularWinnings: regularWinnings.length,
      starlineWinnings: starlineWinnings.length
    }

    res.json({
      success: true,
      user,
      winnings: paginatedWinnings,
      summary,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: page < Math.ceil(total / parseInt(limit)),
        hasPrev: page > 1
      },
      totalCount: total
    })

  } catch (error) {
    console.error('Get user winning history error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
})

// @route   POST /api/admin/add-fund-user-wallet
// @desc    Add funds to user wallet (for admin correction)
// @access  Private/Admin
router.post('/add-fund-user-wallet', [
  body('userId').isString().withMessage('User ID is required'),
  body('amount').isNumeric().withMessage('Amount must be numeric').custom(value => {
    if (value <= 0) {
      throw new Error('Amount must be greater than 0')
    }
    return true
  })
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

    const { userId, amount } = req.body
    const adminId = req.user._id
    const adminName = req.user.name

    // Find the user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (user.role !== 'user') {
      return res.status(400).json({
        success: false,
        message: 'Can only add funds to user accounts'
      })
    }

    // Update user balance
    const oldBalance = user.balance
    user.balance += parseFloat(amount)
    await user.save()

    // Log the transaction (you can create a transaction log model if needed)
    console.log(`Admin ${adminName} (${adminId}) added ₹${amount} to user ${user.name} (${user.mobileNumber}). Balance: ${oldBalance} → ${user.balance}`)

    res.json({
      success: true,
      message: `₹${amount} added to ${user.name}'s wallet successfully`,
      user: {
        id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        oldBalance,
        newBalance: user.balance,
        amountAdded: parseFloat(amount)
      }
    })

  } catch (error) {
    console.error('Add fund user wallet error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
})

// @route   POST /api/admin/withdraw-fund-user-wallet
// @desc    Withdraw funds from user wallet (for admin correction)
// @access  Private/Admin
router.post('/withdraw-fund-user-wallet', [
  body('userId').isString().withMessage('User ID is required'),
  body('amount').isNumeric().withMessage('Amount must be numeric').custom(value => {
    if (value <= 0) {
      throw new Error('Amount must be greater than 0')
    }
    return true
  })
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

    const { userId, amount } = req.body
    const adminId = req.user._id
    const adminName = req.user.name

    // Find the user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (user.role !== 'user') {
      return res.status(400).json({
        success: false,
        message: 'Can only withdraw funds from user accounts'
      })
    }

    // Check if user has sufficient balance
    if (user.balance < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. User has ₹${user.balance}, requested ₹${amount}`
      })
    }

    // Update user balance
    const oldBalance = user.balance
    user.balance -= parseFloat(amount)
    await user.save()

    // Log the transaction
    console.log(`Admin ${adminName} (${adminId}) withdrew ₹${amount} from user ${user.name} (${user.mobileNumber}). Balance: ${oldBalance} → ${user.balance}`)

    res.json({
      success: true,
      message: `₹${amount} withdrawn from ${user.name}'s wallet successfully`,
      user: {
        id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        oldBalance,
        newBalance: user.balance,
        amountWithdrawn: parseFloat(amount)
      }
    })

  } catch (error) {
    console.error('Withdraw fund user wallet error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
})

// @route   PUT /api/admin/update-bet-number
// @desc    Update bet number for regular games (to remove from winners)
// @access  Private/Admin
router.put('/update-bet-number', [
  body('betId').isString().withMessage('Bet ID is required'),
  body('newBetNumber').isString().withMessage('New bet number is required'),
  body('reason').optional().isString().withMessage('Reason must be a string')
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

    const { betId, newBetNumber, reason } = req.body
    const adminId = req.user._id
    const adminName = req.user.name

    // Find the bet
    const bet = await Bet.findById(betId).populate('userId', 'name mobileNumber balance')
    if (!bet) {
      return res.status(404).json({
        success: false,
        message: 'Bet not found'
      })
    }

    // Store original data for logging
    const originalBetNumber = bet.betNumber
    const originalStatus = bet.status
    const originalWinAmount = bet.winAmount

    // If bet was won, we need to reverse the win amount from user balance
    if (bet.status === 'won' && bet.winAmount > 0) {
      const user = await User.findById(bet.userId._id)
      if (user) {
        const oldBalance = user.balance
        user.balance -= bet.winAmount
        await user.save()
        console.log(`Reversed win amount ₹${bet.winAmount} from user ${user.name}. Balance: ${oldBalance} → ${user.balance}`)
      }
    }

    // Update bet number and reset status
    bet.betNumber = newBetNumber
    bet.status = 'lost' // Reset to pending so it can be re-evaluated
    bet.winAmount = 0
    bet.result = null
    bet.resultDate = null

    // Add admin modification log
    if (!bet.adminModifications) {
      bet.adminModifications = []
    }
    bet.adminModifications.push({
      modifiedBy: adminId,
      modifiedAt: new Date(),
      originalBetNumber,
      newBetNumber,
      originalStatus,
      originalWinAmount,
      reason: reason || 'Admin correction',
      action: 'bet_number_changed'
    })

    await bet.save()

    // Log the action
    console.log(`Admin ${adminName} (${adminId}) changed bet ${betId} number from ${originalBetNumber} to ${newBetNumber}. Reason: ${reason || 'Admin correction'}`)

    res.json({
      success: true,
      message: 'Bet number updated successfully',
      data: {
        betId: bet._id,
        originalBetNumber,
        newBetNumber,
        originalStatus,
        newStatus: bet.status,
        originalWinAmount,
        newWinAmount: bet.winAmount,
        modifiedBy: adminName,
        modifiedAt: new Date()
      }
    })

  } catch (error) {
    console.error('Update bet number error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
})

// @route   PUT /api/admin/update-starline-bet-number
// @desc    Update bet number for starline games (to remove from winners)
// @access  Private/Admin
router.put('/update-starline-bet-number', [
  body('betId').isString().withMessage('Bet ID is required'),
  body('newBetNumber').isString().withMessage('New bet number is required'),
  body('reason').optional().isString().withMessage('Reason must be a string')
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

    const { betId, newBetNumber, reason } = req.body
    const adminId = req.user._id
    const adminName = req.user.name

    // Find the starline bet
    const StarlineBet = require('../models/StarlineBet')
    const bet = await StarlineBet.findById(betId).populate('userId', 'name mobileNumber balance')
    if (!bet) {
      return res.status(404).json({
        success: false,
        message: 'Starline bet not found'
      })
    }

    // Store original data for logging
    const originalBetNumber = bet.betNumber
    const originalStatus = bet.status
    const originalWinAmount = bet.winAmount

    // If bet was won, we need to reverse the win amount from user balance
    if (bet.status === 'won' && bet.winAmount > 0) {
      const user = await User.findById(bet.userId._id)
      if (user) {
        const oldBalance = user.balance
        user.balance -= bet.winAmount
        await user.save()
        console.log(`Reversed starline win amount ₹${bet.winAmount} from user ${user.name}. Balance: ${oldBalance} → ${user.balance}`)
      }
    }

    // Update bet number and reset status
    bet.betNumber = newBetNumber
    bet.status = 'pending' // Reset to pending so it can be re-evaluated
    bet.winAmount = 0
    bet.result = null
    bet.resultDate = null

    // Add admin modification log
    if (!bet.adminModifications) {
      bet.adminModifications = []
    }
    bet.adminModifications.push({
      modifiedBy: adminId,
      modifiedAt: new Date(),
      originalBetNumber,
      newBetNumber,
      originalStatus,
      originalWinAmount,
      reason: reason || 'Admin correction',
      action: 'bet_number_changed'
    })

    await bet.save()

    // Log the action
    console.log(`Admin ${adminName} (${adminId}) changed starline bet ${betId} number from ${originalBetNumber} to ${newBetNumber}. Reason: ${reason || 'Admin correction'}`)

    res.json({
      success: true,
      message: 'Starline bet number updated successfully',
      data: {
        betId: bet._id,
        originalBetNumber,
        newBetNumber,
        originalStatus,
        newStatus: bet.status,
        originalWinAmount,
        newWinAmount: bet.winAmount,
        modifiedBy: adminName,
        modifiedAt: new Date()
      }
    })

  } catch (error) {
    console.error('Update starline bet number error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
})

module.exports = router
