import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'

const StarlineDeclareResult = () => {
  const { user, API_URL } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [declaring, setDeclaring] = useState(false)
  const [games, setGames] = useState([])
  const [recentResults, setRecentResults] = useState([])
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    gameId: '',
    winningNumber: ''
  })

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'subadmin') {
      navigate('/auth')
      return
    }
    fetchGames()
    fetchRecentResults()
  }, [user, navigate])

  const fetchGames = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/starline/games`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.data.success) {
        setGames(response.data.data.games || [])
      }
    } catch (error) {
      console.error('Error fetching starline games:', error)
      toast.error('Failed to fetch starline games')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentResults = async () => {
    try {
      const response = await axios.get(`${API_URL}/starline/results`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          limit: 10
        }
      })
      console.log('Recent results response:', response.data) // Debug log
      if (response.data.success) {
        setRecentResults(response.data.data.results || [])
      }
    } catch (error) {
      console.error('Error fetching recent starline results:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    if (!formData.date) {
      toast.error('Please select a date')
      return false
    }
    if (!formData.gameId) {
      toast.error('Please select a game')
      return false
    }
    if (!formData.winningNumber || formData.winningNumber.length !== 3 || !/^\d{3}$/.test(formData.winningNumber)) {
      toast.error('Please enter a valid 3-digit winning number')
      return false
    }
    return true
  }

  const handleDeclareResult = async () => {
    if (!validateForm()) return

    try {
      setDeclaring(true)
      
      const resultData = {
        gameId: formData.gameId,
        gameDate: formData.date,
        winningNumber: formData.winningNumber
      }

      console.log('Sending starline result data:', resultData)

      const response = await axios.post(`${API_URL}/starline/results`, resultData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Response received:', response.data)

      if (response.data.success) {
        toast.success('Starline result declared successfully!')
        // Reset form
        setFormData({
          date: new Date().toISOString().split('T')[0],
          gameId: '',
          winningNumber: ''
        })
        // Refresh recent results
        fetchRecentResults()
      } else {
        toast.error(response.data.message || 'Failed to declare starline result')
      }
    } catch (error) {
      console.error('Error declaring starline result:', error)
      console.error('Error response:', error.response?.data)
      const errorMessage = error.response?.data?.message || error.response?.data?.details || 'Failed to declare starline result'
      toast.error(errorMessage)
    } finally {
      setDeclaring(false)
    }
  }

  const handleCheckWinners = () => {
    if (!formData.gameId || !formData.date) {
      toast.error('Please select date and game first')
      return
    }
    navigate(`/starline-check-winners?date=${formData.date}&gameId=${formData.gameId}&winningNumber=${formData.winningNumber}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading starline games...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 shadow-lg px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin-dashboard')}
              className="text-white hover:text-gray-200 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">Declare Starline Result</h1>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-blue-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Game Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Starline Game
              </label>
              <select
                value={formData.gameId}
                onChange={(e) => handleInputChange('gameId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-blue-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Starline Game</option>
                {games.map((game) => (
                  <option key={game._id} value={game._id}>
                    {game.gameName} {game.gameNameHindi && `(${game.gameNameHindi})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Winning Number Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Winning Number (3 digits)
              </label>
              <input
                type="text"
                value={formData.winningNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 3)
                  handleInputChange('winningNumber', value)
                }}
                placeholder="Enter 3-digit winning number"
                maxLength={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center font-mono text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleDeclareResult}
                disabled={declaring || !formData.gameId || !formData.winningNumber}
                className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {declaring ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Declaring Result...
                  </div>
                ) : (
                  'Declare Starline Result'
                )}
              </button>

              <button
                onClick={handleCheckWinners}
                disabled={!formData.gameId || !formData.date}
                className="w-full bg-white border border-gray-300 text-gray-700 px-6 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Check Winners
              </button>
            </div>

            {/* Preview */}
            {formData.winningNumber && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Result Preview:</h3>
                <div className="text-center">
                  <span className="text-3xl font-mono font-bold text-blue-900">
                    {formData.winningNumber}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Results */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Starline Results</h2>
          {recentResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Game
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Winning Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Declared At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Declared By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentResults.map((result) => (
                    <tr key={result._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(result.gameDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {result.gameId?.gameName || result.gameName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-lg font-mono font-bold text-blue-600">
                          {result.winningNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {result.declaredAt ? new Date(result.declaredAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {result.declaredBy?.name || result.declaredBy?.username || 'Admin'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <p>No recent starline results found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StarlineDeclareResult