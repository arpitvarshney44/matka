import React from 'react'
import BettingBase from '../components/BettingBase'

const HalfSangamBet = () => {
  return (
    <BettingBase
      betType="half_sangam"
      title="Half Sangam Betting"
      description="Bet on digit-panna combination with session selection"
      inputPlaceholder="Enter digit-panna (e.g., 5-123)"
    >
      {({ betNumber, setBetNumber, errors, inputPlaceholder }) => (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Half Sangam Number
          </label>
          
          {/* Manual input */}
          <input
            type="text"
            value={betNumber}
            onChange={(e) => {
              const value = e.target.value
              // Allow digit-panna format (e.g., 5-123)
              if (value === '' || /^\d(-\d{0,3})?$/.test(value)) {
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
            <div>💡 Format: digit-panna (e.g., 5-123)</div>
            <div>📝 Select session: Open (open digit with close panna) or Close (close digit with open panna)</div>
            <div>🎯 Examples: 0-123, 5-456, 9-789</div>
          </div>
          
          {/* Example combinations */}
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-600 mb-2">Quick Select Examples:</p>
            <div className="grid grid-cols-3 gap-2">
              {['1-123', '2-456', '5-789', '0-012', '7-345', '9-678'].map((combination) => (
                <button
                  key={combination}
                  type="button"
                  onClick={() => setBetNumber(combination)}
                  className={`py-1 px-2 text-xs rounded-md font-medium transition-colors duration-200 ${
                    betNumber === combination
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {combination}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </BettingBase>
  )
}

export default HalfSangamBet
