import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Banner from '../components/Banner'
import axios from 'axios'

const Dashboard = () => {
  const { user, logout, API_URL } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [appLink, setAppLink] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [dashboardBalance, setDashboardBalance] = useState(user?.balance || 0)
  const [games, setGames] = useState([])

  useEffect(() => {
    loadAppLink()
    loadWhatsappNumber()
    fetchLatestBalance()
    fetchGames()

    // Auto-refresh games every 30 seconds to catch admin changes
    const interval = setInterval(() => {
      fetchGames()
      fetchLatestBalance()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Optionally, update balance if user changes (e.g. after login)
  useEffect(() => {
    if (user?.balance !== undefined) setDashboardBalance(user.balance)
  }, [user])

  const fetchGames = async (showToast = false) => {
    try {
      const response = await axios.get(`${API_URL}/games`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      // Sort games by opening time
      const sortedGames = response.data.sort((a, b) => {
        const timeToMinutes = (timeStr) => {
          const [hours, minutes] = timeStr.split(':').map(Number)
          return hours * 60 + minutes
        }
        return timeToMinutes(a.openTime) - timeToMinutes(b.openTime)
      })

      setGames(sortedGames)
      if (showToast) {
        toast.success('Games updated!')
      }
    } catch (error) {
      console.error('Error fetching games:', error)
      toast.error('Failed to load games.')
    }
  }

  const fetchLatestBalance = async () => {
    try {
      const response = await axios.get(`${API_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      setDashboardBalance(response.data.user.balance || 0)
    } catch (error) {
      // fallback to context value
      setDashboardBalance(user?.balance || 0)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/auth')
  }

  const loadAppLink = async () => {
    try {
      const response = await axios.get('/main-settings/public')
      setAppLink(response.data.appLink)
    } catch (error) {
      console.error('Error loading app link:', error)
      // Use default link if API fails
      setAppLink('https://play.google.com/store/apps/details?id=com.superstar.starkalyan')
    }
  }

  const loadWhatsappNumber = async () => {
    try {
      const response = await axios.get('/main-settings/public')
      setWhatsappNumber(response.data.whatsappNumber)
    } catch (error) {
      console.error('Error loading WhatsApp number:', error)
      // Use default number if API fails
      setWhatsappNumber('91766500780')
    }
  }

  const handleRateUs = () => {
    if (appLink) {
      window.open(appLink, '_blank')
    } else {
      // Fallback to default link
      window.open('https://play.google.com/store/apps/details?id=com.superstar.starkalyan', '_blank')
    }
  }

  const handleInviteFriends = () => {
    const shareText = `🎮 Join me on Raj Kalyan Matka! 

🏆 Experience the best matka gaming platform with:
• Multiple games and betting options
• Secure transactions
• 24/7 customer support
• Easy withdrawal system

📱 Download now: ${appLink || 'https://play.google.com/store/apps/details?id=com.superstar.starkalyan'}

🎯 Start winning today! 🚀`

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleWhatsappChat = () => {
    if (whatsappNumber) {
      const whatsappUrl = `https://wa.me/${whatsappNumber}`
      window.open(whatsappUrl, '_blank')
    } else {
      toast.error('WhatsApp number not available')
    }
  }

  const menuItems = [
    {
      name: 'How To Play',
      icon: '▶️',
      action: () => navigate('/how-to-play')
    },
    {
      name: 'Contact Us',
      icon: '📞',
      action: () => navigate('/contact-us')
    },
    {
      name: 'Privacy Policy',
      icon: '📄',
      action: () => navigate('/privacy-policy')
    },
    {
      name: 'Enquiry',
      icon: '❓',
      action: () => navigate('/enquiry')
    }
  ]

  // Check if user is active
  const isActiveUser = user?.isActive !== false

  // Active User Dashboard
  const ActiveUserDashboard = () => (
    <div className="min-h-screen bg-white">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header with Close Button and User Profile */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.jpg"
                alt="Raj Kalyan Matka Logo"
                className="w-12 h-12 rounded-full object-cover shadow-lg"
              />
              <div>
                <h3 className="font-bold text-gray-900 text-base">{user?.name || 'Arpit'}</h3>
                <p className="text-sm text-gray-600">{user?.mobileNumber || '8445168224'}</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Profile Section */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => navigate('/wallet')}
              className="w-full bg-yellow-400 text-black py-2 px-4 rounded-lg font-semibold hover:bg-yellow-500 transition-colors duration-200"
            >
              View Profile
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            {/* Wallet Section */}
            <div className="p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Wallet</h4>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => navigate('/add-fund')}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3"
                  >
                    <span className="text-lg">💰</span>
                    <span className="font-medium">Add Funds</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/withdraw-fund')}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3"
                  >
                    <span className="text-lg">💸</span>
                    <span className="font-medium">Withdraw Funds</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/wallet-statement')}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3"
                  >
                    <span className="text-lg">📊</span>
                    <span className="font-medium">Wallet Statement</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/winning-history')}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3"
                  >
                    <span className="text-lg">🏆</span>
                    <span className="font-medium">Winning History</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/bidding-history')}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3"
                  >
                    <span className="text-lg">📅</span>
                    <span className="font-medium">Bidding History</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Bank Details Section */}
            <div className="p-4 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h4>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => navigate('/bank')}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3"
                  >
                    <span className="text-lg">🏦</span>
                    <span className="font-medium">Manage Bank Details</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/paytm')}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3"
                  >
                    <span className="text-lg">💳</span>
                    <span className="font-medium">Manage Paytm</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/googlepay')}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3"
                  >
                    <span className="text-lg">📱</span>
                    <span className="font-medium">Manage Google Pay</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/phonepe')}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3"
                  >
                    <span className="text-lg">📱</span>
                    <span className="font-medium">Manage PhonePe</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* More Options Section */}
            <div className="p-4 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">More Options</h4>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => navigate('/game-rates')}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3">
                    <span className="text-lg">🏦</span>
                    <span className="font-medium">Game Rates</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/how-to-play')}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3"
                  >
                    <span className="text-lg">▶️</span>
                    <span className="font-medium">How To Play</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/privacy-policy')}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3"
                  >
                    <span className="text-lg">🛡️</span>
                    <span className="font-medium">Privacy Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/contact-us')}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3"
                  >
                    <span className="text-lg">📞</span>
                    <span className="font-medium">Contact Us</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/enquiry')}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3"
                  >
                    <span className="text-lg">❓</span>
                    <span className="font-medium">Enquiry</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleInviteFriends}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3"
                  >
                    <span className="text-lg">📤</span>
                    <span className="font-medium">Invite Friends</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleRateUs}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3"
                  >
                    <span className="text-lg">⭐</span>
                    <span className="font-medium">Rate Us</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/change-password')}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3"
                  >
                    <span className="text-lg">🔐</span>
                    <span className="font-medium">Change Password</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Version and Sign Out */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500">Version 1.0.0</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        {/* Top Header */}
        <div className="bg-green-800 shadow-lg px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-white hover:bg-green-700 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <h1 className="text-xl font-bold text-white">RAJ KALYAN MATKA</h1>
            </div>
            <div className="flex items-center space-x-2 text-white">
              <button
                onClick={() => navigate('/wallet')}
                className="flex items-center space-x-2 hover:bg-green-700 px-2 py-1 rounded transition-colors duration-200"
              >
                <span className="font-bold">{dashboardBalance}</span>
                <span className="text-lg">💰</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-4 lg:p-6 bg-gray-100 min-h-screen">
          {/* Banner Component */}
          <Banner />

          {/* Action Buttons Grid - Mobile Responsive */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* WhatsApp Button - Compact Mobile Design */}
            <button
              onClick={handleWhatsappChat}
              className="group bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center py-4 px-3 transform hover:scale-105"
            >
              <div className="mb-2">
                <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </div>
              <span className="text-black text-sm font-bold">WhatsApp</span>
            </button>

            {/* Game Rates Button - Compact Mobile Design */}
            <button
              onClick={() => navigate('/game-rates')}
              className="group bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center py-4 px-3 transform hover:scale-105"
            >
              <div className="mb-2">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-black text-sm font-bold">Game Rates</span>
            </button>

            {/* Deposit Button - Compact Mobile Design */}
            <button
              onClick={() => navigate('/add-fund')}
              className="group bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center py-4 px-3 transform hover:scale-105"
            >
              <div className="mb-2">
                <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="8" width="20" height="8" rx="1" fill="currentColor" />
                  <circle cx="6" cy="12" r="1.5" fill="white" />
                  <circle cx="18" cy="12" r="1.5" fill="white" />
                  <rect x="10" y="10" width="4" height="4" rx="0.5" fill="white" />
                </svg>
              </div>
              <span className="text-black text-sm font-bold">Deposit</span>
            </button>

            {/* Withdraw Button - Compact Mobile Design */}
            <button
              onClick={() => navigate('/withdraw-fund')}
              className="group bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center py-4 px-3 transform hover:scale-105"
            >
              <div className="mb-2">
                <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  <path d="M12 8c-.6 0-1 .4-1 1v1h2V9c0-.6-.4-1-1-1z" />
                  <path d="M5 12c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2H5z" />
                  <path d="M11 16h2v2h-2z" />
                  <path d="M9 14h6v1H9z" />
                </svg>
              </div>
              <span className="text-black text-sm font-bold">Withdraw</span>
            </button>
          </div>

          {/* Play Starline Button */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/starline-gaming')}
              className="relative w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-5 px-6 rounded-2xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative z-10 flex items-center justify-center space-x-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>Play Starline</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </button>
          </div>

          {/* Games List */}
          <div className="space-y-4">
            {games.map((game) => {
              // Calculate game status with session-specific logic
              const now = new Date()
              const currentTime = now.toTimeString().slice(0, 5) // HH:MM format

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

              // Check if market is closed due to time expiry
              const isMarketClosed = currentMinutes > closeMinutes && !hasCompleteResult

              return (
                <div
                  key={game._id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden"
                >
                  {/* Black Header with Open/Close Times */}
                  <div className="bg-black text-white px-3 py-2 flex justify-between items-center">
                    <span className="font-bold text-xs">OPEN: {game.openTime}</span>
                    <span className="font-bold text-xs">CLOSE: {game.closeTime}</span>
                  </div>

                  {/* Game Content */}
                  <div className="px-3 py-2 text-center">
                    {/* Game Name */}
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      {game.gameName}
                    </h3>

                    {/* Result Display */}
                    <div className="mb-1">
                      {hasCompleteResult || hasOpenResult || hasCloseResult ? (
                        <p className="text-blue-600 font-bold text-lg tracking-wider">
                          {game.result}
                        </p>
                      ) : (
                        <p className="text-gray-600 text-xs tracking-widest">--- - - - - ---</p>
                      )}
                    </div>

                    {/* Status Text */}
                    <div className="mb-2">
                      {currentMinutes > closeMinutes ? (
                        <p className="text-red-600 font-semibold text-sm">
                          Market Closed
                        </p>
                      ) : hasCompleteResult ? (
                        <p className="text-blue-600 font-semibold text-xs">
                          Result Declared
                        </p>
                      ) : isGameActive ? (
                        <div className="flex justify-center gap-2 text-xs">
                          <span className={openSessionAvailable ? 'text-green-600' : 'text-red-500'}>
                            {openSessionAvailable ? '✓' : hasOpenResult ? 'Result' : '✗'} Open
                          </span>
                          <span className={closeSessionAvailable ? 'text-green-600' : 'text-red-500'}>
                            {closeSessionAvailable ? '✓' : hasCloseResult ? 'Result' : '✗'} Close
                          </span>
                        </div>
                      ) : (
                        <p className="text-red-600 font-semibold text-sm">
                          Game Closed
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between gap-2">
                      <button
                        onClick={() => navigate(`/game-chart/${game._id}`)}
                        className="bg-black text-white px-3 py-1.5 rounded-full font-semibold text-xs flex-1 max-w-24"
                      >
                        Chart
                      </button>
                      <button
                        onClick={() => navigate(`/game-selection/${game._id}`)}
                        className="bg-black text-white px-3 py-1.5 rounded-full font-semibold text-xs flex-1 flex items-center justify-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        Play Game
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Floating Refresh Button */}
          <button
            onClick={() => {
              fetchGames(true)
              fetchLatestBalance()
            }}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-green-600 to-green-700 text-white w-14 h-14 rounded-full shadow-2xl hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center transform hover:scale-110 group"
          >
            <svg className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )

  // Inactive User Dashboard (Current Dashboard)
  const InactiveUserDashboard = () => (
    <div className="min-h-screen bg-matka-grey-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header with Close Button and User Profile */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.jpg"
                alt="Raj Kalyan Matka Logo"
                className="w-12 h-12 rounded-full object-cover shadow-lg"
              />
              <div>
                <h3 className="font-bold text-gray-900 text-base">{user?.name || 'Arpit'}</h3>
                <p className="text-sm text-gray-600">{user?.mobileNumber || '8445168224'}</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* More Options Section */}
          <div className="flex-1 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">More Options</h4>
            <ul className="space-y-3">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={item.action}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3 group"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Version and Sign Out */}
          <div className="p-6 border-t border-gray-200">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500">Version 1.0.0</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200 border-2 border-red-600 hover:border-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        {/* Top Header */}
        <div className="bg-matka-green-800 shadow-lg px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-white hover:bg-matka-green-700 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <h1 className="text-xl font-bold text-white">RAJ KALYAN MATKA</h1>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-4 lg:p-6 bg-matka-grey-800 min-h-screen">
          {/* Banner Component */}
          <Banner />

          {/* Action Buttons */}
          <div className="mb-6 lg:mb-8 space-y-3 lg:space-y-4">
            <button
              onClick={handleWhatsappChat}
              className="w-full bg-matka-green-700 text-white py-3 lg:py-4 px-6 rounded-lg font-semibold text-base lg:text-lg hover:bg-matka-green-600 transition-colors duration-200 shadow-lg"
            >
              Whatsapp
            </button>
            <button
              onClick={() => toast.info('Starline Information coming soon!')}
              className="w-full bg-matka-green-700 text-white py-3 lg:py-4 px-6 rounded-lg font-semibold text-base lg:text-lg hover:bg-matka-green-600 transition-colors duration-200 shadow-lg"
            >
              Starline Information
            </button>
          </div>

          {/* Games Grid */}
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6">Available Games</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {games.map((game) => (
                <div
                  key={game._id}
                  className="bg-gray-700 rounded-lg border-2 border-matka-green-600 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
                  onClick={() => toast.info(`${game.gameName} game coming soon!`)}
                >
                  <div className="p-4 lg:p-6">
                    <div className="text-center mb-3 lg:mb-4">
                      <p className="text-matka-green-400 text-xs lg:text-sm font-medium">
                        Open: {game.openTime} - Close: {game.closeTime}
                      </p>
                    </div>
                    <h3 className="text-lg lg:text-xl font-bold text-white text-center mb-3 lg:mb-4">{game.gameName}</h3>
                    <div className="text-center">
                      <p className="text-gray-300 text-base lg:text-lg font-mono">***-**-***</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Render appropriate dashboard based on user status
  return isActiveUser ? <ActiveUserDashboard /> : <InactiveUserDashboard />
}

export default Dashboard