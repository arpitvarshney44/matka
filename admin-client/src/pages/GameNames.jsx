import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'

const GameNames = () => {
  const { API_URL } = useAuth()
  const navigate = useNavigate()
  const [games, setGames] = useState([])
  const [filteredGames, setFilteredGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [gameResults, setGameResults] = useState({})

  useEffect(() => {
    fetchGames()
  }, [])

  useEffect(() => {
    // Filter games based on search term
    const filtered = games.filter(game =>
      game.gameName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (game.gameNameHindi && game.gameNameHindi.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredGames(filtered)
  }, [games, searchTerm])

  const fetchGames = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const [gamesResponse, resultsResponse] = await Promise.all([
        axios.get(`${API_URL}/games`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        axios.get(`${API_URL}/admin/results`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            date: new Date().toISOString().split('T')[0]
          }
        }).catch(() => ({ data: { results: [] } })) // Handle if endpoint fails
      ])

      setGames(gamesResponse.data)

      // Create a map of game results for today
      const resultsMap = {}
      if (resultsResponse.data.results) {
        resultsResponse.data.results.forEach(result => {
          const gameId = result.gameId._id || result.gameId
          if (!resultsMap[gameId]) {
            resultsMap[gameId] = []
          }
          resultsMap[gameId].push(result)
        })
      }
      setGameResults(resultsMap)

    } catch (error) {
      console.error('Error fetching games:', error)
      toast.error('Failed to fetch games')
    } finally {
      setLoading(false)
    }
  }

  // Function to get market status based on current time and results
  const getMarketStatus = (game) => {
    if (!game.isActive) {
      return { status: 'Inactive', color: 'text-gray-500' }
    }

    // Check if results have been declared for today
    const todayResults = gameResults[game._id]
    const hasOpenResult = todayResults?.some(result => result.session === 'open')
    const hasCloseResult = todayResults?.some(result => result.session === 'close')

    if (hasOpenResult && hasCloseResult) {
      return { status: 'Market Closed - Result Declared', color: 'text-blue-600' }
    }

    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // Get HH:MM format

    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return hours * 60 + minutes
    }

    const currentMinutes = timeToMinutes(currentTime)
    const openMinutes = timeToMinutes(game.openTime)
    const closeMinutes = timeToMinutes(game.closeTime)

    // Game is active from start of day until close time
    const isGameActive = currentMinutes <= closeMinutes

    if (!isGameActive) {
      // After close time, check if partial results are available
      if (hasOpenResult || hasCloseResult) {
        return { status: 'Market Closed - Partial Result', color: 'text-orange-600' }
      }
      return { status: 'Market Closed', color: 'text-red-600' }
    }

    // Game is active - show session status
    const openSessionAvailable = currentMinutes < openMinutes
    const closeSessionAvailable = currentMinutes <= closeMinutes

    if (openSessionAvailable && closeSessionAvailable) {
      return { status: 'Market Active - Both Sessions Open', color: 'text-green-600' }
    } else if (closeSessionAvailable) {
      return { status: 'Market Active - Close Session Only', color: 'text-green-600' }
    } else {
      return { status: 'Market Active - No Sessions', color: 'text-yellow-600' }
    }
  }

  const toggleGameStatus = async (gameId) => {
    try {
      const response = await axios.patch(`${API_URL}/games/${gameId}/toggle-status`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      // Update the games list with the new status
      setGames(prevGames =>
        prevGames.map(game =>
          game._id === gameId ? { ...game, isActive: response.data.isActive } : game
        )
      )

      toast.success(`Game ${response.data.isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error toggling game status:', error)
      toast.error('Failed to update game status')
    }
  }

  const handleEdit = (gameId) => {
    navigate(`/edit-game/${gameId}`)
  }

  const handleAddGame = () => {
    navigate('/add-game')
  }

  const handleBack = () => {
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading games...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center">
        <button
          onClick={handleBack}
          className="mr-4 p-2 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">GameNames</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Title and Search */}
          <div className="p-4 border-b">
            <h2 className="text-2xl font-bold text-blue-600 mb-4">Game Name List</h2>

            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Add Game Button */}
            <button
              onClick={handleAddGame}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Add Game
            </button>
          </div>

          {/* Games Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">S.No</th>
                  <th className="px-4 py-3 text-left">Game Name</th>
                  <th className="px-4 py-3 text-left">Open Time</th>
                  <th className="px-4 py-3 text-left">Close Time</th>
                  <th className="px-4 py-3 text-left">Market Active</th>
                  <th className="px-4 py-3 text-left">Current Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredGames.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      {searchTerm ? 'No games found matching your search' : 'No games available'}
                    </td>
                  </tr>
                ) : (
                  filteredGames.map((game, index) => (
                    <tr key={game._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{game.gameName}</div>
                          {game.gameNameHindi && (
                            <div className="text-sm text-gray-500">{game.gameNameHindi}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{game.openTime}</td>
                      <td className="px-4 py-3">{game.closeTime}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleGameStatus(game._id, game.isActive)}
                          className={`px-3 py-1 rounded-full text-white text-sm font-medium ${game.isActive
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-red-500 hover:bg-red-600'
                            } transition-colors`}
                          title={`Click to ${game.isActive ? 'deactivate' : 'activate'} market`}
                        >
                          {game.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const marketStatus = getMarketStatus(game)
                          return (
                            <span className={`font-medium ${marketStatus.color}`}>
                              {marketStatus.status}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleEdit(game._id)}
                          className="bg-blue-600 text-white px-4 py-1 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          EDIT
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameNames
