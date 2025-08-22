import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'

const GameSelection = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { API_URL } = useAuth()
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGameDetails()
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
    } finally {
      setLoading(false)
    }
  }

  const gameTypes = [
    { name: 'Single Digit', path: 'single-digit', color: 'from-blue-500 to-blue-600' },
    { name: 'Jodi', path: 'jodi', color: 'from-purple-500 to-purple-600' },
    { name: 'Single Panna', path: 'single-panna', color: 'from-orange-500 to-orange-600' },
    { name: 'Double Panna', path: 'double-panna', color: 'from-red-500 to-red-600' },
    { name: 'Triple Panna', path: 'triple-panna', color: 'from-pink-500 to-pink-600' },
    { name: 'Half Sangam', path: 'half-sangam', color: 'from-indigo-500 to-indigo-600' },
    { name: 'Full Sangam', path: 'full-sangam', color: 'from-teal-500 to-cyan-600' }
  ]

  const handleGameTypeClick = (gameType) => {
    // Check session-specific availability
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)

    // Parse result to check individual session results
    const result = game.result || '***-**-***'
    const [openResult, , closeResult] = result.split('-')
    const hasOpenResult = openResult && openResult !== '***'
    const hasCloseResult = closeResult && closeResult !== '***'

    // Convert time strings to minutes for comparison
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return hours * 60 + minutes
    }

    const currentMinutes = timeToMinutes(currentTime)
    const openMinutes = timeToMinutes(game.openTime)
    const closeMinutes = timeToMinutes(game.closeTime)

    // Session availability logic
    const openSessionAvailable = currentMinutes < openMinutes && !hasOpenResult
    const closeSessionAvailable = currentMinutes <= closeMinutes && !hasCloseResult

    // For Full Sangam, needs both sessions to be available
    if (gameType.path === 'full-sangam') {
      if (!openSessionAvailable && !closeSessionAvailable) {
        toast.error('Both sessions are closed!')
        return
      }
      navigate(`/bet/${gameType.path}/${gameId}`)
      return
    }

    // For other bet types, check if at least one session is available
    if (!openSessionAvailable && !closeSessionAvailable) {
      toast.error('All sessions are closed!')
      return
    }

    navigate(`/bet/${gameType.path}/${gameId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game details...</p>
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

  // Check game status and session availability
  const now = new Date()
  const currentTime = now.toTimeString().slice(0, 5)

  // Parse result to check individual session results
  const result = game.result || '***-**-***'
  const [openResult, , closeResult] = result.split('-')
  const hasOpenResult = openResult && openResult !== '***'
  const hasCloseResult = closeResult && closeResult !== '***'
  const hasCompleteResult = hasOpenResult && hasCloseResult

  // Convert time strings to minutes for comparison
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  const currentMinutes = timeToMinutes(currentTime)
  const openMinutes = timeToMinutes(game.openTime)
  const closeMinutes = timeToMinutes(game.closeTime)

  // Session availability - updated logic
  const openSessionAvailable = currentMinutes < openMinutes && !hasOpenResult
  const closeSessionAvailable = currentMinutes <= closeMinutes && !hasCloseResult

  // Game is considered active if at least one session is available
  const isGameActive = openSessionAvailable || closeSessionAvailable

  // Helper function to check if a specific game type is available
  const isGameTypeAvailable = (gameType) => {
    // Full Sangam needs both sessions to be available
    if (gameType.path === 'full-sangam') {
      return openSessionAvailable && closeSessionAvailable
    }

    // Other bet types are available if at least one session is available
    return isGameActive
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
            <h1 className="text-xl font-bold text-white">Select Game Type</h1>
          </div>
        </div>
      </div>

      {/* Game Info Card */}
      <div className="p-4">
        <div className="bg-white rounded-md shadow-sm overflow-hidden mb-3">
          {/* Black Header with Open/Close Times */}
          <div className="bg-black text-white px-2 py-1.5 flex justify-between items-center">
            <span className="font-medium text-xs">OPEN: {game.openTime}</span>
            <span className="font-medium text-xs">CLOSE: {game.closeTime}</span>
          </div>

          {/* Game Content */}
          <div className="px-3 py-2">
            {/* Game Name and Result */}
            <div className="text-center mb-1">
              <h3 className="text-sm font-bold text-gray-800">
                {game.gameName}
              </h3>
              <p className="text-sm font-semibold text-gray-700">
                {hasCompleteResult ? game.result : hasOpenResult || hasCloseResult ? game.result : 'Result Pending'}
              </p>
            </div>

            {/* Compact Session Info */}
            {currentMinutes > closeMinutes ? (
              <div className="text-center">
                <p className="text-red-600 font-semibold text-sm">Market Closed</p>
              </div>
            ) : !hasCompleteResult && (
              <div className="text-xs text-gray-600 flex justify-center gap-3">
                <span className={openSessionAvailable ? 'text-green-600' : 'text-red-500'}>
                  {openSessionAvailable ? '✓' : hasOpenResult ? 'Result' : '✗'} Open
                </span>
                <span className={closeSessionAvailable ? 'text-green-600' : 'text-red-500'}>
                  {closeSessionAvailable ? '✓' : hasCloseResult ? 'Result' : '✗'} Close
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Game Types Grid */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Choose Game Type</h2>
          <div className="grid grid-cols-2 gap-3">
            {gameTypes.map((gameType, index) => {
              const isAvailable = isGameTypeAvailable(gameType)
              return (
                <button
                  key={index}
                  onClick={() => handleGameTypeClick(gameType)}
                  className={`bg-gradient-to-r ${gameType.color} ${isAvailable
                    ? 'hover:opacity-90 transform hover:scale-102 cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                    } text-white py-8 px-6 rounded-lg font-semibold text-lg transition-all duration-200 shadow-md hover:shadow-lg relative min-h-[70px] flex items-center justify-center`}
                  disabled={!isAvailable}
                >
                  <span className="text-center leading-tight">{gameType.name}</span>
                  {!isAvailable && isGameActive && gameType.path !== 'full-sangam' && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      ✕
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {!isGameActive && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-center font-medium">
              {currentMinutes > closeMinutes ? 'Market Closed' : hasCompleteResult ? 'All results have been declared.' : 'All sessions are currently closed.'}
            </p>
          </div>
        )}

        {isGameActive && !openSessionAvailable && !closeSessionAvailable && (
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-orange-600 text-center font-medium">
              Between betting sessions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default GameSelection