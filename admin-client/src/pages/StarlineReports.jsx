import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'
import PageHeader from '../components/PageHeader'

const StarlineReports = () => {
    const { user, API_URL } = useAuth()
    const navigate = useNavigate()

    const [activeTab, setActiveTab] = useState('dashboard')
    const [loading, setLoading] = useState(false)
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
        endDate: new Date().toISOString().split('T')[0] // today
    })

    // Dashboard data
    const [dashboardData, setDashboardData] = useState(null)

    // Reports data
    const [bidReports, setBidReports] = useState({ data: [], summary: null, breakdown: null })
    const [winningReports, setWinningReports] = useState({ data: [], summary: null, topWinners: [] })

    // Filters
    const [filters, setFilters] = useState({
        gameId: '',
        userId: '',
        betType: '',
        status: '',
        minAmount: '',
        maxAmount: ''
    })

    const [games, setGames] = useState([])
    const [users, setUsers] = useState([])

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'subadmin') {
      navigate('/dashboard')
      return
    }
    loadGames()
    loadDashboardData()
  }, [user, navigate])

    useEffect(() => {
        if (activeTab === 'bids') {
            loadBidReports()
        } else if (activeTab === 'winnings') {
            loadWinningReports()
        }
    }, [activeTab, dateRange, filters])

    const loadGames = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(`${API_URL}/starline/games`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (response.data.success) {
                setGames(response.data.data.games)
            }
        } catch (error) {
            console.error('Load games error:', error)
        }
    }

    const loadDashboardData = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            console.log('Loading dashboard data...')
            const response = await axios.get(`${API_URL}/starline/reports/dashboard?period=7`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            console.log('Dashboard response:', response.data)
            if (response.data.success) {
                setDashboardData(response.data.data)
            } else {
                console.error('Dashboard API returned success: false')
                toast.error('Failed to load dashboard data')
            }
        } catch (error) {
            console.error('Load dashboard error:', error)
            if (error.response) {
                console.error('Error response:', error.response.data)
                toast.error(`Failed to load dashboard data: ${error.response.data.message || 'Unknown error'}`)
            } else {
                toast.error('Failed to load dashboard data: Network error')
            }
        } finally {
            setLoading(false)
        }
    }

    const loadBidReports = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            const params = new URLSearchParams({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                limit: '50',
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            })

            console.log('Loading bid reports with params:', params.toString())
            const response = await axios.get(`${API_URL}/starline/reports/bids?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            console.log('Bid reports response:', response.data)
            if (response.data.success) {
                setBidReports({
                    data: response.data.data.bets || [],
                    summary: response.data.data.summary,
                    breakdown: response.data.data.breakdown
                })
            } else {
                console.error('Bid reports API returned success: false')
                toast.error('Failed to load bid reports')
            }
        } catch (error) {
            console.error('Load bid reports error:', error)
            if (error.response) {
                console.error('Error response:', error.response.data)
                toast.error(`Failed to load bid reports: ${error.response.data.message || 'Unknown error'}`)
            } else {
                toast.error('Failed to load bid reports: Network error')
            }
        } finally {
            setLoading(false)
        }
    }

    const loadWinningReports = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            const params = new URLSearchParams({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                limit: '50',
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            })

            console.log('Loading winning reports with params:', params.toString())
            const response = await axios.get(`${API_URL}/starline/reports/winnings?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            console.log('Winning reports response:', response.data)
            if (response.data.success) {
                setWinningReports({
                    data: response.data.data.winningBets || [],
                    summary: response.data.data.summary,
                    topWinners: response.data.data.topWinners || [],
                    betTypeBreakdown: response.data.data.betTypeBreakdown
                })
            } else {
                console.error('Winning reports API returned success: false')
                toast.error('Failed to load winning reports')
            }
        } catch (error) {
            console.error('Load winning reports error:', error)
            if (error.response) {
                console.error('Error response:', error.response.data)
                toast.error(`Failed to load winning reports: ${error.response.data.message || 'Unknown error'}`)
            } else {
                toast.error('Failed to load winning reports: Network error')
            }
        } finally {
            setLoading(false)
        }
    }



    const exportData = async (reportType) => {
        try {
            const token = localStorage.getItem('token')
            const params = new URLSearchParams({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                export: 'true',
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            })

            const response = await axios.get(`${API_URL}/starline/reports/${reportType}?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (response.data.success) {
                // Convert to CSV and download
                const csvData = convertToCSV(response.data.data.bets || response.data.data.winningBets)
                downloadCSV(csvData, `starline-${reportType}-${dateRange.startDate}-${dateRange.endDate}.csv`)
                toast.success('Data exported successfully')
            }
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Failed to export data')
        }
    }

    const convertToCSV = (data) => {
        if (!data || data.length === 0) return ''

        const headers = Object.keys(data[0])
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header]
                if (typeof value === 'object' && value !== null) {
                    return JSON.stringify(value).replace(/"/g, '""')
                }
                return `"${String(value).replace(/"/g, '""')}"`
            }).join(','))
        ].join('\n')

        return csvContent
    }

    const downloadCSV = (csvContent, filename) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', filename)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const tabs = [
        { id: 'dashboard', name: 'Dashboard', icon: '📊' },
        { id: 'bids', name: 'Bid Reports', icon: '📋' },
        { id: 'winnings', name: 'Winning Reports', icon: '🏆' }
    ]

    if (loading && !dashboardData && !bidReports.data.length && !winningReports.data.length) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading reports...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeader 
                title="Starline Reports & Analytics" 
                subtitle="Comprehensive reporting and analytics for Starline games"
                showBackButton={true}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Tabs */}
                <div className="mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <span>{tab.icon}</span>
                                    <span>{tab.name}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Date Range Filter */}
                {activeTab !== 'dashboard' && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            {(activeTab === 'bids' || activeTab === 'winnings') && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Game</label>
                                        <select
                                            value={filters.gameId}
                                            onChange={(e) => setFilters({ ...filters, gameId: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">All Games</option>
                                            {games.map(game => (
                                                <option key={game._id} value={game._id}>{game.gameName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Bet Type</label>
                                        <select
                                            value={filters.betType}
                                            onChange={(e) => setFilters({ ...filters, betType: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">All Types</option>
                                            <option value="single digit">Single Digit</option>
                                            <option value="single pana">Single Pana</option>
                                            <option value="double pana">Double Pana</option>
                                            <option value="triple pana">Triple Pana</option>
                                        </select>
                                    </div>
                                </>
                            )}
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        if (activeTab === 'bids') loadBidReports()
                                        else if (activeTab === 'winnings') loadWinningReports()
                                    }}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
                                >
                                    Apply Filters
                                </button>
                            </div>
                            {(activeTab === 'bids' || activeTab === 'winnings') && (
                                <div className="flex items-end">
                                    <button
                                        onClick={() => exportData(activeTab)}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
                                    >
                                        Export CSV
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="space-y-6">
                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && dashboardData && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                                <span className="text-white text-sm">📊</span>
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">Total Bets</dt>
                                                <dd className="text-lg font-medium text-gray-900">{dashboardData.summary?.totalBets || 0}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                                <span className="text-white text-sm">💰</span>
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">Total Amount</dt>
                                                <dd className="text-lg font-medium text-gray-900">{formatCurrency(dashboardData.summary?.totalBetAmount || 0)}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                                                <span className="text-white text-sm">🏆</span>
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">Total Payout</dt>
                                                <dd className="text-lg font-medium text-gray-900">{formatCurrency(dashboardData.summary?.totalWinAmount || 0)}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${(dashboardData.summary?.profitLoss || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'
                                                }`}>
                                                <span className="text-white text-sm">📈</span>
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">Profit/Loss</dt>
                                                <dd className={`text-lg font-medium ${(dashboardData.summary?.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {formatCurrency(dashboardData.summary?.profitLoss || 0)}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Games Performance */}
                            <div className="bg-white rounded-lg shadow-sm">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">Top Performing Games</h3>
                                </div>
                                <div className="p-6">
                                    {dashboardData.games?.topPerforming?.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Game</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bets</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Win</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {dashboardData.games.topPerforming.map((game, index) => (
                                                        <tr key={index}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {game.gameName}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {game.totalBets}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {formatCurrency(game.totalAmount)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {formatCurrency(game.totalWin)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center py-8">No game data available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bid Reports Tab */}
                    {activeTab === 'bids' && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            {bidReports.summary && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="bg-white rounded-lg shadow-sm p-6">
                                        <h3 className="text-sm font-medium text-gray-500">Total Bets</h3>
                                        <p className="text-2xl font-bold text-gray-900">{bidReports.summary.totalBets}</p>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-sm p-6">
                                        <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(bidReports.summary.totalBetAmount)}</p>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-sm p-6">
                                        <h3 className="text-sm font-medium text-gray-500">Won Bets</h3>
                                        <p className="text-2xl font-bold text-green-600">{bidReports.summary.wonBets}</p>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-sm p-6">
                                        <h3 className="text-sm font-medium text-gray-500">Win Rate</h3>
                                        <p className="text-2xl font-bold text-blue-600">{bidReports.summary.winPercentage}%</p>
                                    </div>
                                </div>
                            )}

                            {/* Bets Table */}
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">Bid Reports</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Game</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bet</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {bidReports.data.map((bet) => (
                                                <tr key={bet._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {bet.userId?.name || 'Unknown'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {bet.gameId?.gameName || bet.gameName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        <div>
                                                            <span className="font-medium">{bet.betNumber}</span>
                                                            <span className="text-gray-500 ml-2">({bet.betType})</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatCurrency(bet.betAmount)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${bet.status === 'won' ? 'bg-green-100 text-green-800' :
                                                            bet.status === 'lost' ? 'bg-red-100 text-red-800' :
                                                                bet.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {bet.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDateTime(bet.betDate)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {bidReports.data.length === 0 && (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">No bid reports found for the selected date range.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Winning Reports Tab */}
                    {activeTab === 'winnings' && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            {winningReports.summary && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="bg-white rounded-lg shadow-sm p-6">
                                        <h3 className="text-sm font-medium text-gray-500">Winning Bets</h3>
                                        <p className="text-2xl font-bold text-gray-900">{winningReports.summary.totalWinningBets}</p>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-sm p-6">
                                        <h3 className="text-sm font-medium text-gray-500">Total Payout</h3>
                                        <p className="text-2xl font-bold text-green-600">{formatCurrency(winningReports.summary.totalWinAmount)}</p>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-sm p-6">
                                        <h3 className="text-sm font-medium text-gray-500">Avg Win</h3>
                                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(winningReports.summary.avgWinAmount)}</p>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-sm p-6">
                                        <h3 className="text-sm font-medium text-gray-500">Max Win</h3>
                                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(winningReports.summary.maxWinAmount)}</p>
                                    </div>
                                </div>
                            )}

                            {/* Top Winners */}
                            {winningReports.topWinners && winningReports.topWinners.length > 0 && (
                                <div className="bg-white rounded-lg shadow-sm">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h3 className="text-lg font-medium text-gray-900">Top Winners</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Wins</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win Amount</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Profit</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {winningReports.topWinners.map((winner, index) => (
                                                        <tr key={index}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {winner.name}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {winner.totalWins}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {formatCurrency(winner.totalWinAmount)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                <span className={winner.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                                    {formatCurrency(winner.netProfit)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                </div>

                {/* Loading Overlay */}
                {loading && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="text-gray-900">Loading...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default StarlineReports