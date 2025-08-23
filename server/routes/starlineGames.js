const express = require('express')
const { validationResult } = require('express-validator')
const router = express.Router()

// Models
const StarlineGame = require('../models/StarlineGame')
const StarlineBet = require('../models/StarlineBet')
const StarlineResult = require('../models/StarlineResult')

// Middleware
const { auth, requireAdminOrSubAdmin } = require('../middleware/auth')

// Validation
const {
  validateCreateGame,
  validateUpdateGame,
  validateObjectId,
  validateQueryParams
} = require('../utils/starlineValidation')

// Utility functions
const { getGameStatus } = require('../utils/starlineUtils')

/**
 * @route   GET /api/starline/games
 * @desc    Get all Starline games with optional filtering
 * @access  Public (for active games), Admin (for all games)
 */
router.get('/', auth, validateQueryParams, async (req, res) => {
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
      limit = 10,
      betType,
      isActive,
      search
    } = req.query

    // Build query
    let query = {}
    
    // Debug logging
    console.log('Starline games request - User:', req.user?.role, 'isActive param:', isActive)
    
    // If not admin, only show active games
    if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
      query.isActive = true
      console.log('Non-admin user, filtering to active games only')
    } else if (isActive !== undefined) {
      query.isActive = isActive === 'true'
      console.log('Admin user with isActive filter:', query.isActive)
    } else {
      console.log('Admin user, showing all games (active and inactive)')
    }

    if (betType) {
      query.supportedBetTypes = { $in: [betType] }
    }

    if (search) {
      query.$or = [
        { gameName: { $regex: search, $options: 'i' } },
        { gameNameHindi: { $regex: search, $options: 'i' } }
      ]
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Execute query
    const games = await StarlineGame.find(query)
      .populate('createdBy', 'username adminName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await StarlineGame.countDocuments(query)

    // Get today's date for fetching latest results (same as regular games)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fetch latest results for each game and build result string (same as regular games)
    const gamesWithResults = await Promise.all(
      games.map(async (game) => {
        // Get today's result for this starline game
        const todayResult = await StarlineResult.findOne({
          gameId: game._id,
          gameDate: { $gte: today }
        }).sort({ declaredAt: -1 })

        // Format result string - for starline it's just the winning number or ***
        let resultString = '***'
        let hasResultToday = false

        if (todayResult && todayResult.winningNumber) {
          resultString = todayResult.winningNumber
          hasResultToday = true
        }

        const gameObj = game.toObject()
        gameObj.result = resultString
        gameObj.digit = todayResult?.digit
        gameObj.currentStatus = getGameStatus(game, new Date(), hasResultToday)
        return gameObj
      })
    )

    const gamesWithStatus = gamesWithResults

    res.json({
      success: true,
      data: {
        games: gamesWithStatus,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    })

  } catch (error) {
    console.error('Get starline games error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching games'
    })
  }
})

/**
 * @route   GET /api/starline/games/:id
 * @desc    Get a specific Starline game by ID
 * @access  Public (for active games), Admin (for all games)
 */
router.get('/:id', auth, validateObjectId, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { id } = req.params

    let query = { _id: id }
    
    // If not admin, only show active games
    if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
      query.isActive = true
    }

    const game = await StarlineGame.findOne(query)
      .populate('createdBy', 'username adminName')

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      })
    }

    // Get today's result for this game (same as regular games)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayResult = await StarlineResult.findOne({
      gameId: id,
      gameDate: { $gte: today }
    }).sort({ declaredAt: -1 })

    // Format result string - for starline it's just the winning number or ***
    let resultString = '***'
    let hasResultToday = false

    if (todayResult && todayResult.winningNumber) {
      resultString = todayResult.winningNumber
      hasResultToday = true
    }

    const gameObj = game.toObject()
    gameObj.result = resultString
    gameObj.currentStatus = getGameStatus(game, new Date(), hasResultToday)

    res.json({
      success: true,
      data: gameObj
    })

  } catch (error) {
    console.error('Get starline game error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching game'
    })
  }
})

/**
 * @route   POST /api/starline/games
 * @desc    Create a new Starline game
 * @access  Admin only
 */
router.post('/', requireAdminOrSubAdmin, validateCreateGame, async (req, res) => {
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
      gameName,
      gameNameHindi,
      openTime,
      description
    } = req.body

    // Create new game
    const newGame = new StarlineGame({
      gameName,
      gameNameHindi,
      openTime,
      description,
      createdBy: req.user._id
    })

    const savedGame = await newGame.save()
    await savedGame.populate('createdBy', 'username adminName')

    res.status(201).json({
      success: true,
      message: 'Starline game created successfully',
      data: savedGame
    })

  } catch (error) {
    console.error('Create starline game error:', error)
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Game name already exists'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating game'
    })
  }
})

/**
 * @route   PUT /api/starline/games/:id
 * @desc    Update a Starline game
 * @access  Admin only
 */
router.put('/:id', requireAdminOrSubAdmin, validateUpdateGame, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { id } = req.params
    const updateData = req.body

    // Find the game
    const game = await StarlineGame.findById(id)
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      })
    }

    // Check if there are active bets for this game today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const activeBets = await StarlineBet.countDocuments({
      gameId: id,
      gameDate: today,
      status: 'pending'
    })

    // If there are active bets, restrict certain updates
    if (activeBets > 0) {
      const restrictedFields = ['openTime']
      const hasRestrictedUpdates = restrictedFields.some(field => updateData.hasOwnProperty(field))
      
      if (hasRestrictedUpdates) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update game timing when there are active bets'
        })
      }
    }

    // Update the game
    const updatedGame = await StarlineGame.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'username adminName')

    res.json({
      success: true,
      message: 'Game updated successfully',
      data: updatedGame
    })

  } catch (error) {
    console.error('Update starline game error:', error)
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Game name already exists'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating game'
    })
  }
})

/**
 * @route   DELETE /api/starline/games/:id
 * @desc    Delete a Starline game
 * @access  Admin only
 */
router.delete('/:id', requireAdminOrSubAdmin, validateObjectId, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { id } = req.params

    // Find the game
    const game = await StarlineGame.findById(id)
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      })
    }

    // Check if there are any bets for this game
    const betCount = await StarlineBet.countDocuments({ gameId: id })
    
    if (betCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete game with existing bets. Deactivate the game instead.'
      })
    }

    // Delete the game
    await StarlineGame.findByIdAndDelete(id)

    res.json({
      success: true,
      message: 'Game deleted successfully'
    })

  } catch (error) {
    console.error('Delete starline game error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while deleting game'
    })
  }
})

/**
 * @route   PATCH /api/starline/games/:id/toggle-status
 * @desc    Toggle game active status
 * @access  Admin only
 */
router.patch('/:id/toggle-status', requireAdminOrSubAdmin, validateObjectId, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { id } = req.params

    const game = await StarlineGame.findById(id)
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      })
    }

    // Toggle the status
    game.isActive = !game.isActive
    await game.save()

    res.json({
      success: true,
      message: `Game ${game.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        gameId: game._id,
        gameName: game.gameName,
        isActive: game.isActive
      }
    })

  } catch (error) {
    console.error('Toggle game status error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while toggling game status'
    })
  }
})

/**
 * @route   GET /api/starline/games/:id/stats
 * @desc    Get game statistics
 * @access  Admin only
 */
router.get('/:id/stats', requireAdminOrSubAdmin, validateObjectId, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { id } = req.params
    const { startDate, endDate } = req.query

    // Find the game
    const game = await StarlineGame.findById(id)
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      })
    }

    // Build date filter
    let dateFilter = { gameId: id }
    if (startDate && endDate) {
      dateFilter.gameDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }

    // Get betting statistics
    const stats = await StarlineBet.aggregate([
      { $match: dateFilter },
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

    // Get bet type breakdown
    const betTypeStats = await StarlineBet.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$betType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$betAmount' },
          totalWin: { $sum: '$winAmount' }
        }
      }
    ])

    const gameStats = stats[0] || {
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
        game: {
          _id: game._id,
          gameName: game.gameName,
          gameType: game.gameType,
          isActive: game.isActive
        },
        stats: {
          ...gameStats,
          profitLoss: gameStats.totalBetAmount - gameStats.totalWinAmount,
          winPercentage: gameStats.totalBets > 0 
            ? ((gameStats.wonBets / gameStats.totalBets) * 100).toFixed(2)
            : 0
        },
        betTypeBreakdown: betTypeStats
      }
    })

  } catch (error) {
    console.error('Get game stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching game statistics'
    })
  }
})

module.exports = router