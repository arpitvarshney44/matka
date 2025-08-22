import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'

const WithdrawHistory = () => {
  const { API_URL } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [withdrawals, setWithdrawals] = useState([])

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const fetchWithdrawals = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/withdraw/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      setWithdrawals(response.data.withdrawals || [])
    } catch (error) {
      console.error('Error fetching withdrawal history:', error)
      toast.error('Failed to load withdrawal history')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    )
  }

  const getMethodIcon = (method) => {
    const icons = {
      bank: '🏦',
      phonepe: '📱',
      googlepay: '💳',
      paytm: '💰'
    }
    return icons[method] || '💸'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading withdrawal history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 shadow-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/withdraw-fund')}
            className="text-white hover:text-gray-200 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">Withdraw History</h1>
          <button
            onClick={fetchWithdrawals}
            className="p-2 rounded-full text-white hover:bg-green-700 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {withdrawals.length > 0 ? (
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal._id} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getMethodIcon(withdrawal.method)}</span>
                    <span className="font-medium text-gray-900">
                      {withdrawal.method === 'bank' ? 'Bank Account' :
                       withdrawal.method === 'phonepe' ? 'PhonePe' :
                       withdrawal.method === 'googlepay' ? 'Google Pay' :
                       withdrawal.method === 'paytm' ? 'Paytm' : 'Unknown'}
                    </span>
                  </div>
                  {getStatusBadge(withdrawal.status)}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="font-semibold text-gray-900">₹{withdrawal.amount}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Date:</span>
                    <span className="text-sm text-gray-900">{formatDate(withdrawal.createdAt)}</span>
                  </div>
                  
                  {withdrawal.accountDetails && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Account:</span>
                      <span className="text-sm text-gray-900">{withdrawal.accountDetails}</span>
                    </div>
                  )}
                  
                  {withdrawal.transactionId && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Transaction ID:</span>
                      <span className="text-sm text-gray-900 font-mono">{withdrawal.transactionId}</span>
                    </div>
                  )}
                  
                  {withdrawal.remarks && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Remarks:</span>
                      <p className="text-sm text-gray-900 mt-1">{withdrawal.remarks}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">💸</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Withdrawals Yet</h3>
            <p className="text-gray-600 mb-6">You haven't made any withdrawal requests yet.</p>
            <button
              onClick={() => navigate('/withdraw-fund')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200"
            >
              Make First Withdrawal
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default WithdrawHistory
