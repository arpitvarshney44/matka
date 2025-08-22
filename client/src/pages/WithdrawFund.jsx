import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'

const WithdrawFund = () => {
  const { user, API_URL } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [mainSettings, setMainSettings] = useState({})
  const [userDetails, setUserDetails] = useState({})
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('')
  const [availableMethods, setAvailableMethods] = useState([])
  const [withdrawalHistory, setWithdrawalHistory] = useState([])

  useEffect(() => {
    fetchMainSettings()
    fetchUserDetails()
    fetchWithdrawalHistory()
  }, [])

  const fetchMainSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/main-settings/public`)
      setMainSettings(response.data)
    } catch (error) {
      console.error('Error fetching main settings:', error)
      toast.error('Failed to load settings')
    }
  }

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const userData = response.data.user
      setUserDetails(userData)
      
      // Check available withdrawal methods
      const methods = []
      const bankDetails = userData.bankDetails || {}
      const paymentDetails = userData.paymentDetails || {}

      if (bankDetails?.accountNumber && bankDetails?.accountHolderName && bankDetails?.ifscCode && bankDetails?.bankName) {
        methods.push({
          id: 'bank',
          name: 'Bank Account',
          icon: '🏦',
          details: `${bankDetails.bankName} - ${bankDetails.accountNumber}`
        })
      }

      if (paymentDetails?.phonepe) {
        methods.push({
          id: 'phonepe',
          name: 'PhonePe',
          icon: '📱',
          details: paymentDetails.phonepe
        })
      }

      if (paymentDetails?.googlePay) {
        methods.push({
          id: 'googlepay',
          name: 'Google Pay',
          icon: '💳',
          details: paymentDetails.googlePay
        })
      }

      if (paymentDetails?.paytm) {
        methods.push({
          id: 'paytm',
          name: 'Paytm',
          icon: '💰',
          details: paymentDetails.paytm
        })
      }

      setAvailableMethods(methods)
    } catch (error) {
      console.error('Error fetching user details:', error)
      toast.error('Failed to load user details')
    }
  }

  const fetchWithdrawalHistory = async () => {
    try {
      // This would be implemented when withdrawal history API is available
      setWithdrawalHistory([])
    } catch (error) {
      console.error('Error fetching withdrawal history:', error)
    }
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    
    if (!amount) {
      toast.error('Please enter withdrawal amount')
      return
    }

    if (!selectedMethod) {
      toast.error('Please select a withdrawal method')
      return
    }

    const withdrawAmount = parseFloat(amount)
    const minWithdraw = mainSettings.minimumWithdraw || 1000

    if (withdrawAmount < minWithdraw) {
      toast.error(`Minimum withdrawal amount is ₹${minWithdraw}`)
      return
    }

    const currentBalance = userDetails?.balance || user?.balance || 0
    if (withdrawAmount > currentBalance) {
      toast.error('Insufficient balance')
      return
    }

    // Check withdrawal time
    const now = new Date()
    const currentTime = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0')
    const openTime = mainSettings.withdrawalOpenTime || '6:00 AM'
    const closeTime = mainSettings.withdrawalCloseTime || '9:10 AM'
    
    // Simple time check (would need proper time parsing for production)
    if (now.getDay() === 0) { // Sunday
      toast.error('Withdrawals are closed on Sundays')
      return
    }

    setLoading(true)
    
    try {
      const response = await axios.post(`${API_URL}/withdraw/request`, {
        amount: withdrawAmount,
        method: selectedMethod
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.data) {
        toast.success('Withdrawal request submitted successfully! Please wait for admin approval.')
        setAmount('')
        setSelectedMethod('')
        fetchWithdrawalHistory()
        fetchUserDetails() // Refresh user details to show updated balance if needed
      }
      
    } catch (error) {
      console.error('Withdrawal error:', error)
      toast.error(error.response?.data?.message || 'Failed to submit withdrawal request')
    } finally {
      setLoading(false)
    }
  }

  const predefinedAmounts = [500, 1000, 2000, 5000, 10000, 15000]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 shadow-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-white hover:text-gray-200 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">Withdraw</h1>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Current Balance */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Current Points:</p>
            <p className="text-3xl font-bold text-orange-500">{userDetails?.balance || user?.balance || 0}</p>
          </div>
        </div>

        {/* Withdrawal Form */}
        <form onSubmit={handleWithdraw} className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter points
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter points"
              min={mainSettings.minimumWithdraw || 1000}
              max={userDetails?.balance || user?.balance || 0}
            />
            <p className="text-xs text-yellow-600 mt-2">
              Minimum withdraw points is {mainSettings.minimumWithdraw || 1000}
            </p>
            <p className="text-xs text-yellow-600">
              Withdrawal time is {mainSettings.withdrawalOpenTime || '6:00 AM'} to {mainSettings.withdrawalCloseTime || '9:10 AM'}
            </p>
            <p className="text-xs text-yellow-600">
              *Withdrawals are closed on Sundays*
            </p>
          </div>

          {/* Predefined Amount Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {predefinedAmounts.map((predefinedAmount) => (
              <button
                key={predefinedAmount}
                type="button"
                onClick={() => setAmount(predefinedAmount.toString())}
                className={`py-3 px-4 rounded-lg font-semibold text-white transition-colors duration-200 ${
                  amount === predefinedAmount.toString()
                    ? 'bg-orange-600'
                    : 'bg-yellow-500 hover:bg-yellow-600'
                }`}
              >
                {predefinedAmount}
              </button>
            ))}
          </div>

          {/* Available Withdrawal Methods */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Withdrawal Method
            </label>
            {availableMethods.length > 0 ? (
              <div className="space-y-3">
                {availableMethods.map((method) => (
                  <label key={method.id} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="withdrawalMethod"
                      value={method.id}
                      checked={selectedMethod === method.id}
                      onChange={(e) => setSelectedMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${selectedMethod === method.id ? 'border-green-600' : 'border-gray-400'}`}>
                      {selectedMethod === method.id && (
                        <div className="w-full h-full bg-green-600 rounded-full scale-50"></div>
                      )}
                    </div>
                    <span className="text-lg mr-3">{method.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{method.name}</p>
                      <p className="text-sm text-gray-600">{method.details}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No withdrawal methods available</p>
                <p className="text-sm mb-4">Please add your payment details to enable withdrawals:</p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => navigate('/bank')}
                    className="block w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Add Bank Details
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/phonepe')}
                    className="block w-full px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                  >
                    Add PhonePe
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/googlepay')}
                    className="block w-full px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    Add Google Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/paytm')}
                    className="block w-full px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  >
                    Add Paytm
                  </button>
                </div>
              </div>
            )}
          </div>

          {availableMethods.length > 0 && (
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Withdraw'}
            </button>
          )}
        </form>

        {/* Withdrawal History Button */}
        <button
          onClick={() => navigate('/withdraw-history')}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 mb-6"
        >
          Withdraw History
        </button>
      </div>
    </div>
  )
}

export default WithdrawFund
