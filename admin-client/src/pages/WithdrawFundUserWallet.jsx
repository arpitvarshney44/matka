import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'

const WithdrawFundUserWallet = () => {
  const { user, API_URL } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [amount, setAmount] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [phoneSearch, setPhoneSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'subadmin') {
      navigate('/dashboard')
      return
    }
    fetchUsers()
  }, [user, navigate])

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/user-management/admin`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          limit: 100 // Get more users for dropdown
        }
      })
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    }
  }

  const handleSearchByName = async (query) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await axios.get(`${API_URL}/user-management/admin`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          search: query,
          limit: 10
        }
      })
      setSearchResults(response.data.users || [])
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Failed to search users')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchByPhone = async () => {
    if (!phoneSearch.trim()) {
      toast.error('Please enter a phone number')
      return
    }

    setIsSearching(true)
    try {
      const response = await axios.get(`${API_URL}/user-management/admin`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          search: phoneSearch,
          limit: 10
        }
      })
      
      const foundUsers = response.data.users || []
      if (foundUsers.length > 0) {
        setSearchResults(foundUsers)
        toast.success(`Found ${foundUsers.length} user(s)`)
      } else {
        toast.error('No user found with this phone number')
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error searching by phone:', error)
      toast.error('Failed to search user by phone')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedUser) {
      toast.error('Please select a user')
      return
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    // Find selected user to check balance
    const userToUpdate = users.find(u => u._id === selectedUser) || 
                        searchResults.find(u => u._id === selectedUser)
    
    if (userToUpdate && parseFloat(amount) > userToUpdate.balance) {
      toast.error('Insufficient balance in user wallet')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/admin/withdraw-fund-user-wallet`, {
        userId: selectedUser,
        amount: parseFloat(amount)
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.data.success) {
        toast.success(`₹${amount} withdrawn from user wallet successfully`)
        setSelectedUser('')
        setAmount('')
        setSearchQuery('')
        setPhoneSearch('')
        setSearchResults([])
        // Refresh users list to show updated balance
        fetchUsers()
      }
    } catch (error) {
      console.error('Error withdrawing fund:', error)
      toast.error(error.response?.data?.message || 'Failed to withdraw fund')
    } finally {
      setLoading(false)
    }
  }

  const selectUser = (userId, userName) => {
    setSelectedUser(userId)
    setSearchQuery(userName)
    setSearchResults([])
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 shadow-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-md text-white hover:bg-blue-700 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">Withdraw Fund (User Wallet)</h1>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Withdraw Funds From User Wallet</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Search User Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search User
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchByName(e.target.value)}
                  placeholder="Search by user name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {isSearching && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => selectUser(user._id, user.name)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.mobileNumber}</div>
                      <div className="text-sm text-gray-500">Balance: ₹{user.balance}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} - {user.mobileNumber} (₹{user.balance})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to withdraw"
                min="1"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {selectedUser && (
                <div className="mt-2 text-sm text-gray-600">
                  Available Balance: ₹{
                    (users.find(u => u._id === selectedUser) || 
                     searchResults.find(u => u._id === selectedUser))?.balance || 0
                  }
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Submit'
              )}
            </button>
          </form>
        </div>

        {/* Search by Phone Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Search User by Phone</h3>
          
          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                placeholder="Enter Phone Number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={handleSearchByPhone}
              disabled={isSearching}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Searching...
                </div>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WithdrawFundUserWallet