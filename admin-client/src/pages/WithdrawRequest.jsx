import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'

const WithdrawRequest = () => {
  const { user, API_URL } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [withdrawRequests, setWithdrawRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [showUserProfile, setShowUserProfile] = useState({})

  useEffect(() => {
  if (user?.role !== 'admin' && user?.role !== 'subadmin') {
      navigate('/dashboard')
      return
    }
    fetchWithdrawRequests()
  }, [user, navigate])

  const fetchWithdrawRequests = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/admin/withdraw-requests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.data.success) {
        setWithdrawRequests(response.data.requests)
      }
    } catch (error) {
      console.error('Error fetching withdraw requests:', error)
      toast.error('Failed to load withdraw requests')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const response = await axios.put(`${API_URL}/admin/withdraw-requests/${requestId}`, 
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (response.data.success) {
        toast.success(`Request ${newStatus} successfully!`)
        fetchWithdrawRequests() // Refresh the list
      }
    } catch (error) {
      console.error(`Error ${newStatus} request:`, error)
      toast.error(`Failed to ${newStatus} request`)
    }
  }

  const toggleUserProfile = (requestId) => {
    setShowUserProfile(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }))
  }

  const filteredRequests = withdrawRequests.filter(request => {
    const matchesSearch = 
      request.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user?.mobile?.includes(searchQuery) ||
      request._id?.toString().includes(searchQuery)
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getPaymentMethodDisplay = (method, user) => {
    switch (method) {
      case 'bank':
        return `Bank: ${user?.bankDetails?.bankName || 'N/A'}`
      case 'phonepe':
        return `PhonePe: ${user?.paymentDetails?.phonepe || 'N/A'}`
      case 'googlepay':
        return `Google Pay: ${user?.paymentDetails?.googlePay || 'N/A'}`
      case 'paytm':
        return `Paytm: ${user?.paymentDetails?.paytm || 'N/A'}`
      default:
        return method || 'N/A'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 shadow-lg px-6 py-4">
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
            <h1 className="text-2xl font-bold text-white">Withdraw Request Management</h1>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Title */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-600 text-center mb-4">Withdraw Requests</h2>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, mobile, or request ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Filter: Pending</option>
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">View Profile</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transfer To</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((request, index) => (
                      <React.Fragment key={request._id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {request.user?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {request.user?.mobile || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            ₹{request.amount?.toLocaleString() || '0'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => toggleUserProfile(request._id)}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              👁 View
                            </button>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(request.createdAt)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getPaymentMethodDisplay(request.method, request.user)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              request.status === 'approved' 
                                ? 'bg-green-100 text-green-800'
                                : request.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {request.status === 'pending' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleStatusUpdate(request._id, 'approved')}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(request._id, 'rejected')}
                                  className="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-700 transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            {request.status !== 'pending' && (
                              <span className="text-gray-500 text-xs">No action needed</span>
                            )}
                          </td>
                        </tr>
                        
                        {/* User Profile Details Row */}
                        {showUserProfile[request._id] && (
                          <tr className="bg-gray-50">
                            <td colSpan="9" className="px-4 py-4">
                              <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-3">User Profile Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h5 className="font-medium text-gray-700 mb-2">Personal Information</h5>
                                    <p className="text-sm text-gray-600">Name: {request.user?.name || 'N/A'}</p>
                                    <p className="text-sm text-gray-600">Mobile: {request.user?.mobile || 'N/A'}</p>
                                    <p className="text-sm text-gray-600">Email: {request.user?.email || 'N/A'}</p>
                                    <p className="text-sm text-gray-600">Balance: ₹{request.user?.balance?.toLocaleString() || '0'}</p>
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-gray-700 mb-2">Payment Details</h5>
                                    {request.method === 'bank' && request.user?.bankDetails && (
                                      <div className="text-sm text-gray-600 space-y-1">
                                        <p>Bank: {request.user.bankDetails.bankName}</p>
                                        <p>Account: {request.user.bankDetails.accountNumber}</p>
                                        <p>Holder: {request.user.bankDetails.accountHolderName}</p>
                                        <p>IFSC: {request.user.bankDetails.ifscCode}</p>
                                      </div>
                                    )}
                                    {request.method === 'phonepe' && (
                                      <p className="text-sm text-gray-600">PhonePe: {request.user?.paymentDetails?.phonepe || 'N/A'}</p>
                                    )}
                                    {request.method === 'googlepay' && (
                                      <p className="text-sm text-gray-600">Google Pay: {request.user?.paymentDetails?.googlePay || 'N/A'}</p>
                                    )}
                                    {request.method === 'paytm' && (
                                      <p className="text-sm text-gray-600">Paytm: {request.user?.paymentDetails?.paytm || 'N/A'}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                        {searchQuery || statusFilter !== 'all' ? 'No requests found matching your criteria' : 'No withdraw requests available'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WithdrawRequest
