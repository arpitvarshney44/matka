import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'

const WinningHistory = () => {
  const { user, API_URL } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [winningBets, setWinningBets] = useState([])
  const [games, setGames] = useState([])
  const [filters, setFilters] = useState({
    betType: '',
    game: '',
    dateRange: '',
    fromDate: '',
    toDate: ''
  })
  const [sortBy, setSortBy] = useState('resultDate')
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    fetchWinningHistory()
    fetchGames()
  }, [])

  const fetchWinningHistory = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/bets/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      // Filter only winning bets
      const allBets = response.data.bets || []
      const wonBets = allBets.filter(bet => bet.status === 'won' && bet.winAmount > 0)
      setWinningBets(wonBets)
    } catch (error) {
      console.error('Error fetching winning history:', error)
      toast.error('Failed to load winning history')
    } finally {
      setLoading(false)
    }
  }

  const fetchGames = async () => {
    try {
      const response = await axios.get(`${API_URL}/games`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      setGames(response.data || [])
    } catch (error) {
      console.error('Error fetching games:', error)
    }
  }

  const getBetTypeDisplayName = (betType) => {
    const names = {
      single: 'Single',
      jodi: 'Jodi',
      singlePanna: 'Single Panna',
      doublePanna: 'Double Panna',
      triplePanna: 'Triple Panna',
      halfSangam: 'Half Sangam',
      fullSangam: 'Full Sangam'
    }
    return names[betType] || betType
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return `₹${amount}`
  }

  const getFilteredWinnings = () => {
    let filtered = [...winningBets]

    // Filter by bet type
    if (filters.betType) {
      filtered = filtered.filter(bet => bet.betType === filters.betType)
    }

    // Filter by game
    if (filters.game) {
      filtered = filtered.filter(bet => bet.gameId === filters.game)
    }

    // Filter by date range
    if (filters.dateRange) {
      const now = new Date()
      let startDate = new Date()

      switch (filters.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'custom':
          if (filters.fromDate && filters.toDate) {
            const fromDate = new Date(filters.fromDate)
            const toDate = new Date(filters.toDate)
            toDate.setHours(23, 59, 59, 999)
            filtered = filtered.filter(bet => {
              const betDate = new Date(bet.resultDate || bet.betDate)
              return betDate >= fromDate && betDate <= toDate
            })
          }
          break
        default:
          break
      }

      if (filters.dateRange !== 'custom') {
        filtered = filtered.filter(bet => {
          const betDate = new Date(bet.resultDate || bet.betDate)
          return betDate >= startDate
        })
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || a.betDate
      let bValue = b[sortBy] || b.betDate

      if (sortBy === 'resultDate' || sortBy === 'betDate') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }

  const clearFilters = () => {
    setFilters({
      betType: '',
      game: '',
      dateRange: '',
      fromDate: '',
      toDate: ''
    })
  }

  const filteredWinnings = getFilteredWinnings()

  // Statistics
  const stats = {
    totalWins: winningBets.length,
    totalWinAmount: winningBets.reduce((sum, bet) => sum + (bet.winAmount || 0), 0),
    totalBetAmount: winningBets.reduce((sum, bet) => sum + bet.betAmount, 0),
    totalProfit: winningBets.reduce((sum, bet) => sum + (bet.winAmount - bet.betAmount), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading winning history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 shadow-lg px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-white hover:text-gray-200 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">Winning History</h1>
          </div>
          <button
            onClick={fetchWinningHistory}
            className="p-2 rounded-full text-white hover:bg-green-700 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-sm text-gray-600">Total Wins</div>
            <div className="text-lg font-bold text-gray-900">{stats.totalWins}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-sm text-gray-600">Total Won</div>
            <div className="text-lg font-bold text-green-600">{formatCurrency(stats.totalWinAmount)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-sm text-gray-600">Total Bet</div>
            <div className="text-lg font-bold text-blue-600">{formatCurrency(stats.totalBetAmount)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl mb-1">📈</div>
            <div className="text-sm text-gray-600">Net Profit</div>
            <div className="text-lg font-bold text-purple-600">{formatCurrency(stats.totalProfit)}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2 lg:mb-0">Filter & Sort</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Clear All Filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Bet Type Filter */}
            <select
              value={filters.betType}
              onChange={(e) => setFilters({...filters, betType: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Bet Types</option>
              <option value="single">Single</option>
              <option value="jodi">Jodi</option>
              <option value="singlePanna">Single Panna</option>
              <option value="doublePanna">Double Panna</option>
              <option value="triplePanna">Triple Panna</option>
              <option value="halfSangam">Half Sangam</option>
              <option value="fullSangam">Full Sangam</option>
            </select>

            {/* Game Filter */}
            <select
              value={filters.game}
              onChange={(e) => setFilters({...filters, game: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Games</option>
              {games.map((game) => (
                <option key={game._id} value={game._id}>
                  {game.gameName}
                </option>
              ))}
            </select>

            {/* Date Range Filter */}
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>

            {/* Sort Options */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field)
                setSortOrder(order)
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="resultDate-desc">Newest First</option>
              <option value="resultDate-asc">Oldest First</option>
              <option value="winAmount-desc">Highest Win</option>
              <option value="winAmount-asc">Lowest Win</option>
            </select>

            {/* Custom Date Range */}
            {filters.dateRange === 'custom' && (
              <>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters({...filters, toDate: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </>
            )}
          </div>
        </div>

        {/* Winning Bets List */}
        {filteredWinnings.length > 0 ? (
          <div className="space-y-4">
            {filteredWinnings.map((bet) => (
              <div key={bet._id} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">🎉</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {getBetTypeDisplayName(bet.betType)} - {bet.gameName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Session: <span className="capitalize font-medium">{bet.session}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <span className="mr-1">🎉</span>
                          Won
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(bet.resultDate || bet.betDate)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Number:</span>
                        <div className="font-mono font-medium">{bet.betNumber}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Bet Amount:</span>
                        <div className="font-semibold text-blue-600">{formatCurrency(bet.betAmount)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Win Amount:</span>
                        <div className="font-semibold text-green-600">{formatCurrency(bet.winAmount)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Profit:</span>
                        <div className="font-semibold text-purple-600">{formatCurrency(bet.winAmount - bet.betAmount)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Result:</span>
                        <div className="font-mono font-medium">{bet.result || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Winnings Yet</h3>
            <p className="text-gray-600 mb-6">
              {winningBets.length === 0 
                ? "You haven't won any bets yet. Keep playing!" 
                : "No winnings match your current filters."}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200"
              >
                Play Now
              </button>
              {winningBets.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WinningHistory