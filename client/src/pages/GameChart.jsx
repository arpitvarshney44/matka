import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'

const GameChart = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { API_URL } = useAuth()
  const [game, setGame] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGameDetails()
    fetchGameResults()
  }, [gameId])

  const fetchGameDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/games`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const gameData = response.data.find(g => g._id === gameId)
      setGame(gameData)
    } catch (error) {
      console.error('Error fetching game details:', error)
      toast.error('Failed to load game details.')
    }
  }

  const fetchGameResults = async () => {
    try {
      const response = await axios.get(`${API_URL}/results-session`, {
        params: { gameId },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const sessionResults = response.data.results || []
      const formattedResults = formatSessionResults(sessionResults)
      setResults(formattedResults)
    } catch (error) {
      console.error('Error fetching game results:', error)
      toast.error('Failed to load game results.')
    } finally {
      setLoading(false)
    }
  }

  const formatSessionResults = (sessionResults) => {
    // Group results by date
    const resultsByDate = {}
    
    sessionResults.forEach(result => {
      const date = new Date(result.gameDate)
      const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD format
      
      if (!resultsByDate[dateKey]) {
        resultsByDate[dateKey] = {
          date: date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }),
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          open: null,
          close: null
        }
      }
      
      if (result.session === 'open') {
        resultsByDate[dateKey].open = {
          pana: result.pana,
          digit: result.digit
        }
      } else if (result.session === 'close') {
        resultsByDate[dateKey].close = {
          pana: result.pana,
          digit: result.digit
        }
      }
    })
    
    // Convert to array and format results
    const formattedResults = Object.keys(resultsByDate)
      .sort((a, b) => new Date(b) - new Date(a)) // Sort by date descending (newest first)
      .map(dateKey => {
        const dayResult = resultsByDate[dateKey]
        let resultString = '***-**-***'
        
        if (dayResult.open && dayResult.close) {
          // Full result: open_pana-open_digit-close_pana-close_digit
          resultString = `${dayResult.open.pana}-${dayResult.open.digit}${dayResult.close.digit}-${dayResult.close.pana}`
        } else if (dayResult.open) {
          // Only open result
          resultString = `${dayResult.open.pana}-${dayResult.open.digit}*-***`
        } else if (dayResult.close) {
          // Only close result
          resultString = `***-*${dayResult.close.digit}-${dayResult.close.pana}`
        }
        
        return {
          date: dayResult.date,
          dayName: dayResult.dayName,
          result: resultString
        }
      })
    
    return formattedResults
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chart data...</p>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Game not found</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-green-800 shadow-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-md text-white hover:bg-green-700 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">Game Chart</h1>
          </div>
        </div>
      </div>

      {/* Game Info Card */}
      <div className="p-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* Black Header with Open/Close Times */}
          <div className="bg-black text-white px-4 py-3 flex justify-between items-center">
            <span className="font-bold text-sm">OPEN: {game.openTime}</span>
            <span className="font-bold text-sm">CLOSE: {game.closeTime}</span>
          </div>
          
          {/* Game Content */}
          <div className="px-6 py-4 text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {game.gameName}
            </h3>
            <p className="text-gray-600">Past Results Chart</p>
          </div>
        </div>

        {/* Results Chart */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gray-800 text-white px-4 py-3">
            <h2 className="font-bold text-lg text-center">Historical Results</h2>
          </div>
          
          <div className="p-4">
            {/* Chart Header */}
            <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-100 rounded-lg font-semibold text-gray-700">
              <div className="text-center">Date</div>
              <div className="text-center">Day</div>
              <div className="text-center">Result</div>
            </div>
            
            {/* Results List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`grid grid-cols-3 gap-2 p-3 rounded-lg ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  } border border-gray-200`}
                >
                  <div className="text-center text-sm font-medium text-gray-700">
                    {result.date}
                  </div>
                  <div className="text-center text-sm font-medium text-gray-600">
                    {result.dayName}
                  </div>
                  <div className="text-center text-sm font-bold text-gray-800 font-mono">
                    {result.result}
                  </div>
                </div>
              ))}
            </div>
            
            {results.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No historical results available</p>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-4">
          <h3 className="font-bold text-gray-800 mb-3">Result Format</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p><span className="font-mono font-bold">XXX-XX-XXX</span> format represents:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>First 3 digits: Opening Pana (XXX)</li>
              <li>Middle 2 digits: Open Digit + Close Digit (XX)</li>
              <li>Last 3 digits: Closing Pana (XXX)</li>
            </ul>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-700 mb-2">Examples:</p>
              <ul className="space-y-1 text-xs">
                <li><span className="font-mono">123-45-678</span> = Open: 123-4, Close: 678-5</li>
                <li><span className="font-mono">***-**-***</span> = No result declared yet</li>
                <li><span className="font-mono">123-4*-***</span> = Only open result declared</li>
                <li><span className="font-mono">***-*5-678</span> = Only close result declared</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameChart