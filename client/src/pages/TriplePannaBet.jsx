import React from 'react'
import BettingBase from '../components/BettingBase'
import { classifyPanna } from '../utils/matka'

const TriplePannaBet = () => {
  return (
    <BettingBase
      betType="triple_panna"
      title="Triple Panna Betting"
      description="Bet on a 3-digit triple panna (all digits same)"
      inputPlaceholder="Enter 3-digit triple panna (e.g., 111)"
    >
      {({ betNumber, setBetNumber, errors, inputPlaceholder }) => (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Triple Panna Number
          </label>
          
          {/* Quick triple selection buttons */}
          <div className="grid grid-cols-5 gap-2 mb-3">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
              const tripleNumber = `${digit}${digit}${digit}`;
              return (
                <button
                  key={digit}
                  type="button"
                  onClick={() => setBetNumber(tripleNumber)}
                  className={`py-2 px-3 rounded-md font-medium transition-colors duration-200 ${
                    betNumber === tripleNumber
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tripleNumber}
                </button>
              );
            })}
          </div>
          
          {/* Manual input */}
          <input
            type="text"
            value={betNumber}
            onChange={(e) => {
              const value = e.target.value
              // Only allow 3-digit numbers
              if (value === '' || (/^\d{1,3}$/.test(value) && parseInt(value) <= 999)) {
                setBetNumber(value)
              }
            }}
            placeholder={inputPlaceholder}
            maxLength="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          {errors.number && (
            <p className="text-red-500 text-xs mt-1">{errors.number}</p>
          )}
          
          {/* Show panna type validation */}
          {betNumber && betNumber.length === 3 && (
            <div className="mt-2 p-2 rounded-md text-xs">
              {classifyPanna(betNumber) === 'triple' ? (
                <div className="text-green-600 bg-green-50 p-2 rounded">
                  ✅ Valid Triple Panna (all digits same)
                </div>
              ) : (
                <div className="text-red-600 bg-red-50 p-2 rounded">
                  ❌ This is a {classifyPanna(betNumber)} panna. Triple panna requires all three digits to be the same.
                </div>
              )}
            </div>
          )}
          
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <div>💡 Triple Panna: All three digits must be the same</div>
            <div>📝 Valid numbers: 000, 111, 222, 333, 444, 555, 666, 777, 888, 999</div>
            <div>🎯 Click on a number above or type it manually</div>
          </div>
        </div>
      )}
    </BettingBase>
  )
}

export default TriplePannaBet
