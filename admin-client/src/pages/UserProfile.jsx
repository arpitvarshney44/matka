import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const UserProfile = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { API_URL } = useAuth()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [passwordRequests, setPasswordRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    accountDetails: false,
    paymentDetails: false,
    depositHistory: false,
    transactions: false,
    bets: false,
    winningHistory: false
  })
  const [tabData, setTabData] = useState({
    depositHistory: { data: [], loading: false, loaded: false },
    transactions: { data: [], loading: false, loaded: false },
    bets: { data: [], loading: false, loaded: false },
    winningHistory: { data: [], loading: false, loaded: false }
  })

  useEffect(() => {
    if (userId) {
      loadUserProfile()
      loadPasswordRequests()
    }
  }, [userId])

  const loadUserProfile = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/user/admin/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      setUser(response.data.user)
    } catch (error) {
      console.error('Error loading user profile:', error)
      toast.error('Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  const loadPasswordRequests = async () => {
    setLoadingRequests(true)
    try {
      const response = await axios.get(`${API_URL}/user/admin/password-requests/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      setPasswordRequests(response.data.requests)
    } catch (error) {
      console.error('Error loading password requests:', error)
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleApprovePassword = async (requestId) => {
    try {
      await axios.put(`${API_URL}/user/admin/password-requests/${requestId}/approve`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      toast.success('Password change approved successfully!')
      loadPasswordRequests() // Reload the requests
    } catch (error) {
      console.error('Error approving password change:', error)
      toast.error('Failed to approve password change')
    }
  }

  const handleRejectPassword = async (requestId, reason) => {
    try {
      await axios.put(`${API_URL}/user/admin/password-requests/${requestId}/reject`, {
        rejectionReason: reason
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      toast.success('Password change rejected successfully!')
      loadPasswordRequests() // Reload the requests
    } catch (error) {
      console.error('Error rejecting password change:', error)
      toast.error('Failed to reject password change')
    }
  }

  const toggleSection = async (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
    
    // If expanding a tab section and data hasn't been loaded, fetch it
    if (!expandedSections[section] && ['depositHistory', 'transactions', 'bets', 'winningHistory'].includes(section) && !tabData[section].loaded) {
      await fetchTabData(section)
    }
  }

  const fetchTabData = async (tabType) => {
    // Set loading state
    setTabData(prev => ({
      ...prev,
      [tabType]: { ...prev[tabType], loading: true }
    }))

    try {
      let endpoint
      switch (tabType) {
        case 'depositHistory':
          endpoint = `${API_URL}/admin/user/${userId}/fund-requests`
          break
        case 'transactions':
          endpoint = `${API_URL}/admin/user/${userId}/withdrawals`
          break
        case 'bets':
          endpoint = `${API_URL}/admin/user/${userId}/bets`
          break
        case 'winningHistory':
          endpoint = `${API_URL}/admin/user/${userId}/winning-history`
          break
        default:
          throw new Error('Invalid tab type')
      }

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          page: 1,
          limit: 50
        }
      })

      // Update state with fetched data
      setTabData(prev => ({
        ...prev,
        [tabType]: {
          data: response.data,
          loading: false,
          loaded: true
        }
      }))
    } catch (error) {
      console.error(`Error fetching ${tabType} data:`, error)
      toast.error(`Failed to load ${tabType.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
      
      // Set error state
      setTabData(prev => ({
        ...prev,
        [tabType]: {
          data: [],
          loading: false,
          loaded: true
        }
      }))
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">User not found</p>
          <button
            onClick={() => navigate('/user-management')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Users
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
          <button
            onClick={() => navigate('/user-management')}
            className="text-white hover:text-gray-200 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">UserProfile</h1>
          <div className="w-6"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 lg:p-6">
        {/* User Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-4">
            {/* Profile Picture */}
            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-blue-600 mb-1">{user.name}</h2>
              <p className="text-gray-600">{user.mobileNumber}</p>
              {user.email && <p className="text-gray-500 text-sm">{user.email}</p>}
            </div>
          </div>
        </div>

        {/* Account Details Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
          <div 
            className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => toggleSection('accountDetails')}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-blue-600 font-medium">Account Details</span>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.accountDetails ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {expandedSections.accountDetails && (
            <div className="px-4 pb-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-blue-600 font-medium">Funds:</span>
                <span className="text-gray-700">₹{user.balance || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-blue-600 font-medium">Account Holder:</span>
                <span className="text-gray-700">{user.bankDetails?.accountHolderName || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-blue-600 font-medium">Bank:</span>
                <span className="text-gray-700">{user.bankDetails?.bankName || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-blue-600 font-medium">Account No:</span>
                <span className="text-gray-700">{user.bankDetails?.accountNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-blue-600 font-medium">IFSC Code:</span>
                <span className="text-gray-700">{user.bankDetails?.ifscCode || 'N/A'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Payment Details Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
          <div 
            className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => toggleSection('paymentDetails')}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <span className="text-blue-600 font-medium">Payment Details</span>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.paymentDetails ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {expandedSections.paymentDetails && (
            <div className="px-4 pb-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-blue-600 font-medium">Google Pay:</span>
                <span className="text-gray-700">{user.paymentDetails?.googlePay || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-blue-600 font-medium">PhonePe:</span>
                <span className="text-gray-700">{user.paymentDetails?.phonepe || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-blue-600 font-medium">Paytm:</span>
                <span className="text-gray-700">{user.paymentDetails?.paytm || 'N/A'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Deposit History Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
          <div 
            className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => toggleSection('depositHistory')}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-blue-600 font-medium">Deposit History</span>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.depositHistory ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {expandedSections.depositHistory && (
            <div className="px-4 pb-4">
              {tabData.depositHistory.loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading deposit history...</p>
                </div>
              ) : tabData.depositHistory.data?.requests?.length > 0 ? (
                <div className="space-y-3">
                  {tabData.depositHistory.data.summary && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-600">Total Requests:</span>
                          <span className="ml-2 font-medium">{tabData.depositHistory.data.summary.totalRequests}</span>
                        </div>
                        <div>
                          <span className="text-blue-600">Total Amount:</span>
                          <span className="ml-2 font-medium">{formatCurrency(tabData.depositHistory.data.summary.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {tabData.depositHistory.data.requests.map((request) => (
                    <div key={request._id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{formatCurrency(request.amount)}</p>
                          <p className="text-sm text-gray-600">{formatDate(request.createdAt)}</p>
                          {request.transactionId && (
                            <p className="text-xs text-gray-500">ID: {request.transactionId}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      {request.paymentMethod && (
                        <p className="text-sm text-gray-600">Method: {request.paymentMethod}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No deposit history found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transactions Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
          <div 
            className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => toggleSection('transactions')}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <span className="text-blue-600 font-medium">Transactions</span>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.transactions ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {expandedSections.transactions && (
            <div className="px-4 pb-4">
              {tabData.transactions.loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading transactions...</p>
                </div>
              ) : tabData.transactions.data?.withdrawals?.length > 0 ? (
                <div className="space-y-3">
                  {tabData.transactions.data.summary && (
                    <div className="bg-purple-50 p-3 rounded-lg mb-4">
                      <h4 className="font-medium text-purple-900 mb-2">Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-purple-600">Total Withdrawals:</span>
                          <span className="ml-2 font-medium">{tabData.transactions.data.summary.totalWithdrawals}</span>
                        </div>
                        <div>
                          <span className="text-purple-600">Total Amount:</span>
                          <span className="ml-2 font-medium">{formatCurrency(tabData.transactions.data.summary.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {tabData.transactions.data.withdrawals.map((withdrawal) => (
                    <div key={withdrawal._id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{formatCurrency(withdrawal.amount)}</p>
                          <p className="text-sm text-gray-600">{formatDate(withdrawal.createdAt)}</p>
                          {withdrawal.transactionId && (
                            <p className="text-xs text-gray-500">ID: {withdrawal.transactionId}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          withdrawal.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {withdrawal.status}
                        </span>
                      </div>
                      {withdrawal.bankDetails && (
                        <div className="text-sm text-gray-600">
                          <p>Bank: {withdrawal.bankDetails.bankName}</p>
                          <p>Account: {withdrawal.bankDetails.accountNumber}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No transactions found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bets Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
          <div 
            className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => toggleSection('bets')}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-blue-600 font-medium">Bets</span>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.bets ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {expandedSections.bets && (
            <div className="px-4 pb-4">
              {tabData.bets.loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading bets...</p>
                </div>
              ) : tabData.bets.data?.bets?.length > 0 ? (
                <div className="space-y-3">
                  {tabData.bets.data.summary && (
                    <div className="bg-red-50 p-3 rounded-lg mb-4">
                      <h4 className="font-medium text-red-900 mb-2">Summary</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-red-600">Total Bets:</span>
                          <span className="ml-2 font-medium">{tabData.bets.data.summary.totalBets}</span>
                        </div>
                        <div>
                          <span className="text-red-600">Total Amount:</span>
                          <span className="ml-2 font-medium">{formatCurrency(tabData.bets.data.summary.totalBetAmount)}</span>
                        </div>
                        <div>
                          <span className="text-red-600">Total Winnings:</span>
                          <span className="ml-2 font-medium">{formatCurrency(tabData.bets.data.summary.totalWinAmount)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {tabData.bets.data.bets.map((bet) => (
                    <div key={bet._id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{bet.gameType} - {bet.betType}</p>
                          <p className="text-sm text-gray-600">{formatDate(bet.createdAt)}</p>
                          <p className="text-sm text-gray-600">Numbers: {bet.numbers?.join(', ') || bet.number}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(bet.betAmount)}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bet.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            bet.status === 'won' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {bet.status}
                          </span>
                        </div>
                      </div>
                      {bet.winAmount && bet.winAmount > 0 && (
                        <p className="text-sm text-green-600 font-medium">Won: {formatCurrency(bet.winAmount)}</p>
                      )}
                      {bet.gameSession && (
                        <p className="text-xs text-gray-500">Session: {bet.gameSession}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No bets found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Winning History Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
          <div 
            className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => toggleSection('winningHistory')}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <span className="text-blue-600 font-medium">Winning History</span>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.winningHistory ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {expandedSections.winningHistory && (
            <div className="px-4 pb-4">
              {tabData.winningHistory.loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading winning history...</p>
                </div>
              ) : tabData.winningHistory.data?.winnings?.length > 0 ? (
                <div className="space-y-3">
                  {tabData.winningHistory.data.summary && (
                    <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                      <h4 className="font-medium text-yellow-900 mb-2">Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-yellow-600">Total Wins:</span>
                          <span className="ml-2 font-medium">{tabData.winningHistory.data.summary.totalWinnings}</span>
                        </div>
                        <div>
                          <span className="text-yellow-600">Total Amount:</span>
                          <span className="ml-2 font-medium">{formatCurrency(tabData.winningHistory.data.summary.totalWinAmount)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {tabData.winningHistory.data.winnings.map((win) => (
                    <div key={`${win.source}-${win._id}`} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{win.gameType} - {win.betType}</p>
                          <p className="text-sm text-gray-600">{formatDate(win.createdAt)}</p>
                          <p className="text-sm text-gray-600">Numbers: {win.numbers?.join(', ') || win.number}</p>
                          <p className="text-xs text-gray-500">Source: {win.source}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">{formatCurrency(win.winAmount)}</p>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Won
                          </span>
                        </div>
                      </div>
                      {win.gameSession && (
                        <p className="text-xs text-gray-500">Session: {win.gameSession}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No winning history found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Password Change Requests Section */}
        {passwordRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Password Change Requests</h3>
            </div>
            <div className="p-4 space-y-4">
              {passwordRequests.map((request) => (
                <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{request.userName}</p>
                      <p className="text-sm text-gray-600">{request.userMobile}</p>
                      <p className="text-sm text-gray-500">
                        Requested: {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  
                  {request.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprovePassword(request._id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectPassword(request._id, 'Rejected by admin')}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  
                  {request.status === 'rejected' && request.rejectionReason && (
                    <p className="text-sm text-red-600 mt-2">
                      Reason: {request.rejectionReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile 