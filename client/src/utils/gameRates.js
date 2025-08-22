// Shared game rate helpers
// A rate is defined by { min, max } meaning: investing `min` returns `max` (gross) on a win.
// From this we derive multiplier, ROI%, and can scale payouts for any stake.

/**
 * Compute metrics for a {min, max} gamerate.
 * - multiplier = max / min (gross return per 1 currency invested)
 * - roiPercent = ((max - min) / min) * 100
 * - payoutForStake(stake) = (stake / min) * max
 */
export function computeRateMetrics(min, max) {
  if (typeof min !== 'number' || typeof max !== 'number' || min <= 0 || max <= 0) {
    return { multiplier: 0, roiPercent: 0, payoutForStake: () => 0 };
  }
  const multiplier = max / min;
  const roiPercent = ((max - min) / min) * 100;
  const payoutForStake = (stake) => {
    const s = Number(stake) || 0;
    if (s <= 0) return 0;
    return (s / min) * max;
  };
  return { multiplier, roiPercent, payoutForStake };
}

/**
 * Convenience to compute payout for a given rate and stake directly.
 */
export function payoutFromRate(min, max, stake) {
  if (!min || !max || !stake) return 0;
  return (Number(stake) / Number(min)) * Number(max);
}

/**
 * Calculate payout for a bet type using min and max game rates
 * @param {number} betAmount - The bet amount
 * @param {string} betType - The bet type
 * @param {object} gameRates - Game rates object with min/max rates for each bet type
 * @returns {object} - {minPayout: number, maxPayout: number, minROI: number, maxROI: number}
 */
export const calculatePayout = (betAmount, betType, gameRates) => {
  if (!betAmount || !betType || !gameRates) {
    return { minPayout: 0, maxPayout: 0, minROI: 0, maxROI: 0 };
  }

  // Get min and max rates for the bet type
  let minRate = 0;
  let maxRate = 0;

  switch (betType) {
    case 'single':
      minRate = gameRates.singleDigitMin || 0;
      maxRate = gameRates.singleDigitMax || 0;
      break;
    case 'jodi':
      minRate = gameRates.jodiMin || 0;
      maxRate = gameRates.jodiMax || 0;
      break;
    case 'single_panna':
      minRate = gameRates.singlePannaMin || 0;
      maxRate = gameRates.singlePannaMax || 0;
      break;
    case 'double_panna':
      minRate = gameRates.doublePannaMin || 0;
      maxRate = gameRates.doublePannaMax || 0;
      break;
    case 'triple_panna':
      minRate = gameRates.triplePannaMin || 0;
      maxRate = gameRates.triplePannaMax || 0;
      break;
    case 'half_sangam_open':
    case 'half_sangam_close':
      minRate = gameRates.halfSangamMin || 0;
      maxRate = gameRates.halfSangamMax || 0;
      break;
    case 'full_sangam':
      minRate = gameRates.fullSangamMin || 0;
      maxRate = gameRates.fullSangamMax || 0;
      break;
    default:
      return { minPayout: 0, maxPayout: 0, minROI: 0, maxROI: 0 };
  }

  // Calculate payouts directly
  const minPayout = betAmount * minRate;
  const maxPayout = betAmount * maxRate;

  // Calculate ROI (Return on Investment) as percentage
  const minROI = minRate > 0 ? ((minPayout - betAmount) / betAmount) * 100 : 0;
  const maxROI = maxRate > 0 ? ((maxPayout - betAmount) / betAmount) * 100 : 0;

  return {
    minPayout: Math.round(minPayout),
    maxPayout: Math.round(maxPayout),
    minROI: Math.round(minROI),
    maxROI: Math.round(maxROI)
  };
};

/**
 * Get display range for payout
 * @param {number} betAmount - The bet amount
 * @param {string} betType - The bet type
 * @param {object} gameRates - Game rates object with nested structure
 * @returns {string} - Formatted payout range (e.g., "₹900 - ₹950")
 */
export const getPayoutRange = (betAmount, betType, gameRates) => {
  // Debug logging
  console.log('getPayoutRange called with:', { betAmount, betType, gameRates });
  
  if (!betAmount || !betType || !gameRates) {
    console.log('Missing required parameters:', { betAmount, betType, gameRates });
    return '₹0';
  }

  // Map bet types to game rates keys
  const rateMap = {
    'single': 'singleDigit',
    'jodi': 'jodiDigit', 
    'single_panna': 'singlePana',
    'singlePanna': 'singlePana',
    'double_panna': 'doublePana',
    'doublePanna': 'doublePana',
    'triple_panna': 'triplePana',
    'triplePanna': 'triplePana',
    'half_sangam': 'halfSangam',
    'halfSangam': 'halfSangam',
    'full_sangam': 'fullSangam',
    'fullSangam': 'fullSangam'
  };

  const rateKey = rateMap[betType];
  console.log('Rate mapping:', { betType, rateKey, availableKeys: Object.keys(gameRates) });
  
  if (!rateKey || !gameRates[rateKey]) {
    console.log('Rate key not found or invalid:', { rateKey, hasKey: !!gameRates[rateKey] });
    return '₹0';
  }

  const rate = gameRates[rateKey];
  console.log('Found rate:', rate);
  
  if (!rate.min || !rate.max) {
    console.log('Invalid rate structure:', { min: rate.min, max: rate.max });
    return '₹0';
  }

  // Calculate payout: (betAmount / rate.min) * rate.max
  const payout = Math.round((betAmount / rate.min) * rate.max);
  console.log('Calculated payout:', { betAmount, rateMin: rate.min, rateMax: rate.max, payout });
  
  return `₹${payout}`;
};

/**
 * Validate bet amount against minimum and maximum limits
 * @param {number} amount - The bet amount to validate
 * @param {number} minBet - Minimum bet amount allowed
 * @param {number} maxBet - Maximum bet amount allowed
 * @param {number} userBalance - User's current balance
 * @returns {object} - {valid: boolean, message: string}
 */
export const validateBetAmount = (amount, minBet = 10, maxBet = 10000, userBalance = 0) => {
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return { valid: false, message: 'Please enter a valid bet amount' };
  }
  
  if (numAmount < minBet) {
    return { valid: false, message: `Minimum bet amount is ₹${minBet}` };
  }
  
  if (numAmount > maxBet) {
    return { valid: false, message: `Maximum bet amount is ₹${maxBet}` };
  }
  
  if (numAmount > userBalance) {
    return { valid: false, message: 'Insufficient balance' };
  }
  
  return { valid: true, message: '' };
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

