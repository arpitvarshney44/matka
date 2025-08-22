import React from 'react'
import BettingBase from '../components/BettingBase'

const JodiBet = () => {
  return (
    <BettingBase
      betType="jodi"
      title="Jodi Betting"
      description="Bet on a 2-digit jodi number (00-99)"
      inputPlaceholder="Enter 2-digit jodi (e.g., 25)"
    >
      {({ betNumber, setBetNumber, errors, inputPlaceholder }) => (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Jodi Number
          </label>
          
          {/* Manual input */}
          <input
            type="text"
            value={betNumber}
            onChange={(e) => {
              const value = e.target.value
              // Only allow 2-digit numbers
              if (value === '' || (/^\d{1,2}$/.test(value) && parseInt(value) <= 99)) {
                setBetNumber(value)
              }
            }}
            placeholder={inputPlaceholder}
            maxLength="2"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          {errors.number && (
            <p className="text-red-500 text-xs mt-1">{errors.number}</p>
          )}
          
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <div>💡 Tip: Enter a 2-digit number between 00-99</div>
            <div>📝 Examples: 00, 05, 12, 45, 99</div>
          </div>
          
          {/* Popular jodi numbers */}
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-600 mb-2">Quick Select:</p>
            <div className="grid grid-cols-4 gap-2">
              {['00', '11', '22', '33', '44', '55', '66', '77', '88', '99', '01', '10'].map((jodi) => (
                <button
                  key={jodi}
                  type="button"
                  onClick={() => setBetNumber(jodi)}
                  className={`py-1 px-2 text-xs rounded-md font-medium transition-colors duration-200 ${
                    betNumber === jodi
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {jodi}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </BettingBase>
  )
}

export default JodiBet
