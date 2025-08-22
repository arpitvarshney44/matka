import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'
import NotificationBell from '../components/NotificationBell'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const AdminDashboard = () => {
  const { user, logout, API_URL } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // State for expandable menu sections
  const [expandedSections, setExpandedSections] = useState({
    reportManagement: false,
    walletManagement: false,
    gamesManagement: false,
    gamesNumbers: false,
    settings: false,
    starlineManagement: false
  })

  // State for admin configuration
  const [adminConfig, setAdminConfig] = useState({
    adminName: 'Admin',
    mobileNumber: '7665007800',
    upiId: '787794312@kbl',
    email: 'admin@gmail.com'
  })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    adminName: '',
    mobileNumber: '',
    password: '',
    upiId: '',
    email: ''
  })
  
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      totalGames: 0,
      activeGames: 0,
      totalBets: 0,
      todayBets: 0,
      revenue: 0
    },
    analytics: {
      today: { bets: 0, withdrawals: 0, profit: 0 },
      monthly: { bets: 0, withdrawals: 0, profit: 0 },
      yearly: { bets: 0, withdrawals: 0, profit: 0 }
    },
    userAnalytics: {
      total: 0,
      active: 0,
      inactive: 0,
      activePercentage: 0
    },
    userGrowth: {
      dailySignups: []
    }
  })
  const [dashboardLoading, setDashboardLoading] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'subadmin') {
      navigate('/auth')
      return
    }
    // Only load admin config for super admins
    if (user?.role === 'admin') {
      loadAdminConfig()
    }
    // Load dashboard data for both admin and subadmin
    loadDashboardData()
  }, [user, navigate])
  
  // Load dashboard data when dashboard tab is selected
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData()
    }
  }, [activeTab])

  const loadAdminConfig = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/admin-config/admin`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      setAdminConfig(response.data)
    } catch (error) {
      console.error('Error loading admin config:', error)
      toast.error('Failed to load admin configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = () => {
    setEditForm({
      adminName: adminConfig.adminName,
      mobileNumber: adminConfig.mobileNumber,
      password: '', // Don't show current password
      upiId: adminConfig.upiId,
      email: adminConfig.email
    })
    setEditing(true)
  }

  const handleSaveConfig = async () => {
    // Validate form fields
    if (!editForm.adminName.trim() || !editForm.mobileNumber.trim() || 
        !editForm.password.trim() || !editForm.upiId.trim() || !editForm.email.trim()) {
      toast.error('All fields are required')
      return
    }

    // Validate mobile number format
    if (!/^[0-9]{9,10}$/.test(editForm.mobileNumber)) {
      toast.error('Please enter a valid mobile number (9-10 digits)')
      return
    }

    // Validate password length
    if (editForm.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    try {
      const response = await axios.put(`${API_URL}/admin-config/admin`,
        editForm,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )
      setAdminConfig(response.data)
      setEditing(false)
      toast.success('Configuration updated successfully!')
    } catch (error) {
      console.error('Error updating admin config:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update configuration'
      toast.error(errorMessage)
    }
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditForm({
      adminName: '',
      mobileNumber: '',
      password: '',
      upiId: '',
      email: ''
    })
  }
  
  const loadDashboardData = async () => {
    setDashboardLoading(true)
    try {
      const response = await axios.get(`${API_URL}/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      setDashboardData(response.data)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setDashboardLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/auth')
  }

  // Payment Functions - removed verification

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const menuItems = [
    // Home Section
    { 
      name: 'Home', 
      icon: '🏠',
      action: () => setActiveTab('home'),
      section: 'home'
    },
    
    // Dashboard Section
    { 
      name: 'Dashboard', 
      icon: '📊',
      action: () => setActiveTab('dashboard'),
      section: 'dashboard'
    },
    
    // All Options Section
    { 
      name: 'Auto Active', 
      icon: '👥',
      action: () => navigate('/auto-active'),
      section: 'options'
    },
    { 
      name: 'User Management', 
      icon: '👤',
      action: () => navigate('/user-management'),
      section: 'options'
    },
    { 
      name: 'Declare Result', 
      icon: '🎯',
      action: () => navigate('/declare-result'),
      section: 'options'
    },
    { 
      name: 'Check Winners', 
      icon: '🏆',
      action: () => navigate('/check-winners'),
      section: 'options'
    },
    
    
    
    // Wallet Management Section (Expandable)
    { 
      name: 'Wallet Management', 
      icon: '💼',
      action: () => toggleSection('walletManagement'),
      section: 'wallet',
      expandable: true,
      subItems: [
        { name: 'Fund Request', action: () => navigate('/fund-request') },
        { name: 'Withdraw Request', action: () => navigate('/withdraw-request') },
        { name: 'Add fund (User wallet)', action: () => navigate('/add-fund-user-wallet') },
        { name: 'Withdraw fund (User wallet)', action: () => navigate('/withdraw-fund-user-wallet') }
      ]
    },
    
    // Payment Management section removed
    
    // Games Management Section (Expandable)
    { 
      name: 'Games Management', 
      icon: '🎮',
      action: () => toggleSection('gamesManagement'),
      section: 'games',
      expandable: true,
      subItems: [
        { name: 'Game Names', action: () => navigate('/game-names') },
        { name: 'Game Rates', action: () => navigate('/game-rates-admin') },
        { name: 'Winner Management', action: () => navigate('/winner-management') }
      ]
    },
    
    
    
    // Settings Section (Expandable) - from third image
    { 
      name: 'Settings', 
      icon: '⚙️',
      action: () => toggleSection('settings'),
      section: 'settings',
      expandable: true,
      subItems: [
        { name: 'Main Settings', action: () => navigate('/main-settings-admin') },
        { name: 'Update QR', action: () => navigate('/qr-settings-admin') },
        { name: 'Contact Settings', action: () => navigate('/contact-settings-admin') },
        { name: 'Slider Settings', action: () => navigate('/banner-settings-admin') },
        { name: 'How to Play', action: () => navigate('/how-to-play-admin') }
      ]
    },
    
    // Starline Management Section (Expandable) - from fourth image
    { 
      name: 'Starline Management', 
      icon: '✏️',
      action: () => toggleSection('starlineManagement'),
      section: 'starline',
      expandable: true,
      subItems: [
        { name: 'Starline Game Name', action: () => navigate('/starline-game-management') },
        { name: 'Starline Game Rates', action: () => navigate('/starline-rate-management') },
        { name: 'Starline Declare Result', action: () => navigate('/starline-result-declaration') },
        { name: 'Starline Check Winners', action: () => navigate('/starline-check-winners') },
        { name: 'Starline Result History', action: () => navigate('/starline-reports') }
      ]
    },
    
    // Additional Items from fourth image
    { 
      name: 'Users Query', 
      icon: '💬',
      action: () => navigate('/enquiry-management'),
      section: 'support'
    },
    { 
      name: 'Sub Admin Management', 
      icon: '🛡️',
      action: () => navigate('/sub-admin-list'),
      section: 'admin'
    }
  ]

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Configuration Details - Only for super admins */}
      {user?.role === 'admin' && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-purple-600">Configuration Details</h3>
            {!editing && (
              <button
                onClick={handleEditClick}
                className="p-2 text-gray-400 hover:text-purple-600 transition-colors duration-200"
                title="Edit Configuration"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        ) : editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name</label>
                <input
                  type="text"
                  value={editForm.adminName}
                  onChange={(e) => setEditForm({...editForm, adminName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={editForm.mobileNumber}
                  onChange={(e) => setEditForm({...editForm, mobileNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                <input
                  type="text"
                  value={editForm.upiId}
                  onChange={(e) => setEditForm({...editForm, upiId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-gray-700">
            <p><span className="font-medium">Admin Name:</span> {adminConfig.adminName}</p>
            <p><span className="font-medium">Email:</span> {adminConfig.email}</p>
            <p><span className="font-medium">UPI:</span> {adminConfig.upiId}</p>
            <p><span className="font-medium">Phone:</span> {adminConfig.mobileNumber}</p>
          </div>
        )}
        </div>
      )}

      {/* Loading indicator for dashboard data */}
      {dashboardLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-gray-600">Loading dashboard data...</span>
        </div>
      )}
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-purple-100 rounded-lg shadow-md p-6 border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-600 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-black">{dashboardData.stats.totalUsers.toLocaleString()}</p>
        </div>

        <div className="bg-purple-100 rounded-lg shadow-md p-6 border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-600 mb-2">Total Games</h3>
          <p className="text-3xl font-bold text-black">{dashboardData.stats.totalGames}</p>
            </div>
            </div>

      {/* User Analytics */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-purple-600 mb-4">User Analytics</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">{dashboardData.userAnalytics.active} Active Users</span>
            <span className="text-gray-700">{dashboardData.userAnalytics.inactive} Inactive Users</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-500 h-3 rounded-full" 
              style={{ width: `${dashboardData.userAnalytics.activePercentage}%` }}
            ></div>
        </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Active ({dashboardData.userAnalytics.activePercentage}%)</span>
            <span>Inactive ({100 - dashboardData.userAnalytics.activePercentage}%)</span>
          </div>
        </div>
            </div>

      {/* User Growth Analytics */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-purple-600">User Growth Analytics</h3>
          <button
            onClick={loadDashboardData}
            disabled={dashboardLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {dashboardLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
        <div className="h-64">
          {dashboardData.userGrowth?.dailySignups?.length > 0 ? (
            <Line
              data={{
                labels: dashboardData.userGrowth.dailySignups.map(item => item.date),
                datasets: [
                  {
                    label: 'Daily New Signups',
                    data: dashboardData.userGrowth.dailySignups.map(item => item.signups),
                    borderColor: 'rgb(147, 51, 234)', // Purple color to match theme
                    backgroundColor: 'rgba(147, 51, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(147, 51, 234)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      color: '#6b7280',
                      font: {
                        size: 12,
                      },
                    },
                  },
                  title: {
                    display: true,
                    text: 'Daily User Signups (Last 7 Days)',
                    color: '#374151',
                    font: {
                      size: 14,
                      weight: 'bold',
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                      color: '#6b7280',
                    },
                    grid: {
                      color: '#e5e7eb',
                    },
                  },
                  x: {
                    ticks: {
                      color: '#6b7280',
                    },
                    grid: {
                      color: '#e5e7eb',
                    },
                  },
                },
                interaction: {
                  intersect: false,
                },
                hover: {
                  mode: 'index',
                },
              }}
            />
          ) : (
            <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-500">No signup data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profit / Loss Report */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-blue-600 mb-4">Profit / Loss Report</h3>

        {/* Report Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Today</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Bids:</span>
                <span className="font-medium">{dashboardData.analytics.today.bets.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Withdrawals:</span>
                <span className="font-medium">{dashboardData.analytics.today.withdrawals.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Profit:</span>
                <span className="font-medium text-green-600">₹{dashboardData.analytics.today.profit.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* This Month */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">This Month</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Bids:</span>
                <span className="font-medium">{dashboardData.analytics.monthly.bets.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Withdrawals:</span>
                <span className="font-medium">{dashboardData.analytics.monthly.withdrawals.toLocaleString()}</span>
            </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Profit:</span>
                <span className="font-medium text-green-600">₹{dashboardData.analytics.monthly.profit.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* This Year */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">This Year</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Bids:</span>
                <span className="font-medium">{dashboardData.analytics.yearly.bets.toLocaleString()}</span>
      </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Withdrawals:</span>
                <span className="font-medium">{dashboardData.analytics.yearly.withdrawals.toLocaleString()}</span>
          </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Profit:</span>
                <span className="font-medium text-green-600">₹{dashboardData.analytics.yearly.profit.toLocaleString()}</span>
      </div>
    </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard()
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-black mb-4">Welcome to Admin Panel</h2>
            <p className="text-gray-600">Select an option from the sidebar to manage different aspects of the platform.</p>
          </div>
        )
    }
  }

  // Payment Management UI Components removed as verification system is removed



  return (
    <div className="min-h-screen bg-matka-grey-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header with Close Button and Admin Profile */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
                             <img 
                 src="/logo.jpg" 
                 alt="Raj Kalyan Matka Logo" 
                 className="w-12 h-12 object-cover rounded-full shadow-lg"
               />
              <div>
                <h3 className="font-bold text-gray-900 text-base">{user?.name || 'Admin'}</h3>
                <p className="text-sm text-gray-600">{user?.role === 'admin' ? 'Administrator' : 'Sub Administrator'}</p>
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

          {/* Admin Menu Items */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              {/* Home */}
              <button
                onClick={() => setActiveTab('home')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-3 ${
                  activeTab === 'home' 
                    ? 'bg-matka-green-50 text-matka-green-700 border border-matka-green-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">🏠</span>
                <span className="font-medium">Home</span>
              </button>

              <hr className="border-gray-200" />

              {/* Dashboard */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-3 ${
                  activeTab === 'dashboard' 
                    ? 'bg-matka-green-50 text-matka-green-700 border border-matka-green-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">📊</span>
                <span className="font-medium">Dashboard</span>
              </button>

              <hr className="border-gray-200" />

              {/* All Options Section */}
              <div className="pt-2">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">All Options</h4>
                {menuItems.filter(item => item.section === 'options').map((item, index) => (
                  <button
                    key={index}
                    onClick={item.action}
                    className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </button>
                ))}
              </div>

              

              {/* Wallet Management */}
              <div className="pt-2">
                <button
                  onClick={() => toggleSection('walletManagement')}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">💼</span>
                    <span className="font-medium">Wallet Management</span>
                  </div>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${expandedSections.walletManagement ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.walletManagement && (
                  <div className="ml-6 mt-1 space-y-1">
                    {menuItems.find(item => item.name === 'Wallet Management')?.subItems?.map((subItem, index) => (
                      <button
                        key={index}
                        onClick={subItem.action}
                        className="w-full text-left px-3 py-1 text-gray-600 hover:bg-gray-50 rounded transition-colors duration-200 text-sm"
                      >
                        {subItem.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Games Management */}
              <div className="pt-2">
                <button
                  onClick={() => toggleSection('gamesManagement')}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">🎮</span>
                    <span className="font-medium">Games Management</span>
                  </div>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${expandedSections.gamesManagement ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.gamesManagement && (
                  <div className="ml-6 mt-1 space-y-1">
                    {menuItems.find(item => item.name === 'Games Management')?.subItems?.map((subItem, index) => (
                      <button
                        key={index}
                        onClick={subItem.action}
                        className="w-full text-left px-3 py-1 text-gray-600 hover:bg-gray-50 rounded transition-colors duration-200 text-sm"
                      >
                        {subItem.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              

              {/* Settings */}
              <div className="pt-2">
                <button
                  onClick={() => toggleSection('settings')}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">⚙️</span>
                    <span className="font-medium">Settings</span>
                  </div>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${expandedSections.settings ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.settings && (
                  <div className="ml-6 mt-1 space-y-1">
                    {menuItems.find(item => item.name === 'Settings')?.subItems?.map((subItem, index) => (
                      <button
                        key={index}
                        onClick={subItem.action}
                        className="w-full text-left px-3 py-1 text-gray-600 hover:bg-gray-50 rounded transition-colors duration-200 text-sm"
                      >
                        {subItem.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Starline Management */}
              <div className="pt-2">
                <button
                  onClick={() => toggleSection('starlineManagement')}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">✏️</span>
                    <span className="font-medium">Starline Management</span>
                  </div>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${expandedSections.starlineManagement ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.starlineManagement && (
                  <div className="ml-6 mt-1 space-y-1">
                    {menuItems.find(item => item.name === 'Starline Management')?.subItems?.map((subItem, index) => (
                      <button
                        key={index}
                        onClick={subItem.action}
                        className="w-full text-left px-3 py-1 text-gray-600 hover:bg-gray-50 rounded transition-colors duration-200 text-sm"
                      >
                        {subItem.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Items */}
              {menuItems.filter(item => ['support', 'admin'].includes(item.section)).map((item, index) => {
                // Hide Sub Admin Management for subadmins
                if (item.name === 'Sub Admin Management' && user?.role === 'subadmin') {
                  return null
                }
                return (
                  <button
                    key={index}
                    onClick={item.action}
                    className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-3"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Version and Sign Out */}
          <div className="p-4 border-t border-gray-200">
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
        <div className="bg-matka-green-800 shadow-lg px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Hamburger and Title */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-white hover:bg-matka-green-700 transition-colors duration-200 flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Title - responsive text sizing */}
              <h1 className="text-sm sm:text-lg md:text-xl font-bold text-white truncate">
                <span className="hidden sm:inline">RAJ KALYAN MATKA - ADMIN</span>
                <span className="sm:hidden">RKM ADMIN</span>
              </h1>
            </div>
            
            {/* Right side - User info and notification */}
            <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
              <div className="hidden sm:block">
                <NotificationBell />
              </div>
              
              {/* User info - hidden on very small screens, compact on mobile */}
              <div className="hidden xs:flex items-center space-x-2">
                <span className="text-white/80 text-xs sm:text-sm truncate max-w-20 sm:max-w-none">
                  <span className="hidden sm:inline">Welcome, </span>
                  {user?.name}
                </span>
                <span className="px-2 py-1 bg-white/20 text-white text-xs font-medium rounded-full whitespace-nowrap">
                  {user?.role === 'admin' ? 'Admin' : 'Sub Admin'}
                </span>
              </div>
              
              {/* Mobile-only notification bell */}
              <div className="sm:hidden">
                <NotificationBell />
              </div>
            </div>
          </div>
          
          {/* Mobile user info row - shown only on very small screens */}
          <div className="xs:hidden mt-2 flex items-center justify-between">
            <span className="text-white/80 text-xs">
              Welcome, {user?.name}
            </span>
            <span className="px-2 py-1 bg-white/20 text-white text-xs font-medium rounded-full">
              {user?.role === 'admin' ? 'Admin' : 'Sub Admin'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 lg:p-6 bg-gray-100 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard 