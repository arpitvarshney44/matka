import React from 'react'
import BettingBase from '../components/BettingBase'
import { classifyPanna } from '../utils/matka'

const SinglePannaBet = () => {
  return (
    <BettingBase
      betType="single_panna"
      title="Single Panna Betting"
      description="Bet on a 3-digit single panna (all digits different)"
      inputPlaceholder="Enter 3-digit single panna (e.g., 123)"
    >
      {({ betNumber, setBetNumber, errors, inputPlaceholder }) => (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Single Panna Number
          </label>
          
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
              {classifyPanna(betNumber) === 'single' ? (
                <div className="text-green-600 bg-green-50 p-2 rounded">
                  ✅ Valid Single Panna (all digits different)
                </div>
              ) : (
                <div className="text-red-600 bg-red-50 p-2 rounded">
                  ❌ This is a {classifyPanna(betNumber)} panna. Single panna requires all different digits.
                </div>
              )}
            </div>
          )}
          
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <div>💡 Single Panna: All three digits must be different</div>
            <div>📝 Examples: 123, 456, 789, 024, 135</div>
          </div>
          
          {/* Example single pannas */}
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-600 mb-2">Quick Select Examples:</p>
            <div className="grid grid-cols-3 gap-2">
              {['123', '456', '789', '024', '135', '267', '048', '159', '370'].map((panna) => (
                <button
                  key={panna}
                  type="button"
                  onClick={() => setBetNumber(panna)}
                  className={`py-1 px-2 text-xs rounded-md font-medium transition-colors duration-200 ${
                    betNumber === panna
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {panna}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </BettingBase>
  )
}

export default SinglePannaBet
