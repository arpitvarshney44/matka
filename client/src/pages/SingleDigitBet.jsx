import React from 'react'
import BettingBase from '../components/BettingBase'

const SingleDigitBet = () => {
  return (
    <BettingBase
      betType="single"
      title="Single Digit Betting"
      description="Bet on a single digit (0-9) for the chosen session"
      inputPlaceholder="Enter digit (0-9)"
    >
      {({ betNumber, setBetNumber, errors, inputPlaceholder }) => (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Single Digit
          </label>
          
          {/* Quick number selection buttons */}
          <div className="grid grid-cols-5 gap-2 mb-3">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => setBetNumber(digit.toString())}
                className={`py-2 px-3 rounded-md font-medium transition-colors duration-200 ${
                  betNumber === digit.toString()
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {digit}
              </button>
            ))}
          </div>
          
          {/* Manual input */}
          <input
            type="text"
            value={betNumber}
            onChange={(e) => {
              const value = e.target.value
              // Only allow single digits
              if (value === '' || (value.length === 1 && /^\d$/.test(value))) {
                setBetNumber(value)
              }
            }}
            placeholder={inputPlaceholder}
            maxLength="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          {errors.number && (
            <p className="text-red-500 text-xs mt-1">{errors.number}</p>
          )}
          
          <div className="mt-2 text-xs text-gray-500">
            💡 Tip: Click on a number above or type it manually
          </div>
        </div>
      )}
    </BettingBase>
  )
}

export default SingleDigitBet
