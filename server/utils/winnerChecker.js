/**
 * Robust winner checking utility
 * Handles various data type and format issues
 */

const checkWinnerMatch = (betType, betNumber, pana, digit) => {
    // Convert all inputs to strings and trim
    const betNumberStr = String(betNumber || '').trim()
    const panaStr = String(pana || '').trim()
    const digitStr = String(digit || '').trim()

    console.log(`Checking: betType=${betType}, betNumber="${betNumberStr}", pana="${panaStr}", digit="${digitStr}"`)

    switch (betType) {
        case 'single':
            // Single digit match
            const match = digitStr === betNumberStr
            console.log(`Single match: "${digitStr}" === "${betNumberStr}" = ${match}`)
            return match

        case 'singlePanna':
        case 'doublePanna':
        case 'triplePanna':
            // Pana match
            const panaMatch = panaStr === betNumberStr
            console.log(`Pana match: "${panaStr}" === "${betNumberStr}" = ${panaMatch}`)
            return panaMatch

        case 'jodi':
            // Jodi requires both open and close results
            // For now, return false as this needs special handling
            console.log(`Jodi bet - requires special handling`)
            return false

        default:
            console.log(`Unknown bet type: ${betType}`)
            return false
    }
}

const calculateWinAmount = (betType, betAmount) => {
    const multipliers = {
        'single': 10,
        'singlePanna': 140,
        'doublePanna': 280,
        'triplePanna': 700,
        'jodi': 90,
        'halfSangam': 1000,
        'fullSangam': 10000
    }

    const multiplier = multipliers[betType] || 0
    return Math.round(betAmount * multiplier)
}

module.exports = {
    checkWinnerMatch,
    calculateWinAmount
}