const express = require('express')
const { validationResult, query } = require('express-validator')
const mongoose = require('mongoose')
const router = express.Router()

// Models
const StarlineBet = require('../models/StarlineBet')
const StarlineGame = require('../models/StarlineGame')
const StarlineGameRate = require('../models/StarlineGameRate')
const User = require('../models/User')

// Middleware
const { auth, requireActiveUser, requireAdminOrSubAdmin } = require('../middleware/auth')

// Validation
const {
    validatePlaceBet,
    validateQueryParams,
    validateObjectId
} = require('../utils/starlineValidation')

// Utility functions
const {
    calculatePotentialWin,
    calculatePayout,
    getGameStatus,
    isWithinGameHours,
    checkBetWin
} = require('../utils/starlineUtils')

/**
 * @route   POST /api/starline/bets
 * @desc    Place a new Starline bet
 * @access  Private (authenticated users only)
 */
router.post('/', requireActiveUser, validatePlaceBet, async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            })
        }

        const { gameId, betType, betNumber, betAmount } = req.body
        const userId = req.user._id

        // Get game details
        const game = await StarlineGame.findById(gameId)
        if (!game || !game.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Game not found or inactive'
            })
        }

        // Check if game is currently open for betting
        const gameStatus = getGameStatus(game)
        if (gameStatus !== 'open') {
            return res.status(400).json({
                success: false,
                message: `Betting is ${gameStatus}. Game is not open for betting.`
            })
        }

        // Check if bet amount is within game limits
        if (betAmount < game.minBet || betAmount > game.maxBet) {
            return res.status(400).json({
                success: false,
                message: `Bet amount must be between ${game.minBet} and ${game.maxBet}`
            })
        }

        // Get user and check balance
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        if (user.balance < betAmount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance'
            })
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

        const potentialWin = calculatePotentialWin(betType, betAmount, {
            singleDigit: gameRates.singleDigit.max,
            singlePana: gameRates.singlePana.max,
            doublePana: gameRates.doublePana.max,
            triplePana: gameRates.triplePana.max
        })

        // Check for duplicate bet (same user, game, bet type, bet number, same day)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const existingBet = await StarlineBet.findOne({
            userId,
            gameId,
            betType,
            betNumber,
            gameDate: today,
            status: 'pending'
        })

        if (existingBet) {
            return res.status(400).json({
                success: false,
                message: 'You have already placed this bet for today'
            })
        }

        // Deduct amount from user balance
        await User.findByIdAndUpdate(
            userId,
            { $inc: { balance: -betAmount } }
        )

        // Create the bet
        const newBet = new StarlineBet({
            userId,
            gameId,
            gameName: game.gameName,
            betType,
            betNumber,
            betAmount,
            potentialWin,
            gameDate: today,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        })

        const savedBet = await newBet.save()

        // Populate user details for response
        await savedBet.populate('userId', 'name mobileNumber')
        await savedBet.populate('gameId', 'gameName openTime')

        res.status(201).json({
            success: true,
            message: 'Bet placed successfully',
            data: {
                bet: savedBet,
                remainingBalance: user.balance - betAmount
            }
        })

    } catch (error) {
        console.error('Place starline bet error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while placing bet'
        })
    }
})

/**
 * @route   GET /api/starline/bets
 * @desc    Get user's betting history
 * @access  Private (authenticated users only)
 */
router.get('/', requireActiveUser, validateQueryParams, async (req, res) => {
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
            gameId,
            status,
            betType,
            startDate,
            endDate
        } = req.query

        const userId = req.user._id

        // Build query
        let query = { userId }

        if (gameId) {
            query.gameId = gameId
        }

        if (status) {
            query.status = status
        }

        if (betType) {
            query.betType = betType
        }

        if (startDate && endDate) {
            query.betDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit)

        // Execute query
        const bets = await StarlineBet.find(query)
            .populate('gameId', 'gameName gameType openTime closeTime resultTime')
            .sort({ betDate: -1 })
            .skip(skip)
            .limit(parseInt(limit))

        const total = await StarlineBet.countDocuments(query)

        // Calculate summary statistics
        const stats = await StarlineBet.aggregate([
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
            data: {
                bets,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit)),
                    total,
                    limit: parseInt(limit)
                },
                summary: {
                    ...summary,
                    netProfitLoss: summary.totalWinAmount - summary.totalBetAmount
                }
            }
        })

    } catch (error) {
        console.error('Get starline bets error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while fetching bets'
        })
    }
})

/**
 * @route   GET /api/starline/bets/user/:userId
 * @desc    Get specific user's betting history (Admin only)
 * @access  Private (Admin only)
 */
router.get('/user/:userId', requireAdminOrSubAdmin, validateObjectId, validateQueryParams, async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            })
        }

        const { userId } = req.params
        const {
            page = 1,
            limit = 10,
            gameId,
            status,
            betType,
            startDate,
            endDate
        } = req.query

        // Check if user exists
        const user = await User.findById(userId).select('name mobileNumber balance')
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        // Build query
        let query = { userId }

        if (gameId) {
            query.gameId = gameId
        }

        if (status) {
            query.status = status
        }

        if (betType) {
            query.betType = betType
        }

        if (startDate && endDate) {
            query.betDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit)

        // Execute query
        const bets = await StarlineBet.find(query)
            .populate('gameId', 'gameName gameType openTime closeTime resultTime')
            .sort({ betDate: -1 })
            .skip(skip)
            .limit(parseInt(limit))

        const total = await StarlineBet.countDocuments(query)

        // Calculate summary statistics
        const stats = await StarlineBet.aggregate([
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
            data: {
                user,
                bets,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit)),
                    total,
                    limit: parseInt(limit)
                },
                summary: {
                    ...summary,
                    netProfitLoss: summary.totalWinAmount - summary.totalBetAmount
                }
            }
        })

    } catch (error) {
        console.error('Get user starline bets error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while fetching user bets'
        })
    }
})

/**
 * @route   GET /api/starline/bets/:id
 * @desc    Get specific bet details
 * @access  Private (bet owner or admin)
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
        const userId = req.user._id
        const isAdmin = ['admin', 'superadmin'].includes(req.user.role)

        // Build query - users can only see their own bets, admins can see all
        let query = { _id: id }
        if (!isAdmin) {
            query.userId = userId
        }

        const bet = await StarlineBet.findOne(query)
            .populate('userId', 'name mobileNumber')
            .populate('gameId', 'gameName gameType openTime closeTime resultTime')

        if (!bet) {
            return res.status(404).json({
                success: false,
                message: 'Bet not found'
            })
        }

        res.json({
            success: true,
            data: bet
        })

    } catch (error) {
        console.error('Get starline bet error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while fetching bet'
        })
    }
})

/**
 * @route   PATCH /api/starline/bets/:id/cancel
 * @desc    Cancel a pending bet
 * @access  Private (bet owner only, within time limit)
 */
router.patch('/:id/cancel', requireActiveUser, validateObjectId, async (req, res) => {
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
        const userId = req.user._id

        // Find the bet
        const bet = await StarlineBet.findOne({
            _id: id,
            userId: userId,
            status: 'pending'
        }).populate('gameId')

        if (!bet) {
            return res.status(404).json({
                success: false,
                message: 'Bet not found or cannot be cancelled'
            })
        }

        // Check if game is still open (allow cancellation only if game is open)
        const gameStatus = getGameStatus(bet.gameId)
        if (gameStatus !== 'open') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel bet after betting time has closed'
            })
        }

        // Check if bet was placed within last 5 minutes (configurable)
        const timeSinceBet = Date.now() - bet.betDate.getTime()
        const maxCancelTime = 5 * 60 * 1000 // 5 minutes in milliseconds

        if (timeSinceBet > maxCancelTime) {
            return res.status(400).json({
                success: false,
                message: 'Bet can only be cancelled within 5 minutes of placement'
            })
        }

        // Refund the bet amount
        await User.findByIdAndUpdate(
            userId,
            { $inc: { balance: bet.betAmount } }
        )

        // Update bet status
        bet.status = 'cancelled'
        await bet.save()

        res.json({
            success: true,
            message: 'Bet cancelled successfully',
            data: {
                betId: bet._id,
                refundAmount: bet.betAmount
            }
        })

    } catch (error) {
        console.error('Cancel starline bet error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while cancelling bet'
        })
    }
})

/**
 * @route   GET /api/starline/bets/game/:gameId/today
 * @desc    Get today's bets for a specific game (Admin only)
 * @access  Private (Admin only)
 */
router.get('/game/:gameId/today', requireAdminOrSubAdmin, validateObjectId, async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            })
        }

        const { gameId } = req.params

        // Check if game exists
        const game = await StarlineGame.findById(gameId)
        if (!game) {
            return res.status(404).json({
                success: false,
                message: 'Game not found'
            })
        }

        // Get today's date
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        // Get all bets for today
        const bets = await StarlineBet.find({
            gameId,
            gameDate: {
                $gte: today,
                $lt: tomorrow
            }
        })
            .populate('userId', 'name mobileNumber')
            .sort({ betDate: -1 })

        // Calculate statistics
        const stats = await StarlineBet.aggregate([
            {
                $match: {
                    gameId: new mongoose.Types.ObjectId(gameId),
                    gameDate: {
                        $gte: today,
                        $lt: tomorrow
                    }
                }
            },
            {
                $group: {
                    _id: '$betType',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$betAmount' },
                    pendingCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    }
                }
            }
        ])

        const totalStats = await StarlineBet.aggregate([
            {
                $match: {
                    gameId: new mongoose.Types.ObjectId(gameId),
                    gameDate: {
                        $gte: today,
                        $lt: tomorrow
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalBets: { $sum: 1 },
                    totalAmount: { $sum: '$betAmount' },
                    pendingBets: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    }
                }
            }
        ])

        res.json({
            success: true,
            data: {
                game: {
                    _id: game._id,
                    gameName: game.gameName,
                    gameType: game.gameType
                },
                bets,
                statistics: {
                    byBetType: stats,
                    total: totalStats[0] || {
                        totalBets: 0,
                        totalAmount: 0,
                        pendingBets: 0
                    }
                }
            }
        })

    } catch (error) {
        console.error('Get game bets error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while fetching game bets'
        })
    }
})

/**
 * @route   GET /api/starline/bets/check-winners
 * @desc    Check winners for a specific game and date (similar to regular matka check winners)
 * @access  Admin only
 */
router.get('/check-winners', requireAdminOrSubAdmin, async (req, res) => {
    try {
        console.log('Check winners endpoint hit with query:', req.query)

        const { gameId, date, winningNumber } = req.query

        // Basic validation
        if (!gameId) {
            return res.status(400).json({
                success: false,
                message: 'Game ID is required'
            })
        }

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date is required'
            })
        }

        // Validate gameId format
        if (!mongoose.Types.ObjectId.isValid(gameId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid game ID format'
            })
        }

        // Validate winning number if provided
        if (winningNumber && !/^[0-9]{3}$/.test(winningNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Winning number must be a 3-digit number'
            })
        }

        // Normalize date
        const gameDate = new Date(date)
        gameDate.setHours(0, 0, 0, 0)

        console.log('Searching for game with ID:', gameId)

        // Check if game exists
        const game = await StarlineGame.findById(gameId)
        if (!game) {
            return res.status(404).json({
                success: false,
                message: 'Game not found'
            })
        }

        console.log('Game found:', game.gameName)
        console.log('Searching for bets with gameDate:', gameDate)

        // Get all bets for this game and date
        const bets = await StarlineBet.find({
            gameId,
            gameDate,
            status: 'pending'
        }).populate('userId', 'name username phone')

        console.log('Found bets:', bets.length)

        // Basic response structure
        const responseData = {
            game: {
                _id: game._id,
                gameName: game.gameName,
                gameType: game.gameType
            },
            gameDate,
            winningNumber: winningNumber || null,
            winners: [],
            stats: {
                totalBets: bets.length,
                totalBetAmount: bets.reduce((sum, bet) => sum + bet.betAmount, 0),
                totalWinners: 0,
                totalWinAmount: 0,
                profitLoss: 0
            },
            allBets: bets.map(bet => ({
                _id: bet._id,
                userId: bet.userId,
                betType: bet.betType,
                betNumber: bet.betNumber,
                betAmount: bet.betAmount,
                createdAt: bet.createdAt
            }))
        }

        // If winning number provided, calculate winners
        if (winningNumber && bets.length > 0) {
            const defaultRates = {
                'single digit': 9.5,
                'single pana': 140,
                'double pana': 280,
                'triple pana': 700
            }

            for (const bet of bets) {
                console.log(`Checking bet: Type=${bet.betType}, Number=${bet.betNumber} (${typeof bet.betNumber}), WinningNumber=${winningNumber} (${typeof winningNumber})`)
                const isWinner = checkBetWin(bet.betType, bet.betNumber, winningNumber)
                console.log(`Is winner: ${isWinner}`)

                if (isWinner) {
                    const rate = defaultRates[bet.betType] || 0
                    const winAmount = calculatePayout(bet.betAmount, rate)

                    responseData.winners.push({
                        _id: bet._id,
                        userId: bet.userId,
                        betType: bet.betType,
                        betNumber: bet.betNumber,
                        betAmount: bet.betAmount,
                        winAmount,
                        multiplier: rate,
                        betDate: bet.createdAt
                    })

                    responseData.stats.totalWinAmount += winAmount
                    responseData.stats.totalWinners++
                }
            }

            responseData.stats.profitLoss = responseData.stats.totalBetAmount - responseData.stats.totalWinAmount
        }

        res.json({
            success: true,
            data: responseData
        })

    } catch (error) {
        console.error('Check starline winners error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while checking winners',
            error: error.message
        })
    }
})

/**
 * @route   GET /api/starline/bets/game/:gameId/by-date
 * @desc    Get bets for a specific game on a specific date (Admin only)
 * @access  Private (Admin/Subadmin)
 */
router.get('/game/:gameId/by-date', requireAdminOrSubAdmin, validateObjectId, async (req, res) => {
    try {
        const { gameId } = req.params
        const { date } = req.query

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date is required in YYYY-MM-DD format'
            })
        }

        // Verify game exists
        const game = await StarlineGame.findById(gameId)
        if (!game) {
            return res.status(404).json({
                success: false,
                message: 'Game not found'
            })
        }

        // Build [startOfDay, endOfDay) window from provided date
        const start = new Date(date)
        if (isNaN(start.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD'
            })
        }
        start.setHours(0, 0, 0, 0)
        const end = new Date(start)
        end.setDate(end.getDate() + 1)

        // Query across multiple date fields to be robust
        const bets = await StarlineBet.find({
            gameId,
            $or: [
                { gameDate: { $gte: start, $lt: end } },
                { createdAt: { $gte: start, $lt: end } },
                { betDate: { $gte: start, $lt: end } }
            ]
        })
            .populate('userId', 'name mobileNumber username')
            .sort({ createdAt: -1 })

        // Aggregate simple statistics
        const byBetType = {}
        let totalAmount = 0
        let pendingCount = 0
        let pendingAmount = 0

        for (const bet of bets) {
            const type = bet.betType
            if (!byBetType[type]) {
                byBetType[type] = { count: 0, totalAmount: 0, pending: 0, pendingAmount: 0 }
            }
            byBetType[type].count += 1
            byBetType[type].totalAmount += bet.betAmount || 0

            totalAmount += bet.betAmount || 0

            const isPending = (bet.status || 'pending') === 'pending'
            if (isPending) {
                byBetType[type].pending += 1
                byBetType[type].pendingAmount += bet.betAmount || 0
                pendingCount += 1
                pendingAmount += bet.betAmount || 0
            }
        }

        return res.json({
            success: true,
            data: {
                game: {
                    _id: game._id,
                    gameName: game.gameName,
                    gameType: game.gameType
                },
                bets,
                statistics: {
                    byBetType,
                    total: {
                        totalBets: bets.length,
                        totalAmount,
                        pendingBets: pendingCount,
                        pendingAmount
                    }
                }
            }
        })
    } catch (error) {
        console.error('Get game bets by date error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while fetching game bets by date'
        })
    }
})
module.exports = router