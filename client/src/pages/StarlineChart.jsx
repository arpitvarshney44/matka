import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'

const StarlineChart = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { API_URL } = useAuth()
  const [game, setGame] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (gameId) {
      fetchGameDetails()
      fetchGameResults()
    } else {
      // If no gameId, show all starline games
      fetchAllStarlineGames()
    }
  }, [gameId])

  const fetchGameDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/starline/games/${gameId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.data.success) {
        setGame(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching game details:', error)
      toast.error('Failed to load game details.')
    }
  }

  const fetchAllStarlineGames = async () => {
    try {
      const response = await axios.get(`${API_URL}/starline/games`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.data.success) {
        // For now, just redirect to starline gaming page if no specific game
        navigate('/starline-gaming')
      }
    } catch (error) {
      console.error('Error fetching starline games:', error)
      navigate('/starline-gaming')
    }
  }

  const fetchGameResults = async () => {
    try {
      const response = await axios.get(`${API_URL}/starline/results`, {
        params: { gameId },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      console.log('Starline chart results response:', response.data) // Debug log
      const starlineResults = response.data.success ? (response.data.data.results || []) : (response.data.results || [])
      console.log('Starline results found:', starlineResults.length, starlineResults) // Debug log
      const formattedResults = formatStarlineResults(starlineResults)
      setResults(formattedResults)
    } catch (error) {
      console.error('Error fetching starline results:', error)
      toast.error('Failed to load starline results.')
    } finally {
      setLoading(false)
    }
  }

  const formatStarlineResults = (starlineResults) => {
    // Format starline results - each result has a single winning number
    const formattedResults = starlineResults
      .sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate)) // Sort by date descending (newest first)
      .map(result => {
        const date = new Date(result.gameDate)
        return {
          date: date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }),
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          result: result.winningNumber || '***',
          time: result.declaredAt ? new Date(result.declaredAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }) : '-'
        }
      })

    return formattedResults
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Back to Starline Gaming
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 shadow-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-md text-white hover:bg-blue-700 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">Starline Chart</h1>
          </div>
        </div>
      </div>

      {/* Game Info Card */}
      <div className="p-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* Blue Header with Open Time */}
          <div className="bg-blue-600 text-white px-4 py-3 flex justify-center items-center">
            <span className="font-bold text-sm">OPEN TIME: {game.openTime}</span>
          </div>

          {/* Game Content */}
          <div className="px-6 py-4 text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {game.gameName}
            </h3>
            {game.gameNameHindi && (
              <p className="text-lg text-gray-600 mb-2">{game.gameNameHindi}</p>
            )}
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
            <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-gray-100 rounded-lg font-semibold text-gray-700">
              <div className="text-center">Date</div>
              <div className="text-center">Day</div>
              <div className="text-center">Result</div>
              <div className="text-center">Time</div>
            </div>

            {/* Results List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-4 gap-2 p-3 rounded-lg ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    } border border-gray-200`}
                >
                  <div className="text-center text-sm font-medium text-gray-700">
                    {result.date}
                  </div>
                  <div className="text-center text-sm font-medium text-gray-600">
                    {result.dayName}
                  </div>
                  <div className="text-center text-lg font-bold text-blue-600 font-mono">
                    {result.result}
                  </div>
                  <div className="text-center text-xs text-gray-500">
                    {result.time}
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
          <h3 className="font-bold text-gray-800 mb-3">About Starline Results</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>Starline games have a simple result format:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Each game declares a single 3-digit winning number</li>
              <li>Results are declared after the game's open time</li>
              <li>Games are open for betting from 00:00 until the open time</li>
            </ul>
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="font-semibold text-blue-700 mb-2">Examples:</p>
              <ul className="space-y-1 text-xs">
                <li><span className="font-mono font-bold text-blue-600">123</span> = Winning number is 123</li>
                <li><span className="font-mono font-bold text-gray-400">***</span> = Result not declared yet</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StarlineChart