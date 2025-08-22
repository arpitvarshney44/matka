const mongoose = require('mongoose')

const howToPlaySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    default: `# How to Play Raj Kalyan Matka

## Welcome to Raj Kalyan Matka!

Raj Kalyan Matka is an exciting number-based game where you can test your luck and win big prizes.

## Basic Rules

### 1. Game Types
- **Single Digit**: Choose a single number (0-9)
- **Jodi Digit**: Choose two numbers (00-99)
- **Single Pana**: Choose three numbers (000-999)
- **Double Pana**: Choose six numbers
- **Triple Pana**: Choose nine numbers
- **Half Sangam**: Choose combination of numbers
- **Full Sangam**: Choose full combination

### 2. How to Place Bets
1. Select your preferred game type
2. Choose your numbers
3. Enter your bet amount
4. Confirm your bet before the game closes

### 3. Winning Rules
- **Single Digit**: Win if your number matches the result
- **Jodi Digit**: Win if your two numbers match the result
- **Pana Games**: Win if your numbers match the result pattern
- **Sangam Games**: Win if your combination matches the result

### 4. Game Timings
- **Morning Games**: 9:00 AM - 10:00 AM
- **Day Games**: 2:00 PM - 3:00 PM
- **Evening Games**: 8:00 PM - 9:00 PM

### 5. Important Notes
- All bets must be placed before the game closing time
- Results are declared immediately after game closes
- Winnings are credited to your wallet automatically
- Minimum bet amount: ₹10
- Maximum bet amount: ₹10,000

## Contact Support
If you have any questions, please contact our support team:
- WhatsApp: +91-XXXXXXXXXX
- Phone: +91-XXXXXXXXXX

**Play responsibly and good luck!**`
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    default: 'Admin'
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('HowToPlay', howToPlaySchema) 