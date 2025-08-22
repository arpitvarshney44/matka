import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'

const BiddingHistory = () => {
  const { user, API_URL } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [bets, setBets] = useState([])
  const [filteredBets, setFilteredBets] = useState([])
  const [games, setGames] = useState([])
  const [sessionResults, setSessionResults] = useState([])
  const [filters, setFilters] = useState({
    betType: '',
    game: '',
    session: '',
    status: '',
    dateRange: '',
    fromDate: '',
    toDate: ''
  })
  const [sortBy, setSortBy] = useState('betDate')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetchBiddingHistory()
    fetchGames()
    fetchSessionResults()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [bets, filters, sortBy, sortOrder])

  const fetchBiddingHistory = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/bets/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      setBets(response.data.bets || [])
    } catch (error) {
      console.error('Error fetching bidding history:', error)
      toast.error('Failed to load bidding history')
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

  const fetchSessionResults = async () => {
    try {
      const response = await axios.get(`${API_URL}/results-session`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      setSessionResults(response.data.results || [])
    } catch (error) {
      console.error('Error fetching session results:', error)
    }
  }

  const getResultForBet = (bet) => {
    // Debug logging for full sangam bets
    if (bet.betType === 'fullSangam' && bet.result) {
      console.log('Full Sangam bet.result:', bet.result)
      // Check if the result contains "undefined"
      if (bet.result.includes('undefined')) {
        console.log('Bet has invalid result, will try to fetch from session results')
        // Don't use the invalid result, fall through to fetch from session results
      } else {
        return bet.result
      }
    } else if (bet.result && !bet.result.includes('undefined')) {
      return bet.result // Use the result stored in the bet if available
    }

    // Try to find the session result for this bet
    const betDate = new Date(bet.betDate)
    betDate.setHours(0, 0, 0, 0)
    
    // For full sangam and half sangam bets, we need both open and close results
    if (bet.betType === 'fullSangam' || bet.betType === 'halfSangam' || bet.betType === 'jodi') {
      const openResult = sessionResults.find(result => {
        const resultDate = new Date(result.gameDate)
        resultDate.setHours(0, 0, 0, 0)
        return result.gameId === bet.gameId &&
               resultDate.getTime() === betDate.getTime() &&
               result.session === 'open'
      })
      
      const closeResult = sessionResults.find(result => {
        const resultDate = new Date(result.gameDate)
        resultDate.setHours(0, 0, 0, 0)
        return result.gameId === bet.gameId &&
               resultDate.getTime() === betDate.getTime() &&
               result.session === 'close'
      })
      
      if (openResult && closeResult) {
        if (bet.betType === 'jodi') {
          return `${openResult.pana}-${openResult.digit}-${closeResult.pana}-${closeResult.digit}`
        } else {
          // For sangam bets, use the format from backend settlement
          return `${openResult.pana}-${openResult.digit}/${closeResult.pana}-${closeResult.digit}`
        }
      } else if (openResult && !closeResult) {
        return `${openResult.pana}-${openResult.digit}/Pending`
      } else if (!openResult && closeResult) {
        return `Pending/${closeResult.pana}-${closeResult.digit}`
      }
      
      return null
    }
    
    // For single session bets (single, panna types)
    const sessionResult = sessionResults.find(result => {
      const resultDate = new Date(result.gameDate)
      resultDate.setHours(0, 0, 0, 0)
      return result.gameId === bet.gameId &&
             resultDate.getTime() === betDate.getTime() &&
             result.session === bet.session
    })

    if (sessionResult) {
      return `${sessionResult.pana}-${sessionResult.digit}`
    }

    return null
  }

  const applyFilters = () => {
    let filtered = [...bets]

    // Filter by bet type
    if (filters.betType) {
      filtered = filtered.filter(bet => bet.betType === filters.betType)
    }

    // Filter by game
    if (filters.game) {
      filtered = filtered.filter(bet => bet.gameId === filters.game || bet.gameName === filters.game)
    }

    // Filter by session
    if (filters.session) {
      filtered = filtered.filter(bet => bet.session === filters.session)
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(bet => bet.status === filters.status)
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
              const betDate = new Date(bet.betDate)
              return betDate >= fromDate && betDate <= toDate
            })
          }
          break
        default:
          break
      }

      if (filters.dateRange !== 'custom') {
        filtered = filtered.filter(bet => {
          const betDate = new Date(bet.betDate)
          return betDate >= startDate
        })
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      if (sortBy === 'betDate' || sortBy === 'createdAt') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredBets(filtered)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      betType: '',
      game: '',
      session: '',
      status: '',
      dateRange: '',
      fromDate: '',
      toDate: ''
    })
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

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }

    const statusIcons = {
      pending: '⏳',
      won: '🎉',
      lost: '❌',
      cancelled: '⚪'
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        <span className="mr-1">{statusIcons[status] || '⚪'}</span>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    )
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

  // Pagination
  const totalPages = Math.ceil(filteredBets.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentBets = filteredBets.slice(startIndex, endIndex)

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Statistics
  const stats = {
    totalBets: bets.length,
    totalAmount: bets.reduce((sum, bet) => sum + bet.betAmount, 0),
    totalWinnings: bets.reduce((sum, bet) => sum + (bet.winAmount || 0), 0),
    wonBets: bets.filter(bet => bet.status === 'won').length,
    lostBets: bets.filter(bet => bet.status === 'lost').length,
    pendingBets: bets.filter(bet => bet.status === 'pending').length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bidding history...</p>
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
            <h1 className="text-xl font-bold text-white">Bidding History</h1>
          </div>
          <button
            onClick={() => {
              fetchBiddingHistory()
              fetchSessionResults()
            }}
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
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-sm text-gray-600">Total Bets</div>
            <div className="text-lg font-bold text-gray-900">{stats.totalBets}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-sm text-gray-600">Total Invested</div>
            <div className="text-lg font-bold text-red-600">{formatCurrency(stats.totalAmount)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl mb-1">🎉</div>
            <div className="text-sm text-gray-600">Total Winnings</div>
            <div className="text-lg font-bold text-green-600">{formatCurrency(stats.totalWinnings)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-sm text-gray-600">Win Rate</div>
            <div className="text-lg font-bold text-blue-600">
              {stats.totalBets > 0 ? Math.round((stats.wonBets / stats.totalBets) * 100) : 0}%
            </div>
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

            {/* Session Filter */}
            <select
              value={filters.session}
              onChange={(e) => setFilters({...filters, session: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Sessions</option>
              <option value="open">Open</option>
              <option value="close">Close</option>
            </select>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="cancelled">Cancelled</option>
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
              <option value="betDate-desc">Newest First</option>
              <option value="betDate-asc">Oldest First</option>
              <option value="betAmount-desc">Highest Amount</option>
              <option value="betAmount-asc">Lowest Amount</option>
              <option value="winAmount-desc">Highest Winnings</option>
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="text-sm text-gray-600 mb-2 sm:mb-0">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredBets.length)} of {filteredBets.length} bets
            </div>
            {filteredBets.length > itemsPerPage && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Betting History List */}
        {currentBets.length > 0 ? (
          <div className="space-y-4">
            {currentBets.map((bet) => (
              <div key={bet._id} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">🎲</span>
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
                        {getStatusBadge(bet.status)}
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(bet.betDate)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Number:</span>
                        <div className="font-mono font-medium">{bet.betNumber}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Bet Amount:</span>
                        <div className="font-semibold text-red-600">{formatCurrency(bet.betAmount)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Potential Win:</span>
                        <div className="font-semibold text-blue-600">{formatCurrency(bet.potentialWin)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Actual Win:</span>
                        <div className={`font-semibold ${bet.winAmount > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                          {bet.winAmount > 0 ? formatCurrency(bet.winAmount) : '-'}
                        </div>
                      </div>
                    </div>

                    {getResultForBet(bet) && (
                      <div className="mt-3 p-2 bg-gray-50 rounded-md">
                        <span className="text-sm text-gray-600">Result: </span>
                        <span className="text-sm font-mono font-medium">{getResultForBet(bet)}</span>
                        {!bet.result && (
                          <span className="text-xs text-blue-600 ml-2">(Live Result)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">🎲</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bets Found</h3>
            <p className="text-gray-600 mb-6">
              {bets.length === 0 
                ? "You haven't placed any bets yet." 
                : "No bets match your current filters."}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200"
              >
                Start Betting
              </button>
              {bets.length > 0 && (
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

        {/* Bottom Pagination */}
        {filteredBets.length > itemsPerPage && (
          <div className="mt-6 flex justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-2 text-sm border rounded-md ${
                      pageNum === currentPage
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BiddingHistory
