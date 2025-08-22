/**
 * Unit tests for Starline utility functions
 */

const {
  generateSinglePanaNumbers,
  generateDoublePanaNumbers,
  generateTriplePanaNumbers,
  isValidSinglePana,
  isValidDoublePana,
  isValidTriplePana,
  isValidSingleDigit,
  calculatePayout,
  calculatePotentialWin,
  checkBetWin,
  generateRandomWinningNumber,
  sumDigits,
  sumToSingleDigit,
  getPossibleNumbers,
  getWinProbability,
  formatTime,
  isWithinGameHours,
  timeToMinutes,
  getGameStatus
} = require('../utils/starlineUtils')

describe('Starline Utils - Number Generation', () => {
  test('generateSinglePanaNumbers should return 1000 numbers', () => {
    const numbers = generateSinglePanaNumbers()
    expect(numbers).toHaveLength(1000)
    expect(numbers[0]).toBe('000')
    expect(numbers[999]).toBe('999')
  })

  test('generateTriplePanaNumbers should return 10 numbers', () => {
    const numbers = generateTriplePanaNumbers()
    expect(numbers).toHaveLength(10)
    expect(numbers).toContain('000')
    expect(numbers).toContain('111')
    expect(numbers).toContain('999')
  })

  test('generateDoublePanaNumbers should return valid double pana numbers', () => {
    const numbers = generateDoublePanaNumbers()
    expect(numbers.length).toBeGreaterThan(0)
    
    // Test a few known double pana numbers
    expect(numbers).toContain('001') // 0 appears twice
    expect(numbers).toContain('112') // 1 appears twice
    expect(numbers).not.toContain('123') // All different digits
    expect(numbers).not.toContain('111') // All same digits (triple pana)
  })
})

describe('Starline Utils - Validation', () => {
  test('isValidSingleDigit should validate single digits', () => {
    expect(isValidSingleDigit('0')).toBe(true)
    expect(isValidSingleDigit('5')).toBe(true)
    expect(isValidSingleDigit('9')).toBe(true)
    expect(isValidSingleDigit('10')).toBe(false)
    expect(isValidSingleDigit('a')).toBe(false)
    expect(isValidSingleDigit('')).toBe(false)
    expect(isValidSingleDigit(null)).toBe(false)
  })

  test('isValidSinglePana should validate 3-digit numbers', () => {
    expect(isValidSinglePana('000')).toBe(true)
    expect(isValidSinglePana('123')).toBe(true)
    expect(isValidSinglePana('999')).toBe(true)
    expect(isValidSinglePana('12')).toBe(false)
    expect(isValidSinglePana('1234')).toBe(false)
    expect(isValidSinglePana('abc')).toBe(false)
  })

  test('isValidDoublePana should validate double pana numbers', () => {
    expect(isValidDoublePana('001')).toBe(true) // 0 appears twice
    expect(isValidDoublePana('112')).toBe(true) // 1 appears twice
    expect(isValidDoublePana('223')).toBe(true) // 2 appears twice
    expect(isValidDoublePana('123')).toBe(false) // All different
    expect(isValidDoublePana('111')).toBe(false) // All same (triple pana)
    expect(isValidDoublePana('12')).toBe(false) // Too short
  })

  test('isValidTriplePana should validate triple pana numbers', () => {
    expect(isValidTriplePana('000')).toBe(true)
    expect(isValidTriplePana('111')).toBe(true)
    expect(isValidTriplePana('999')).toBe(true)
    expect(isValidTriplePana('112')).toBe(false) // Double pana
    expect(isValidTriplePana('123')).toBe(false) // All different
  })
})

describe('Starline Utils - Calculations', () => {
  test('calculatePayout should calculate correct payout', () => {
    expect(calculatePayout(100, 9.5)).toBe(950)
    expect(calculatePayout(50, 140)).toBe(7000)
    expect(calculatePayout(0, 9.5)).toBe(0)
    expect(calculatePayout(100, 0)).toBe(0)
    expect(calculatePayout(-100, 9.5)).toBe(0)
  })

  test('calculatePotentialWin should calculate potential wins', () => {
    const rates = {
      singleDigit: 9.5,
      singlePana: 140,
      doublePana: 280,
      triplePana: 700
    }

    expect(calculatePotentialWin('single digit', 100, rates)).toBe(950)
    expect(calculatePotentialWin('single pana', 100, rates)).toBe(14000)
    expect(calculatePotentialWin('double pana', 100, rates)).toBe(28000)
    expect(calculatePotentialWin('triple pana', 100, rates)).toBe(70000)
    expect(calculatePotentialWin('invalid type', 100, rates)).toBe(0)
  })

  test('checkBetWin should check winning bets correctly', () => {
    // Single digit wins
    expect(checkBetWin('single digit', '5', '125')).toBe(true)
    expect(checkBetWin('single digit', '5', '124')).toBe(false)

    // Pana wins (exact match)
    expect(checkBetWin('single pana', '123', '123')).toBe(true)
    expect(checkBetWin('single pana', '123', '124')).toBe(false)
    expect(checkBetWin('double pana', '112', '112')).toBe(true)
    expect(checkBetWin('triple pana', '777', '777')).toBe(true)
  })
})

describe('Starline Utils - Helper Functions', () => {
  test('sumDigits should sum all digits in a number', () => {
    expect(sumDigits(123)).toBe(6)
    expect(sumDigits('456')).toBe(15)
    expect(sumDigits(0)).toBe(0)
    expect(sumDigits(999)).toBe(27)
  })

  test('sumToSingleDigit should reduce to single digit', () => {
    expect(sumToSingleDigit(15)).toBe(6) // 1+5=6
    expect(sumToSingleDigit(27)).toBe(9) // 2+7=9
    expect(sumToSingleDigit(99)).toBe(9) // 9+9=18, 1+8=9
    expect(sumToSingleDigit(5)).toBe(5) // Already single digit
  })

  test('generateRandomWinningNumber should generate valid 3-digit number', () => {
    const number = generateRandomWinningNumber()
    expect(number).toMatch(/^[0-9]{3}$/)
    expect(number.length).toBe(3)
  })

  test('getPossibleNumbers should return correct arrays', () => {
    expect(getPossibleNumbers('single digit')).toHaveLength(10)
    expect(getPossibleNumbers('single pana')).toHaveLength(1000)
    expect(getPossibleNumbers('triple pana')).toHaveLength(10)
    expect(getPossibleNumbers('invalid')).toHaveLength(0)
  })

  test('getWinProbability should return correct probabilities', () => {
    expect(getWinProbability('single digit')).toBe(0.1)
    expect(getWinProbability('single pana')).toBe(0.001)
    expect(getWinProbability('invalid')).toBe(0)
  })
})

describe('Starline Utils - Time Functions', () => {
  test('formatTime should format time strings correctly', () => {
    expect(formatTime('09:30')).toBe('09:30')
    expect(formatTime('23:59')).toBe('23:59')
    expect(formatTime('')).toBe('')
  })

  test('timeToMinutes should convert time to minutes', () => {
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('01:30')).toBe(90)
    expect(timeToMinutes('12:00')).toBe(720)
    expect(timeToMinutes('23:59')).toBe(1439)
  })

  test('isWithinGameHours should check if time is within game hours', () => {
    const testTime = new Date('2023-01-01T10:30:00')
    
    expect(isWithinGameHours('09:00', '12:00', testTime)).toBe(true)
    expect(isWithinGameHours('11:00', '12:00', testTime)).toBe(false)
    expect(isWithinGameHours('08:00', '10:00', testTime)).toBe(false)
  })

  test('getGameStatus should return correct status', () => {
    const game = {
      openTime: '09:00',
      closeTime: '12:00',
      resultTime: '13:00'
    }

    // Before opening
    let testTime = new Date('2023-01-01T08:30:00')
    expect(getGameStatus(game, testTime)).toBe('closed')

    // During betting hours
    testTime = new Date('2023-01-01T10:30:00')
    expect(getGameStatus(game, testTime)).toBe('open')

    // After betting closed, before result
    testTime = new Date('2023-01-01T12:30:00')
    expect(getGameStatus(game, testTime)).toBe('betting_closed')

    // After result time
    testTime = new Date('2023-01-01T14:00:00')
    expect(getGameStatus(game, testTime)).toBe('result_pending')
  })
})