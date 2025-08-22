const express = require('express')
const { validationResult } = require('express-validator')
const mongoose = require('mongoose')
const router = express.Router()

// Models
const StarlineBet = require('../models/StarlineBet')
const StarlineResult = require('../models/StarlineResult')
const StarlineGame = require('../models/StarlineGame')
const StarlineGameRate = require('../models/StarlineGameRate')
const User = require('../models/User')

// Middleware
const { auth, requireAdminOrSubAdmin } = require('../middleware/auth')

// Validation
const { validateQueryParams } = require('../utils/starlineValidation')

/**
 * @route   GET /api/starline/reports/bids
 * @desc    Get comprehensive bid reports with filtering
 * @access  Admin only
 */
router.get('/bids', requireAdminOrSubAdmin, validateQueryParams, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const {
      page = 1,
      limit = 50,
      gameId,
      userId,
      status,
      betType,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      export: exportData
    } = req.query

    // Build query
    let query = {}

    if (gameId) {
      query.gameId = gameId
    }

    if (userId) {
      query.userId = userId
    }

    if (status) {
      query.status = status
    }

    if (betType) {
      query.betType = betType
    }

    if (startDate && endDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)

      query.betDate = {
        $gte: start,
        $lte: end
      }
    }

    if (minAmount || maxAmount) {
      query.betAmount = {}
      if (minAmount) query.betAmount.$gte = parseInt(minAmount)
      if (maxAmount) query.betAmount.$lte = parseInt(maxAmount)
    }

    // Calculate pagination (skip for export)
    const skip = exportData === 'true' ? 0 : (parseInt(page) - 1) * parseInt(limit)
    const limitValue = exportData === 'true' ? 0 : parseInt(limit)

    // Execute query
    const betsQuery = StarlineBet.find(query)
      .populate('userId', 'name mobileNumber')
      .populate('gameId', 'gameName gameType')
      .sort({ betDate: -1 })
      .skip(skip)

    if (limitValue > 0) {
      betsQuery.limit(limitValue)
    }

    const bets = await betsQuery

    const total = await StarlineBet.countDocuments(query)

    // Calculate summary statistics
    const summary = await StarlineBet.aggregate([
      { $match: query },
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
          },
          cancelledBets: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ])

    // Get bet type breakdown
    const betTypeBreakdown = await StarlineBet.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$betType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$betAmount' },
          totalWin: { $sum: '$winAmount' },
          avgAmount: { $avg: '$betAmount' }
        }
      }
    ])

    // Get game-wise breakdown
    const gameBreakdown = await StarlineBet.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$gameId',
          gameName: { $first: '$gameName' },
          count: { $sum: 1 },
          totalAmount: { $sum: '$betAmount' },
          totalWin: { $sum: '$winAmount' }
        }
      },
      { $sort: { count: -1 } }
    ])

    const summaryData = summary[0] || {
      totalBets: 0,
      totalBetAmount: 0,
      totalWinAmount: 0,
      pendingBets: 0,
      wonBets: 0,
      lostBets: 0,
      cancelledBets: 0
    }

    res.json({
      success: true,
      data: {
        bets,
        ...(exportData !== 'true' && {
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            total,
            limit: parseInt(limit)
          }
        }),
        summary: {
          ...summaryData,
          netProfitLoss: summaryData.totalBetAmount - summaryData.totalWinAmount,
          winPercentage: summaryData.totalBets > 0
            ? ((summaryData.wonBets / summaryData.totalBets) * 100).toFixed(2)
            : 0
        },
        breakdown: {
          byBetType: betTypeBreakdown,
          byGame: gameBreakdown
        }
      }
    })

  } catch (error) {
    console.error('Get bid reports error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bid reports'
    })
  }
})

/**
 * @route   GET /api/starline/reports/winnings
 * @desc    Get winning reports with payout details
 * @access  Admin only
 */
router.get('/winnings', requireAdminOrSubAdmin, validateQueryParams, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const {
      page = 1,
      limit = 50,
      gameId,
      userId,
      betType,
      startDate,
      endDate,
      minWinAmount,
      maxWinAmount
    } = req.query

    // Build query for winning bets only
    let query = { status: 'won', winAmount: { $gt: 0 } }

    if (gameId) {
      query.gameId = gameId
    }

    if (userId) {
      query.userId = userId
    }

    if (betType) {
      query.betType = betType
    }

    if (startDate && endDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)

      query.betDate = {
        $gte: start,
        $lte: end
      }
    }

    if (minWinAmount || maxWinAmount) {
      if (minWinAmount) query.winAmount.$gte = parseInt(minWinAmount)
      if (maxWinAmount) query.winAmount.$lte = parseInt(maxWinAmount)
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Execute query
    const winningBets = await StarlineBet.find(query)
      .populate('userId', 'name mobileNumber')
      .populate('gameId', 'gameName gameType')
      .sort({ resultDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await StarlineBet.countDocuments(query)

    // Calculate summary statistics
    const summary = await StarlineBet.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalWinningBets: { $sum: 1 },
          totalBetAmount: { $sum: '$betAmount' },
          totalWinAmount: { $sum: '$winAmount' },
          avgWinAmount: { $avg: '$winAmount' },
          maxWinAmount: { $max: '$winAmount' },
          minWinAmount: { $min: '$winAmount' }
        }
      }
    ])

    // Get top winners
    const topWinners = await StarlineBet.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$userId',
          totalWins: { $sum: 1 },
          totalWinAmount: { $sum: '$winAmount' },
          totalBetAmount: { $sum: '$betAmount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          mobileNumber: '$user.mobileNumber',
          totalWins: 1,
          totalWinAmount: 1,
          totalBetAmount: 1,
          netProfit: { $subtract: ['$totalWinAmount', '$totalBetAmount'] }
        }
      },
      { $sort: { totalWinAmount: -1 } },
      { $limit: 10 }
    ])

    // Get bet type breakdown for winnings
    const betTypeBreakdown = await StarlineBet.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$betType',
          count: { $sum: 1 },
          totalBetAmount: { $sum: '$betAmount' },
          totalWinAmount: { $sum: '$winAmount' },
          avgWinAmount: { $avg: '$winAmount' }
        }
      }
    ])

    const summaryData = summary[0] || {
      totalWinningBets: 0,
      totalBetAmount: 0,
      totalWinAmount: 0,
      avgWinAmount: 0,
      maxWinAmount: 0,
      minWinAmount: 0
    }

    res.json({
      success: true,
      data: {
        winningBets,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        },
        summary: summaryData,
        topWinners,
        betTypeBreakdown
      }
    })

  } catch (error) {
    console.error('Get winning reports error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching winning reports'
    })
  }
})

/**
 * @route   GET /api/starline/reports/self
 * @desc    Get admin's own activity reports
 * @access  Admin only
 */
router.get('/self', requireAdminOrSubAdmin, validateQueryParams, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      activityType
    } = req.query

    const adminId = req.user._id
    console.log('Self reports - Admin ID:', adminId)

    // Build date filter
    let dateFilter = {}
    if (startDate && endDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)

      dateFilter = {
        $gte: start,
        $lte: end
      }
    }

    const activities = []

    // Get games created by admin
    if (!activityType || activityType === 'games') {
      const gamesQuery = { createdBy: adminId }
      if (Object.keys(dateFilter).length > 0) {
        gamesQuery.createdAt = dateFilter
      }

      const games = await StarlineGame.find(gamesQuery)
        .select('gameName supportedBetTypes isActive createdAt')
        .sort({ createdAt: -1 })

      console.log('Self reports - Games found:', games.length)
      games.forEach(game => {
        activities.push({
          type: 'game_created',
          description: `Created game: ${game.gameName}`,
          details: {
            gameId: game._id,
            gameName: game.gameName,
            supportedBetTypes: game.supportedBetTypes,
            isActive: game.isActive
          },
          timestamp: game.createdAt
        })
      })
    }

    // Get results declared by admin
    if (!activityType || activityType === 'results') {
      const resultsQuery = { declaredBy: adminId }
      if (Object.keys(dateFilter).length > 0) {
        resultsQuery.declaredAt = dateFilter
      }

      const results = await StarlineResult.find(resultsQuery)
        .populate('gameId', 'gameName')
        .sort({ declaredAt: -1 })

      console.log('Self reports - Results found:', results.length)
      results.forEach(result => {
        activities.push({
          type: 'result_declared',
          description: `Declared result for ${result.gameId?.gameName || result.gameName}: ${result.winningNumber}`,
          details: {
            gameId: result.gameId?._id,
            gameName: result.gameId?.gameName || result.gameName,
            winningNumber: result.winningNumber,
            totalBets: result.totalBets,
            totalPayout: result.totalPayout
          },
          timestamp: result.declaredAt
        })
      })
    }

    // Get rates created by admin
    if (!activityType || activityType === 'rates') {
      // Simple rate info - using StarlineGameRate
      const rates = await StarlineGameRate.findOne()
      if (rates) {
        activities.push({
          type: 'rates_configured',
          description: 'Starline game rates configured',
          details: {
            singleDigit: `₹${rates.singleDigit.min} - ₹${rates.singleDigit.max}`,
            singlePana: `₹${rates.singlePana.min} - ₹${rates.singlePana.max}`,
            doublePana: `₹${rates.doublePana.min} - ₹${rates.doublePana.max}`,
            triplePana: `₹${rates.triplePana.min} - ₹${rates.triplePana.max}`
          },
          timestamp: rates.updatedAt || rates.createdAt
        })
      }
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    // Apply pagination
    const total = activities.length
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const paginatedActivities = activities.slice(skip, skip + parseInt(limit))

    // Calculate summary statistics
    const summary = {
      totalActivities: total,
      gamesCreated: activities.filter(a => a.type === 'game_created').length,
      resultsDeclared: activities.filter(a => a.type === 'result_declared').length,
      ratesCreated: activities.filter(a => a.type === 'rate_created').length
    }

    res.json({
      success: true,
      data: {
        activities: paginatedActivities,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        },
        summary
      }
    })

  } catch (error) {
    console.error('Get self reports error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching self reports'
    })
  }
})

/**
 * @route   GET /api/starline/reports/predictions
 * @desc    Get winning prediction analytics
 * @access  Admin only
 */
router.get('/predictions', requireAdminOrSubAdmin, validateQueryParams, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { gameId, days = 30 } = req.query

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(days))

    // Build query
    let query = {
      gameDate: {
        $gte: startDate,
        $lte: endDate
      },
      status: 'completed'
    }

    if (gameId) {
      query.gameId = gameId
    }

    // Check if we have enough data
    const resultCount = await StarlineResult.countDocuments(query)
    if (resultCount < 10) {
      return res.status(400).json({
        success: false,
        message: `Insufficient data for predictions. Need at least 10 results, found ${resultCount}.`
      })
    }

    // Get historical results
    const results = await StarlineResult.find(query)
      .populate('gameId', 'gameName gameType')
      .sort({ gameDate: -1 })

    // Analyze winning number patterns
    const numberFrequency = {}
    const digitFrequency = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }
    const sumFrequency = {}

    results.forEach(result => {
      const winningNumber = result.winningNumber

      // Count full number frequency
      numberFrequency[winningNumber] = (numberFrequency[winningNumber] || 0) + 1

      // Count individual digit frequency
      winningNumber.split('').forEach(digit => {
        digitFrequency[parseInt(digit)]++
      })

      // Count sum frequency
      const sum = winningNumber.split('').reduce((acc, digit) => acc + parseInt(digit), 0)
      sumFrequency[sum] = (sumFrequency[sum] || 0) + 1
    })

    // Find most and least frequent numbers
    const sortedNumbers = Object.entries(numberFrequency)
      .sort(([, a], [, b]) => b - a)

    const mostFrequent = sortedNumbers.slice(0, 10)
    const leastFrequent = sortedNumbers.slice(-10).reverse()

    // Find hot and cold digits
    const sortedDigits = Object.entries(digitFrequency)
      .sort(([, a], [, b]) => b - a)

    const hotDigits = sortedDigits.slice(0, 5)
    const coldDigits = sortedDigits.slice(-5).reverse()

    // Calculate probability distributions
    const totalResults = results.length
    const numberProbabilities = {}
    Object.entries(numberFrequency).forEach(([number, count]) => {
      numberProbabilities[number] = ((count / totalResults) * 100).toFixed(2)
    })

    // Analyze recent trends (last 7 results)
    const recentResults = results.slice(0, 7)
    const recentTrends = {
      numbers: recentResults.map(r => r.winningNumber),
      avgSum: recentResults.reduce((acc, r) => {
        const sum = r.winningNumber.split('').reduce((s, d) => s + parseInt(d), 0)
        return acc + sum
      }, 0) / recentResults.length,
      patterns: []
    }

    // Look for patterns in recent results
    const patterns = []
    for (let i = 0; i < recentResults.length - 1; i++) {
      const current = recentResults[i].winningNumber
      const next = recentResults[i + 1].winningNumber

      // Check for consecutive patterns
      if (Math.abs(parseInt(current) - parseInt(next)) <= 10) {
        patterns.push(`${current} → ${next} (Close sequence)`)
      }
    }
    recentTrends.patterns = patterns

    // Generate predictions based on analysis
    const predictions = {
      hotNumbers: mostFrequent.slice(0, 5).map(([num]) => num),
      coldNumbers: leastFrequent.slice(0, 5).map(([num]) => num),
      recommendedDigits: hotDigits.slice(0, 3).map(([digit]) => digit),
      avoidDigits: coldDigits.slice(0, 2).map(([digit]) => digit),
      probabilityRange: {
        high: mostFrequent.slice(0, 20).map(([num]) => num),
        medium: sortedNumbers.slice(20, 50).map(([num]) => num[0]),
        low: sortedNumbers.slice(50).map(([num]) => num[0])
      }
    }

    res.json({
      success: true,
      data: {
        analysisInfo: {
          totalResults: resultCount,
          dateRange: { startDate, endDate },
          daysAnalyzed: parseInt(days)
        },
        patterns: {
          numberFrequency: Object.fromEntries(sortedNumbers),
          digitFrequency,
          sumFrequency,
          mostFrequent: mostFrequent.map(([num, count]) => ({ number: num, count, percentage: ((count / totalResults) * 100).toFixed(2) })),
          leastFrequent: leastFrequent.map(([num, count]) => ({ number: num, count, percentage: ((count / totalResults) * 100).toFixed(2) }))
        },
        trends: {
          hotDigits: hotDigits.map(([digit, count]) => ({ digit, count })),
          coldDigits: coldDigits.map(([digit, count]) => ({ digit, count })),
          recent: recentTrends
        },
        predictions,
        disclaimer: "Predictions are based on historical data analysis and probability. Gambling involves risk and results are not guaranteed."
      }
    })

  } catch (error) {
    console.error('Get prediction analytics error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while generating prediction analytics'
    })
  }
})

/**
 * @route   GET /api/starline/reports/dashboard
 * @desc    Get comprehensive dashboard data
 * @access  Admin only
 */
router.get('/dashboard', requireAdminOrSubAdmin, async (req, res) => {
  try {
    const { period = '7' } = req.query // days

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Get overall statistics
    const overallStats = await StarlineBet.aggregate([
      {
        $match: {
          betDate: {
            $gte: new Date(startDate.setHours(0, 0, 0, 0)),
            $lte: new Date(endDate.setHours(23, 59, 59, 999))
          }
        }
      },
      {
        $group: {
          _id: null,
          totalBets: { $sum: 1 },
          totalBetAmount: { $sum: '$betAmount' },
          totalWinAmount: { $sum: '$winAmount' },
          pendingBets: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          wonBets: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
          lostBets: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } }
        }
      }
    ])

    // Get daily statistics
    const dailyStats = await StarlineBet.aggregate([
      {
        $match: {
          betDate: {
            $gte: new Date(startDate.setHours(0, 0, 0, 0)),
            $lte: new Date(endDate.setHours(23, 59, 59, 999))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$betDate' },
            month: { $month: '$betDate' },
            day: { $dayOfMonth: '$betDate' }
          },
          date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$betDate' } } },
          totalBets: { $sum: 1 },
          totalAmount: { $sum: '$betAmount' },
          totalWin: { $sum: '$winAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ])

    // Get top games
    const topGames = await StarlineBet.aggregate([
      {
        $match: {
          betDate: {
            $gte: new Date(startDate.setHours(0, 0, 0, 0)),
            $lte: new Date(endDate.setHours(23, 59, 59, 999))
          }
        }
      },
      {
        $group: {
          _id: '$gameId',
          gameName: { $first: '$gameName' },
          totalBets: { $sum: 1 },
          totalAmount: { $sum: '$betAmount' },
          totalWin: { $sum: '$winAmount' }
        }
      },
      { $sort: { totalBets: -1 } },
      { $limit: 5 }
    ])

    // Get active games count
    const activeGamesCount = await StarlineGame.countDocuments({ isActive: true })
    const totalGamesCount = await StarlineGame.countDocuments()

    // Get recent results
    const recentResults = await StarlineResult.find({
      declaredAt: { $gte: startDate, $lte: endDate }
    })
      .populate('gameId', 'gameName')
      .sort({ declaredAt: -1 })
      .limit(5)

    const summary = overallStats[0] || {
      totalBets: 0,
      totalBetAmount: 0,
      totalWinAmount: 0,
      pendingBets: 0,
      wonBets: 0,
      lostBets: 0
    }

    res.json({
      success: true,
      data: {
        period: parseInt(period),
        summary: {
          ...summary,
          profitLoss: summary.totalBetAmount - summary.totalWinAmount,
          winPercentage: summary.totalBets > 0 ? ((summary.wonBets / summary.totalBets) * 100).toFixed(2) : 0
        },
        games: {
          active: activeGamesCount,
          total: totalGamesCount,
          topPerforming: topGames
        },
        trends: {
          daily: dailyStats
        },
        recentActivity: {
          results: recentResults
        }
      }
    })

  } catch (error) {
    console.error('Get dashboard data error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    })
  }
})

module.exports = router