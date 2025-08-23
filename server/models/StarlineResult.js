const mongoose = require('mongoose')

const starlineResultSchema = new mongoose.Schema({
    gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StarlineGame',
        required: true
    },
    gameName: {
        type: String,
        required: true
    },
    gameDate: {
        type: Date,
        required: true,
        default: function () {
            // Set to today's date at 00:00:00
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            return today
        }
    },
    winningNumber: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                // Validate winning number format (should be 3 digits for starline)
                return /^[0-9]{3}$/.test(v)
            },
            message: 'Winning number must be a 3-digit number'
        }
    },
    digit: {
        type: Number,
        required: true,
        min: [0, 'Digit must be between 0 and 9'],
        max: [9, 'Digit must be between 0 and 9']
    },
    declaredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    declaredAt: {
        type: Date,
        default: Date.now
    },
    totalBets: {
        type: Number,
        default: 0,
        min: [0, 'Total bets cannot be negative']
    },
    totalBetAmount: {
        type: Number,
        default: 0,
        min: [0, 'Total bet amount cannot be negative']
    },
    totalPayout: {
        type: Number,
        default: 0,
        min: [0, 'Total payout cannot be negative']
    },
    winningBets: {
        type: Number,
        default: 0,
        min: [0, 'Winning bets cannot be negative']
    },
    // Breakdown by bet type
    betTypeBreakdown: {
        singleDigit: {
            totalBets: { type: Number, default: 0 },
            winningBets: { type: Number, default: 0 },
            totalBetAmount: { type: Number, default: 0 },
            totalPayout: { type: Number, default: 0 }
        },
        singlePana: {
            totalBets: { type: Number, default: 0 },
            winningBets: { type: Number, default: 0 },
            totalBetAmount: { type: Number, default: 0 },
            totalPayout: { type: Number, default: 0 }
        },
        doublePana: {
            totalBets: { type: Number, default: 0 },
            winningBets: { type: Number, default: 0 },
            totalBetAmount: { type: Number, default: 0 },
            totalPayout: { type: Number, default: 0 }
        },
        triplePana: {
            totalBets: { type: Number, default: 0 },
            winningBets: { type: Number, default: 0 },
            totalBetAmount: { type: Number, default: 0 },
            totalPayout: { type: Number, default: 0 }
        }
    },
    // Status to track result processing
    status: {
        type: String,
        enum: ['declared', 'processing', 'completed', 'error'],
        default: 'declared'
    },
    // Error message if processing fails
    errorMessage: {
        type: String,
        default: null
    },
    // Processing metadata
    processingStarted: {
        type: Date,
        default: null
    },
    processingCompleted: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
})

// Compound index to ensure one result per game per date
starlineResultSchema.index({ gameId: 1, gameDate: 1 }, { unique: true })

// Other indexes for efficient queries
starlineResultSchema.index({ gameName: 1, gameDate: -1 })
starlineResultSchema.index({ declaredBy: 1, declaredAt: -1 })
starlineResultSchema.index({ gameDate: -1 })
starlineResultSchema.index({ status: 1 })
starlineResultSchema.index({ declaredAt: -1 })

// Pre-save validation
starlineResultSchema.pre('save', function (next) {
    // Ensure winning number is valid
    if (this.winningNumber && !/^[0-9]{3}$/.test(this.winningNumber)) {
        return next(new Error('Winning number must be a 3-digit number'))
    }

    // Ensure totals are consistent
    if (this.totalPayout < 0 || this.totalBetAmount < 0 || this.totalBets < 0) {
        return next(new Error('Total values cannot be negative'))
    }

    // If status is completed, ensure processing dates are set
    if (this.status === 'completed' && !this.processingCompleted) {
        this.processingCompleted = new Date()
    }

    next()
})

// Instance method to calculate profit/loss
starlineResultSchema.methods.calculateProfitLoss = function () {
    return this.totalBetAmount - this.totalPayout
}

// Instance method to get win percentage
starlineResultSchema.methods.getWinPercentage = function () {
    if (this.totalBets === 0) return 0
    return (this.winningBets / this.totalBets) * 100
}

// Static method to get results by date range
starlineResultSchema.statics.getResultsByDateRange = function (startDate, endDate, gameId = null) {
    const matchConditions = {
        gameDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    }

    if (gameId) {
        matchConditions.gameId = gameId
    }

    return this.find(matchConditions)
        .populate('gameId', 'gameName gameType')
        .populate('declaredBy', 'username')
        .sort({ gameDate: -1, declaredAt: -1 })
}

// Static method to get game statistics
starlineResultSchema.statics.getGameStatistics = function (gameId, startDate, endDate) {
    const matchConditions = { gameId: gameId }

    if (startDate && endDate) {
        matchConditions.gameDate = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    }

    return this.aggregate([
        { $match: matchConditions },
        {
            $group: {
                _id: null,
                totalResults: { $sum: 1 },
                totalBets: { $sum: '$totalBets' },
                totalBetAmount: { $sum: '$totalBetAmount' },
                totalPayout: { $sum: '$totalPayout' },
                totalWinningBets: { $sum: '$winningBets' },
                avgBetsPerResult: { $avg: '$totalBets' },
                avgPayoutPerResult: { $avg: '$totalPayout' }
            }
        }
    ])
}

// Static method to get recent results
starlineResultSchema.statics.getRecentResults = function (limit = 10) {
    return this.find({ status: 'completed' })
        .populate('gameId', 'gameName gameType')
        .sort({ declaredAt: -1 })
        .limit(limit)
}

module.exports = mongoose.model('StarlineResult', starlineResultSchema)