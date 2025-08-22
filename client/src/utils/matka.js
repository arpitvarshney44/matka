// Matka utility functions for client-side use

/**
 * Convert sum to digit (0-9)
 * @param {number} sum - The sum to convert
 * @returns {number} - Digit between 0-9
 */
export const sumToDigit = (sum) => {
  return sum % 10;
};

/**
 * Build jodi from two digits
 * @param {number} digit1 - First digit (0-9)
 * @param {number} digit2 - Second digit (0-9)
 * @returns {string} - Two-digit jodi string
 */
export const buildJodi = (digit1, digit2) => {
  return `${digit1}${digit2}`;
};

/**
 * Classify panna type
 * @param {string} panna - 3-digit panna string
 * @returns {string} - 'single', 'double', or 'triple'
 */
export const classifyPanna = (panna) => {
  const digits = panna.split('').sort();
  
  if (digits[0] === digits[1] && digits[1] === digits[2]) {
    return 'triple';
  } else if (digits[0] === digits[1] || digits[1] === digits[2] || digits[0] === digits[2]) {
    return 'double';
  } else {
    return 'single';
  }
};

/**
 * Validate bet number for different bet types
 * @param {string} betType - Type of bet
 * @param {string} betNumber - The bet number to validate
 * @returns {object} - {valid: boolean, message: string}
 */
export const validateBetNumber = (betType, betNumber) => {
  switch (betType) {
    case 'single':
      if (!/^\d$/.test(betNumber)) {
        return { valid: false, message: 'Single digit must be a number between 0-9' };
      }
      const digit = parseInt(betNumber);
      if (digit < 0 || digit > 9) {
        return { valid: false, message: 'Single digit must be between 0-9' };
      }
      return { valid: true, message: '' };

    case 'jodi':
      if (!/^\d{2}$/.test(betNumber)) {
        return { valid: false, message: 'Jodi must be a 2-digit number' };
      }
      return { valid: true, message: '' };

    case 'single_panna':
    case 'double_panna':
    case 'triple_panna':
      if (!/^\d{3}$/.test(betNumber)) {
        return { valid: false, message: 'Panna must be a 3-digit number' };
      }
      const expectedType = betType.replace('_panna', '');
      const actualType = classifyPanna(betNumber);
      if (actualType !== expectedType) {
        return { 
          valid: false, 
          message: `This is a ${actualType} panna, but you selected ${expectedType} panna` 
        };
      }
      return { valid: true, message: '' };

    case 'half_sangam_open':
    case 'half_sangam_close':
      const parts = betNumber.split('-');
      if (parts.length !== 2) {
        return { valid: false, message: 'Half sangam format: digit-panna (e.g., 5-123)' };
      }
      const [digitPart, pannaPart] = parts;
      if (!/^\d$/.test(digitPart) || !/^\d{3}$/.test(pannaPart)) {
        return { valid: false, message: 'Half sangam format: digit-panna (e.g., 5-123)' };
      }
      return { valid: true, message: '' };

    case 'full_sangam':
      const fullParts = betNumber.split('-');
      if (fullParts.length !== 2) {
        return { valid: false, message: 'Full sangam format: panna-panna (e.g., 123-456)' };
      }
      const [panna1, panna2] = fullParts;
      if (!/^\d{3}$/.test(panna1) || !/^\d{3}$/.test(panna2)) {
        return { valid: false, message: 'Full sangam format: panna-panna (e.g., 123-456)' };
      }
      return { valid: true, message: '' };

    default:
      return { valid: false, message: 'Unknown bet type' };
  }
};

/**
 * Format bet number for display
 * @param {string} betType - Type of bet
 * @param {string} betNumber - The bet number
 * @returns {string} - Formatted bet number
 */
export const formatBetNumber = (betType, betNumber) => {
  switch (betType) {
    case 'single':
      return `${betNumber} (Single Digit)`;
    case 'jodi':
      return `${betNumber} (Jodi)`;
    case 'single_panna':
      return `${betNumber} (Single Panna)`;
    case 'double_panna':
      return `${betNumber} (Double Panna)`;
    case 'triple_panna':
      return `${betNumber} (Triple Panna)`;
    case 'half_sangam_open':
      return `${betNumber} (Half Sangam - Open)`;
    case 'half_sangam_close':
      return `${betNumber} (Half Sangam - Close)`;
    case 'full_sangam':
      return `${betNumber} (Full Sangam)`;
    default:
      return betNumber;
  }
};

/**
 * Get bet type display name
 * @param {string} betType - Type of bet
 * @returns {string} - Human readable bet type name
 */
export const getBetTypeDisplayName = (betType) => {
  const typeMap = {
    'single': 'Single Digit',
    'jodi': 'Jodi Digit',
    'single_panna': 'Single Panna',
    'double_panna': 'Double Panna',
    'triple_panna': 'Triple Panna',
    'half_sangam_open': 'Half Sangam (Open)',
    'half_sangam_close': 'Half Sangam (Close)',
    'full_sangam': 'Full Sangam'
  };
  
  return typeMap[betType] || betType;
};

/**
 * Get session display name
 * @param {string} session - Session type ('open' or 'close')
 * @returns {string} - Human readable session name
 */
export const getSessionDisplayName = (session) => {
  return session === 'open' ? 'Open' : 'Close';
};

/**
 * Format current date for bet placement
 * @returns {string} - Date in ISO8601 format
 */
export const getCurrentDate = () => {
  const today = new Date();
  // Set time to 00:00:00 for the current date
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
};

/**
 * Check if betting is allowed for a game session
 * @param {string} openTime - Game open time (HH:MM format)
 * @param {string} closeTime - Game close time (HH:MM format)
 * @param {string} session - Session type ('open' or 'close')
 * @returns {object} - {allowed: boolean, message: string}
 */
export const isBettingAllowed = (openTime, closeTime, session) => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  // Convert time strings to minutes for comparison
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const currentMinutes = timeToMinutes(currentTime);
  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);
  
  if (session === 'open') {
    // Open session betting allowed from start of day until open time
    if (currentMinutes < openMinutes) {
      return { allowed: true, message: 'Open session betting is available' };
    } else {
      return { allowed: false, message: 'Open session betting has closed' };
    }
  } else {
    // Close session betting allowed from start of day until close time
    if (currentMinutes <= closeMinutes) {
      return { allowed: true, message: 'Close session betting is available' };
    } else {
      return { allowed: false, message: 'Close session betting has closed' };
    }
  }
};
