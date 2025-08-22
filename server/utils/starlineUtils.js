/**
 * Starline Gaming Utility Functions
 * Contains game logic, calculations, and helper functions for Starline games
 */

/**
 * Generate all possible single pana numbers (000-999)
 * @returns {Array} Array of all single pana numbers
 */
const generateSinglePanaNumbers = () => {
  const numbers = []
  for (let i = 0; i <= 999; i++) {
    numbers.push(i.toString().padStart(3, '0'))
  }
  return numbers
}

/**
 * Generate all possible double pana numbers
 * Double pana: numbers where exactly two digits are the same
 * @returns {Array} Array of all double pana numbers
 */
const generateDoublePanaNumbers = () => {
  const numbers = []
  for (let i = 0; i <= 999; i++) {
    const numStr = i.toString().padStart(3, '0')
    const digits = numStr.split('')

    // Count occurrences of each digit
    const digitCount = {}
    digits.forEach(digit => {
      digitCount[digit] = (digitCount[digit] || 0) + 1
    })

    // Check if exactly one digit appears twice (double pana)
    const counts = Object.values(digitCount)
    if (counts.includes(2) && counts.length === 2) {
      numbers.push(numStr)
    }
  }
  return numbers
}

/**
 * Generate all possible triple pana numbers
 * Triple pana: numbers where all three digits are the same
 * @returns {Array} Array of all triple pana numbers
 */
const generateTriplePanaNumbers = () => {
  const numbers = []
  for (let i = 0; i <= 9; i++) {
    numbers.push(i.toString().repeat(3))
  }
  return numbers
}

/**
 * Validate if a number is a valid single pana
 * @param {string} number - The number to validate
 * @returns {boolean} True if valid single pana
 */
const isValidSinglePana = (number) => {
  if (!number || typeof number !== 'string') return false
  return /^[0-9]{3}$/.test(number)
}

/**
 * Validate if a number is a valid double pana
 * @param {string} number - The number to validate
 * @returns {boolean} True if valid double pana
 */
const isValidDoublePana = (number) => {
  if (!isValidSinglePana(number)) return false

  const digits = number.split('')
  const digitCount = {}
  digits.forEach(digit => {
    digitCount[digit] = (digitCount[digit] || 0) + 1
  })

  const counts = Object.values(digitCount)
  return counts.includes(2) && counts.length === 2
}

/**
 * Validate if a number is a valid triple pana
 * @param {string} number - The number to validate
 * @returns {boolean} True if valid triple pana
 */
const isValidTriplePana = (number) => {
  if (!isValidSinglePana(number)) return false

  const digits = number.split('')
  return digits[0] === digits[1] && digits[1] === digits[2]
}

/**
 * Validate if a number is a valid single digit
 * @param {string} number - The number to validate
 * @returns {boolean} True if valid single digit
 */
const isValidSingleDigit = (number) => {
  if (!number || typeof number !== 'string') return false
  return /^[0-9]$/.test(number)
}

/**
 * Calculate payout for a winning bet
 * @param {number} betAmount - The amount bet
 * @param {number} multiplier - The payout multiplier
 * @returns {number} The payout amount
 */
const calculatePayout = (betAmount, multiplier) => {
  if (!betAmount || !multiplier || betAmount <= 0 || multiplier <= 0) return 0
  return Math.floor(betAmount * multiplier)
}

/**
 * Calculate potential win for a bet
 * @param {string} betType - Type of bet (single digit, single pana, etc.)
 * @param {number} betAmount - Amount being bet
 * @param {Object} rates - Rate configuration object
 * @returns {number} Potential win amount
 */
const calculatePotentialWin = (betType, betAmount, rates) => {
  if (!betAmount || betAmount <= 0) return 0

  const rateMultipliers = {
    'single digit': rates?.singleDigit || 9.5,
    'single pana': rates?.singlePana || 140,
    'double pana': rates?.doublePana || 280,
    'triple pana': rates?.triplePana || 700
  }

  const multiplier = rateMultipliers[betType]
  if (!multiplier) return 0

  return calculatePayout(betAmount, multiplier)
}

/**
 * Check if a bet wins based on the winning number
 * @param {string} betType - Type of bet
 * @param {string} betNumber - Number bet on
 * @param {string} winningNumber - The winning number
 * @returns {boolean} True if bet wins
 */
const checkBetWin = (betType, betNumber, winningNumber) => {
  if (!betType || !betNumber || !winningNumber) return false

  // Convert to strings to ensure consistent comparison
  const betNumberStr = String(betNumber).trim()
  const winningNumberStr = String(winningNumber).trim()

  switch (betType) {
    case 'single digit':
      // Check if the last digit of winning number matches
      return winningNumberStr.slice(-1) === betNumberStr
    case 'single pana':
    case 'double pana':
    case 'triple pana':
      // For all pana types, check exact match
      return winningNumberStr === betNumberStr
    default:
      return false
  }
}

/**
 * Generate a random winning number for testing
 * @returns {string} A random 3-digit winning number
 */
const generateRandomWinningNumber = () => {
  return Math.floor(Math.random() * 1000).toString().padStart(3, '0')
}

/**
 * Get the sum of digits in a number
 * @param {string|number} number - The number to sum
 * @returns {number} Sum of all digits
 */
const sumDigits = (number) => {
  const numStr = number.toString()
  return numStr.split('').reduce((sum, digit) => sum + parseInt(digit), 0)
}

/**
 * Convert sum to single digit (used in some game calculations)
 * @param {number} sum - The sum to convert
 * @returns {number} Single digit result
 */
const sumToSingleDigit = (sum) => {
  while (sum >= 10) {
    sum = sumDigits(sum)
  }
  return sum
}

/**
 * Get all possible numbers for a bet type
 * @param {string} betType - Type of bet
 * @returns {Array} Array of all possible numbers for that bet type
 */
const getPossibleNumbers = (betType) => {
  switch (betType) {
    case 'single digit':
      return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    case 'single pana':
      return generateSinglePanaNumbers()
    case 'double pana':
      return generateDoublePanaNumbers()
    case 'triple pana':
      return generateTriplePanaNumbers()
    default:
      return []
  }
}

/**
 * Calculate the probability of winning for a bet type
 * @param {string} betType - Type of bet
 * @returns {number} Probability as a decimal (0-1)
 */
const getWinProbability = (betType) => {
  const possibleNumbers = getPossibleNumbers(betType)
  const totalPossible = possibleNumbers.length

  switch (betType) {
    case 'single digit':
      return 1 / 10 // 10% chance
    case 'single pana':
      return 1 / 1000 // 0.1% chance
    case 'double pana':
      return 1 / totalPossible // Based on actual double pana count
    case 'triple pana':
      return 1 / 1000 // 0.1% chance (10 numbers out of 1000)
    default:
      return 0
  }
}

/**
 * Format time string to HH:MM format
 * @param {string} timeStr - Time string to format
 * @returns {string} Formatted time string
 */
const formatTime = (timeStr) => {
  if (!timeStr) return ''

  // If already in HH:MM format, return as is
  if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
    return timeStr
  }

  // Try to parse and format
  const time = new Date(`1970-01-01T${timeStr}`)
  if (isNaN(time.getTime())) return timeStr

  return time.toTimeString().slice(0, 5)
}

/**
 * Check if current time is within starline game hours (from start of day until open time)
 * @param {string} openTime - Game open time (HH:MM)
 * @param {Date} currentTime - Current time (optional, defaults to now)
 * @returns {boolean} True if within game hours (before or at open time)
 */
const isWithinGameHours = (openTime, currentTime = new Date()) => {
  if (!openTime) return false

  const currentTimeStr = currentTime.toTimeString().slice(0, 5)
  const currentMinutes = timeToMinutes(currentTimeStr)
  const openMinutes = timeToMinutes(openTime)

  // Starline games are open from start of day (00:00) until open time
  return currentMinutes <= openMinutes
}

/**
 * Convert time string to minutes since midnight
 * @param {string} timeStr - Time in HH:MM format
 * @returns {number} Minutes since midnight
 */
const timeToMinutes = (timeStr) => {
  if (!timeStr || !timeStr.includes(':')) return 0

  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Get game status based on current time and result status
 * @param {Object} game - Game object with openTime
 * @param {Date} currentTime - Current time (optional)
 * @param {boolean} hasResultToday - Whether result has been declared today (optional)
 * @returns {string} Game status: 'closed', 'open', 'result_declared'
 */
const getGameStatus = (game, currentTime = new Date(), hasResultToday = false) => {
  if (!game || !game.openTime) {
    return 'closed'
  }

  // If result has been declared today, game is closed regardless of time
  if (hasResultToday) {
    return 'result_declared'
  }

  const currentTimeStr = currentTime.toTimeString().slice(0, 5)
  const currentMinutes = timeToMinutes(currentTimeStr)
  const openMinutes = timeToMinutes(game.openTime)

  // Starline games are open from start of day (00:00) until open time, then closed
  if (currentMinutes <= openMinutes) {
    return 'open'
  } else {
    return 'closed'
  }
}

module.exports = {
  // Number generation functions
  generateSinglePanaNumbers,
  generateDoublePanaNumbers,
  generateTriplePanaNumbers,

  // Validation functions
  isValidSinglePana,
  isValidDoublePana,
  isValidTriplePana,
  isValidSingleDigit,

  // Calculation functions
  calculatePayout,
  calculatePotentialWin,
  checkBetWin,

  // Utility functions
  generateRandomWinningNumber,
  sumDigits,
  sumToSingleDigit,
  getPossibleNumbers,
  getWinProbability,

  // Time and status functions
  formatTime,
  isWithinGameHours,
  timeToMinutes,
  getGameStatus
}