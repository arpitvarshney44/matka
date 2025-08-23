import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'
import PageHeader from '../components/PageHeader'

const StarlineGaming = () => {
    const { user, API_URL } = useAuth()
    const navigate = useNavigate()

    const [games, setGames] = useState([])
    const [rates, setRates] = useState({})
    const [loading, setLoading] = useState(true)
    const [selectedGame, setSelectedGame] = useState(null)
    const [showBetModal, setShowBetModal] = useState(false)
    const [betData, setBetData] = useState({
        betType: 'single digit',
        betNumber: '',
        betAmount: ''
    })
    const [balance, setBalance] = useState(user?.balance || 0)
    const [placingBet, setPlacingBet] = useState(false)

    // Track user's bets to get actual game status
    const [userBets, setUserBets] = useState([])

    useEffect(() => {
        if (!user) {
            navigate('/auth')
            return
        }
        loadGames()
        loadRates()
        fetchLatestBalance()
        
        // Simple refresh interval (same as regular games)
        const interval = setInterval(() => {
            loadGames() // This now includes results
        }, 60000) // Every minute
        
        return () => clearInterval(interval)
    }, [user, navigate])

    const loadGames = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(`${API_URL}/starline/games`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (response.data.success) {
                // Filter only active games and sort by opening time
                const activeGames = response.data.data.games
                    .filter(game => game.isActive)
                    .sort((a, b) => {
                        const timeToMinutes = (timeStr) => {
                            const [hours, minutes] = timeStr.split(':').map(Number)
                            return hours * 60 + minutes
                        }
                        return timeToMinutes(a.openTime) - timeToMinutes(b.openTime)
                    })
                setGames(activeGames)
            }
        } catch (error) {
            console.error('Load games error:', error)
            toast.error('Failed to load games')
        }
    }

    const loadRates = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(`${API_URL}/starline/gamerates`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            // Transform the response to match the expected format
            const transformedRates = {
                'single digit': {
                    multiplier: response.data.singleDigit.max / 10, // Calculate multiplier from max payout
                    minBetAmount: response.data.singleDigit.min,
                    maxBetAmount: response.data.singleDigit.max
                },
                'single pana': {
                    multiplier: response.data.singlePana.max / 10,
                    minBetAmount: response.data.singlePana.min,
                    maxBetAmount: response.data.singlePana.max
                },
                'double pana': {
                    multiplier: response.data.doublePana.max / 10,
                    minBetAmount: response.data.doublePana.min,
                    maxBetAmount: response.data.doublePana.max
                },
                'triple pana': {
                    multiplier: response.data.triplePana.max / 10,
                    minBetAmount: response.data.triplePana.min,
                    maxBetAmount: response.data.triplePana.max
                }
            }

            setRates(transformedRates)
        } catch (error) {
            console.error('Load rates error:', error)
            // Fallback to default rates if API fails
            setRates({
                'single digit': { multiplier: 10, minBetAmount: 10, maxBetAmount: 100 },
                'single pana': { multiplier: 150, minBetAmount: 10, maxBetAmount: 1500 },
                'double pana': { multiplier: 300, minBetAmount: 10, maxBetAmount: 3000 },
                'triple pana': { multiplier: 700, minBetAmount: 10, maxBetAmount: 7000 }
            })
        } finally {
            setLoading(false)
        }
    }

    // Load user's recent bets to get actual game status
    const loadUserBets = async () => {
        try {
            const token = localStorage.getItem('token')
            const today = new Date().toISOString().split('T')[0]
            const response = await axios.get(`${API_URL}/starline/bets?startDate=${today}&endDate=${today}&limit=100`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (response.data.success) {
                setUserBets(response.data.data.bets || [])
            }
        } catch (error) {
            console.error('Load user bets error:', error)
        }
    }

    const fetchLatestBalance = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(`${API_URL}/user/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setBalance(response.data.user.balance || 0)
        } catch (error) {
            console.error('Fetch balance error:', error)
        }
    }

    const getGameStatus = (game) => {
        // Use server's currentStatus (same as regular games)
        const serverStatus = game.currentStatus
        if (serverStatus) {
            switch (serverStatus) {
                case 'result_declared':
                    return { status: 'Market Closed', color: 'bg-red-100 text-red-800', canBet: false, isDeclared: true }
                case 'closed':
                    return { status: 'Market Closed', color: 'bg-red-100 text-red-800', canBet: false }
                case 'open':
                    return { status: 'Open for Betting', color: 'bg-green-100 text-green-800', canBet: true }
                default:
                    return { status: 'Market Closed', color: 'bg-red-100 text-red-800', canBet: false }
            }
        }

        // Fallback to client-side time-based logic (same as regular games)
        const now = new Date()
        const currentTime = now.toTimeString().slice(0, 5)

        const timeToMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number)
            return hours * 60 + minutes
        }

        const currentMinutes = timeToMinutes(currentTime)
        const openMinutes = timeToMinutes(game.openTime)

        // Starline games are open from start of day (00:00) until open time, then closed
        if (currentMinutes <= openMinutes) {
            return { status: 'Open for Betting', color: 'bg-green-100 text-green-800', canBet: true }
        } else {
            return { status: 'Market Closed', color: 'bg-red-100 text-red-800', canBet: false }
        }
    }

    const openBetModal = (game) => {
        const gameStatus = getGameStatus(game)
        if (!gameStatus.canBet) {
            toast.error('Betting is not available for this game right now')
            return
        }

        setSelectedGame(game)
        setBetData({
            betType: 'single digit',
            betNumber: '',
            betAmount: ''
        })
        setShowBetModal(true)
    }

    const handleBetNumberChange = (value) => {
        const { betType } = betData

        // Validate input based on bet type
        if (betType === 'single digit') {
            if (value.length <= 1 && /^\d*$/.test(value)) {
                setBetData({ ...betData, betNumber: value })
            }
        } else {
            // For pana types, allow 3 digits
            if (value.length <= 3 && /^\d*$/.test(value)) {
                setBetData({ ...betData, betNumber: value })
            }
        }
    }

    const calculatePotentialWin = () => {
        const { betType, betAmount } = betData
        if (!betAmount || !rates[betType]) return 0

        const multiplier = rates[betType].multiplier
        return Math.floor(betAmount * multiplier)
    }

    const validateBetNumber = () => {
        const { betType, betNumber } = betData

        switch (betType) {
            case 'single digit':
                return /^[0-9]$/.test(betNumber)
            case 'single pana':
            case 'double pana':
            case 'triple pana':
                return /^[0-9]{3}$/.test(betNumber)
            default:
                return false
        }
    }

    const handlePlaceBet = async () => {
        if (!validateBetNumber()) {
            toast.error('Please enter a valid bet number')
            return
        }

        if (!betData.betAmount || betData.betAmount < selectedGame.minBet) {
            toast.error(`Minimum bet amount is ₹${selectedGame.minBet}`)
            return
        }

        if (betData.betAmount > selectedGame.maxBet) {
            toast.error(`Maximum bet amount is ₹${selectedGame.maxBet}`)
            return
        }

        if (betData.betAmount > balance) {
            toast.error('Insufficient balance')
            return
        }

        try {
            setPlacingBet(true)
            const token = localStorage.getItem('token')

            const response = await axios.post(`${API_URL}/starline/bets`, {
                gameId: selectedGame._id,
                betType: betData.betType,
                betNumber: betData.betNumber,
                betAmount: parseInt(betData.betAmount)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (response.data.success) {
                toast.success('Bet placed successfully!')
                setBalance(response.data.data.remainingBalance)
                setShowBetModal(false)
                setBetData({ betType: 'single digit', betNumber: '', betAmount: '' })
            }
        } catch (error) {
            console.error('Place bet error:', error)
            toast.error(error.response?.data?.message || 'Failed to place bet')
        } finally {
            setPlacingBet(false)
        }
    }

    const getBetTypeDescription = (betType) => {
        switch (betType) {
            case 'single digit':
                return 'Pick any single digit (0-9)'
            case 'single pana':
                return 'Pick any 3-digit number (000-999)'
            case 'double pana':
                return 'Pick a 3-digit number with exactly 2 same digits'
            case 'triple pana':
                return 'Pick a 3-digit number with all same digits (000, 111, etc.)'
            default:
                return ''
        }
    }

    const getGameTypeColor = (gameType) => {
        const colors = {
            'single digit': 'bg-blue-100 text-blue-800',
            'single pana': 'bg-green-100 text-green-800',
            'double pana': 'bg-yellow-100 text-yellow-800',
            'triple pana': 'bg-purple-100 text-purple-800'
        }
        return colors[gameType] || 'bg-gray-100 text-gray-800'
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading Starline games...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeader
                title="Starline Games"
                subtitle="Play Starline and win big prizes!"
                showBackButton={true}
                rightContent={
                    <div className="flex items-center space-x-1 sm:space-x-3">
                        {/* Balance Display - More compact on mobile */}
                        <div className="text-white text-right">
                            <div className="text-xs sm:text-sm font-bold">
                                ₹{balance.toLocaleString()}
                            </div>
                            <div className="text-xs opacity-75 hidden sm:block">
                                Balance
                            </div>
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={() => {
                                loadGames()
                                fetchLatestBalance()
                                toast.success('Refreshed!')
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 flex items-center space-x-1 sm:space-x-2"
                            title="Refresh"
                        >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="hidden sm:inline">Refresh</span>
                        </button>

                        {/* Chart Button - Icon only on mobile */}
                        <button
                            onClick={() => navigate('/starline-history')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 flex items-center space-x-1 sm:space-x-2"
                            title="View Chart"
                        >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className="hidden sm:inline">History</span>
                        </button>
                    </div>
                }
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Game Rates Section - Green Cards Design */}
                {Object.keys(rates).length > 0 && (
                    <div className="mb-6 sm:mb-8">
                        <div className="space-y-3 sm:space-y-4">
                            {/* Single Digit */}
                            <div className="bg-green-600 rounded-2xl px-6 py-4 flex justify-between items-center shadow-lg">
                                <h3 className="text-white font-bold text-lg sm:text-xl">SINGLE DIGIT</h3>
                                <span className="text-white font-bold text-lg sm:text-xl">
                                    ₹ {rates['single digit']?.minBetAmount || 10} - {rates['single digit']?.maxBetAmount || 100}
                                </span>
                            </div>

                            {/* Single Pana */}
                            <div className="bg-green-600 rounded-2xl px-6 py-4 flex justify-between items-center shadow-lg">
                                <h3 className="text-white font-bold text-lg sm:text-xl">SINGLE PANA</h3>
                                <span className="text-white font-bold text-lg sm:text-xl">
                                    ₹ {rates['single pana']?.minBetAmount || 10} - {rates['single pana']?.maxBetAmount || 1500}
                                </span>
                            </div>

                            {/* Double Pana */}
                            <div className="bg-green-600 rounded-2xl px-6 py-4 flex justify-between items-center shadow-lg">
                                <h3 className="text-white font-bold text-lg sm:text-xl">DOUBLE PANA</h3>
                                <span className="text-white font-bold text-lg sm:text-xl">
                                    ₹ {rates['double pana']?.minBetAmount || 10} - {rates['double pana']?.maxBetAmount || 3000}
                                </span>
                            </div>

                            {/* Triple Pana */}
                            <div className="bg-green-600 rounded-2xl px-6 py-4 flex justify-between items-center shadow-lg">
                                <h3 className="text-white font-bold text-lg sm:text-xl">TRIPLE PANA</h3>
                                <span className="text-white font-bold text-lg sm:text-xl">
                                    ₹ {rates['triple pana']?.minBetAmount || 10} - {rates['triple pana']?.maxBetAmount || 7000}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Starline Games List - Same design as Dashboard */}
                {games.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-6 sm:p-12 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No games available</h3>
                        <p className="mt-1 text-sm text-gray-500">Check back later for available games.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {games.map((game) => {
                            const gameStatus = getGameStatus(game)
                            // Use game.result from API (same as regular games)
                            const declaredResult = game.result && game.result !== '***' ? game.result : null

                            // Get user's bets for this game to show additional info
                            const gameBets = userBets.filter(bet => bet.gameId?._id === game._id || bet.gameId === game._id)
                            const hasPendingBets = gameBets.some(bet => bet.status === 'pending')
                            const hasWonBets = gameBets.some(bet => bet.status === 'won')
                            const hasLostBets = gameBets.some(bet => bet.status === 'lost')

                            return (
                                <div
                                    key={game._id}
                                    className="bg-white rounded-2xl shadow-lg overflow-hidden"
                                >
                                    {/* Black Header with Open/Close Times */}
                                    <div className="bg-black text-white px-3 py-2 flex justify-center items-center">
                                        <span className="font-bold text-xs">OPEN: {game.openTime}</span>

                                    </div>

                                    {/* Game Content */}
                                    <div className="px-3 py-2 text-center">
                                        {/* Game Name */}
                                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                                            {game.gameName}
                                        </h3>

                                        {/* Result Display - Starline Format */}
                                        <div className="mb-1">
                                            {declaredResult ? (
                                                <p className="text-blue-600 font-bold text-lg tracking-wider">
                                                    {game.digit !== undefined ? `${declaredResult}-${game.digit}` : declaredResult}
                                                </p>
                                            ) : (
                                                <p className="text-gray-600 text-xs tracking-widest">* * *</p>
                                            )}
                                        </div>

                                        {/* Status Display */}
                                        <div className="mb-2">
                                            {declaredResult ? (
                                                <p className="text-red-600 font-semibold text-sm">
                                                    Market Closed
                                                </p>
                                            ) : gameStatus.canBet ? (
                                                <p className="text-green-600 font-semibold text-sm">
                                                    Open for betting
                                                </p>
                                            ) : (
                                                <p className="text-red-600 font-semibold text-sm">
                                                    {gameStatus.status}
                                                </p>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex justify-between gap-2">
                                            <button
                                                onClick={() => navigate(`/starline-chart/${game._id}`)}
                                                className="bg-black text-white px-3 py-1.5 rounded-full font-semibold text-xs flex-1 max-w-24"
                                            >
                                                Chart
                                            </button>
                                            <button
                                                onClick={() => openBetModal(game)}
                                                disabled={!gameStatus.canBet}
                                                className={`px-3 py-1.5 rounded-full font-semibold text-xs flex-1 flex items-center justify-center gap-1 ${gameStatus.canBet
                                                    ? 'bg-black text-white'
                                                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                    }`}
                                            >
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                </svg>
                                                {gameStatus.canBet ? 'Play Game' : 'Closed'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Bet Modal - Mobile Responsive */}
            {showBetModal && selectedGame && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
                    <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md sm:max-w-lg lg:max-w-xl shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-base sm:text-lg font-medium text-gray-900 pr-2">
                                    Place Bet - {selectedGame.gameName}
                                </h3>
                                <button
                                    onClick={() => setShowBetModal(false)}
                                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                >
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4 sm:space-y-6">
                                {/* Game Info */}
                                <div className="bg-gray-50 p-3 sm:p-4 rounded-md">
                                    <div className="text-center">
                                        <div>
                                            <span className="text-gray-500">Your Balance:</span>
                                            <span className="ml-2 font-medium text-green-600">₹{balance.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bet Type Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Supported Bet Types:</label>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <button
                                            type="button"
                                            onClick={() => setBetData({ ...betData, betType: 'single digit', betNumber: '' })}
                                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                                betData.betType === 'single digit'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                                            }`}
                                        >
                                            single digit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBetData({ ...betData, betType: 'single pana', betNumber: '' })}
                                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                                betData.betType === 'single pana'
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                            }`}
                                        >
                                            single pana
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBetData({ ...betData, betType: 'double pana', betNumber: '' })}
                                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                                betData.betType === 'double pana'
                                                    ? 'bg-yellow-600 text-white'
                                                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'
                                            }`}
                                        >
                                            double pana
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBetData({ ...betData, betType: 'triple pana', betNumber: '' })}
                                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                                betData.betType === 'triple pana'
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                                            }`}
                                        >
                                            triple pana
                                        </button>
                                    </div>
                                    <div className="mt-2 flex justify-between items-center">
                                        <p className="text-xs text-gray-500">{getBetTypeDescription(betData.betType)}</p>
                                        {rates[betData.betType] && (
                                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                {rates[betData.betType].multiplier}x Rate
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Bet Number Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {betData.betType === 'single digit' ? 'Pick Number (0-9)' : 'Pick Number (3 digits)'}
                                    </label>
                                    <input
                                        type="text"
                                        value={betData.betNumber}
                                        onChange={(e) => handleBetNumberChange(e.target.value)}
                                        placeholder={betData.betType === 'single digit' ? '0' : '000'}
                                        maxLength={betData.betType === 'single digit' ? '1' : '3'}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xl sm:text-2xl font-bold text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Bet Amount Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Bet Amount</label>
                                    <input
                                        type="number"
                                        value={betData.betAmount}
                                        onChange={(e) => setBetData({ ...betData, betAmount: e.target.value })}
                                        placeholder="Enter amount"
                                        min={selectedGame.minBet}
                                        max={Math.min(selectedGame.maxBet, balance)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="mt-2 grid grid-cols-2 sm:flex sm:space-x-2 gap-2 sm:gap-0">
                                        {[100, 500, 1000, 2000].map(amount => (
                                            <button
                                                key={amount}
                                                onClick={() => setBetData({ ...betData, betAmount: amount.toString() })}
                                                disabled={amount > balance}
                                                className="px-2 sm:px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                ₹{amount}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Potential Win Display */}
                                {betData.betAmount && rates[betData.betType] && (
                                    <div className="bg-green-50 p-3 sm:p-4 rounded-md">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs sm:text-sm text-green-700">Potential Win:</span>
                                            <span className="text-base sm:text-lg font-bold text-green-900">
                                                ₹{calculatePotentialWin().toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-xs text-green-600">Multiplier:</span>
                                            <span className="text-xs sm:text-sm font-medium text-green-800">
                                                {rates[betData.betType].multiplier}x
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                                    <button
                                        onClick={() => setShowBetModal(false)}
                                        className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handlePlaceBet}
                                        disabled={!validateBetNumber() || !betData.betAmount || placingBet}
                                        className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                                    >
                                        {placingBet && (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        )}
                                        <span>{placingBet ? 'Placing...' : 'Place Bet'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default StarlineGaming