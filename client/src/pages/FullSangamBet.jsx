import React from 'react'
import BettingBase from '../components/BettingBase'

const FullSangamBet = () => {
  return (
    <BettingBase
      betType="full_sangam"
      title="Full Sangam Betting"
      description="Enter your number and place bet"
      inputPlaceholder="Enter number (e.g., 123456)"
    >
      {({ betNumber, setBetNumber, errors, inputPlaceholder }) => (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Full Sangam Number
          </label>
          
          {/* Simple number input */}
          <input
            type="text"
            value={betNumber}
            onChange={(e) => {
              const value = e.target.value
              // Allow only digits, up to 6 digits
              if (value === '' || /^\d{0,6}$/.test(value)) {
                setBetNumber(value)
              }
            }}
            placeholder={inputPlaceholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          {errors.number && (
            <p className="text-red-500 text-xs mt-1">{errors.number}</p>
          )}
          
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <div>💡 Enter your 6-digit number</div>
            <div>📝 Example: 123456</div>
          </div>
          
          {/* Quick Select Examples */}
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-600 mb-2">Quick Select Examples:</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                '123456', '234567', '345678', '456789',
                '000111', '111222', '222333', '333444',
                '159260', '048159', '137248', '026137'
              ].map((number) => (
                <button
                  key={number}
                  type="button"
                  onClick={() => setBetNumber(number)}
                  className={`py-2 px-2 text-xs rounded-md font-medium transition-colors duration-200 ${
                    betNumber === number
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {number}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </BettingBase>
  )
}

export default FullSangamBet
