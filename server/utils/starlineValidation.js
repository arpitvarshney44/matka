/**
 * Starline Gaming Validation Functions
 * Contains input validation helpers for Starline games
 */

const { body, param, query } = require('express-validator')
const StarlineGame = require('../models/StarlineGame')
const StarlineGameRate = require('../models/StarlineGameRate')
const { isValidSingleDigit, isValidSinglePana, isValidDoublePana, isValidTriplePana } = require('./starlineUtils')

/**
 * Validation rules for creating a new Starline game
 */
const validateCreateGame = [
  body('gameName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Game name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Game name can only contain letters, numbers, spaces, hyphens, and underscores')
    .custom(async (value) => {
      const existingGame = await StarlineGame.findOne({ gameName: value })
      if (existingGame) {
        throw new Error('Game name already exists')
      }
      return true
    }),

  body('gameNameHindi')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Hindi game name cannot exceed 50 characters'),

  body('openTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Open time must be in HH:MM format'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
]

/**
 * Validation rules for updating a Starline game
 */
const validateUpdateGame = [
  param('id')
    .isMongoId()
    .withMessage('Invalid game ID'),

  body('gameName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Game name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Game name can only contain letters, numbers, spaces, hyphens, and underscores'),

  body('gameNameHindi')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Hindi game name cannot exceed 50 characters'),

  body('openTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Open time must be in HH:MM format'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Active status must be boolean'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
]

/**
 * Validation rules for placing a Starline bet
 */
const validatePlaceBet = [
  body('gameId')
    .isMongoId()
    .withMessage('Invalid game ID')
    .custom(async (value) => {
      const game = await StarlineGame.findById(value)
      if (!game) {
        throw new Error('Game not found')
      }
      if (!game.isActive) {
        throw new Error('Game is not active')
      }
      return true
    }),

  body('betType')
    .isIn(['single digit', 'single pana', 'double pana', 'triple pana'])
    .withMessage('Invalid bet type'),

  body('betNumber')
    .custom((value, { req }) => {
      const betType = req.body.betType

      switch (betType) {
        case 'single digit':
          if (!isValidSingleDigit(value)) {
            throw new Error('Invalid single digit number')
          }
          break
        case 'single pana':
          if (!isValidSinglePana(value)) {
            throw new Error('Invalid single pana number')
          }
          break
        case 'double pana':
          if (!isValidDoublePana(value)) {
            throw new Error('Invalid double pana number')
          }
          break
        case 'triple pana':
          if (!isValidTriplePana(value)) {
            throw new Error('Invalid triple pana number')
          }
          break
        default:
          throw new Error('Invalid bet type for number validation')
      }

      return true
    }),

  body('betAmount')
    .isInt({ min: 1 })
    .withMessage('Bet amount must be at least 1')
    .custom(async (value, { req }) => {
      const gameId = req.body.gameId
      const game = await StarlineGame.findById(gameId)

      if (game) {
        if (value < game.minBet) {
          throw new Error(`Bet amount must be at least ${game.minBet}`)
        }
        if (value > game.maxBet) {
          throw new Error(`Bet amount cannot exceed ${game.maxBet}`)
        }
      }

      return true
    })
]

/**
 * Validation rules for declaring a result
 */
const validateDeclareResult = [
  body('gameId')
    .isMongoId()
    .withMessage('Invalid game ID')
    .custom(async (value) => {
      const game = await StarlineGame.findById(value)
      if (!game) {
        throw new Error('Game not found')
      }
      return true
    }),

  body('winningNumber')
    .matches(/^[0-9]{3}$/)
    .withMessage('Winning number must be a 3-digit number'),

  body('gameDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid game date format')
]

/**
 * Validation rules for creating/updating rates
 */
const validateRate = [
  body('gameType')
    .isIn(['single digit', 'single pana', 'double pana', 'triple pana'])
    .withMessage('Invalid game type'),

  body('rateName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Rate name must be between 2 and 50 characters'),

  body('multiplier')
    .isFloat({ min: 1, max: 10000 })
    .withMessage('Multiplier must be between 1 and 10000'),

  body('minBetAmount')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Minimum bet amount must be between 1 and 10000'),

  body('maxBetAmount')
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage('Maximum bet amount must be between 1 and 100000'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),

  body('validFrom')
    .optional()
    .isISO8601()
    .withMessage('Invalid valid from date format'),

  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Invalid valid until date format')
]

/**
 * Validation rules for query parameters
 */
const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('gameId')
    .optional()
    .isMongoId()
    .withMessage('Invalid game ID'),

  query('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID'),

  query('status')
    .optional()
    .isIn(['pending', 'won', 'lost', 'cancelled'])
    .withMessage('Invalid status'),

  query('betType')
    .optional()
    .isIn(['single digit', 'single pana', 'double pana', 'triple pana'])
    .withMessage('Invalid bet type'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
]

/**
 * Validation rules for MongoDB ObjectId parameters
 */
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
]

/**
 * Custom validation function to check if bet number matches bet type
 * @param {string} betNumber - The bet number to validate
 * @param {string} betType - The bet type
 * @returns {boolean} True if valid combination
 */
const isValidBetNumberForType = (betNumber, betType) => {
  switch (betType) {
    case 'single digit':
      return isValidSingleDigit(betNumber)
    case 'single pana':
      return isValidSinglePana(betNumber)
    case 'double pana':
      return isValidDoublePana(betNumber)
    case 'triple pana':
      return isValidTriplePana(betNumber)
    default:
      return false
  }
}

/**
 * Custom validation function to check time format
 * @param {string} openTime - Game open time
 * @returns {boolean} True if time is valid
 */
const isValidTimeSequence = (openTime) => {
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Just validate that the time format is correct
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(openTime)
}

/**
 * Sanitize and format bet number based on bet type
 * @param {string} betNumber - Raw bet number
 * @param {string} betType - Bet type
 * @returns {string} Formatted bet number
 */
const formatBetNumber = (betNumber, betType) => {
  if (!betNumber) return ''

  const cleanNumber = betNumber.toString().replace(/\D/g, '')

  switch (betType) {
    case 'single digit':
      return cleanNumber.slice(-1)
    case 'single pana':
    case 'double pana':
    case 'triple pana':
      return cleanNumber.padStart(3, '0').slice(-3)
    default:
      return cleanNumber
  }
}

module.exports = {
  // Validation rule arrays
  validateCreateGame,
  validateUpdateGame,
  validatePlaceBet,
  validateDeclareResult,
  validateRate,
  validateQueryParams,
  validateObjectId,

  // Custom validation functions
  isValidBetNumberForType,
  isValidTimeSequence,
  formatBetNumber
}