import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Layout, Card, Button, Input, LoadingSpinner, FloatingActionButton } from '../components'

const Wallet = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [walletBalance, setWalletBalance] = useState(3800)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  })

  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }
    loadWalletData()
  }, [user, navigate])

  const loadWalletData = async () => {
    setLoading(true)
    try {
      // Fetch user profile to get current balance
      const response = await axios.get('/user/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const userBalance = response.data.user.balance || 0
      setWalletBalance(userBalance)
    } catch (error) {
      console.error('Error loading wallet data:', error)
      toast.error('Failed to load wallet data')
      // Fallback to user balance from context
      setWalletBalance(user?.balance || 0)
    } finally {
      setLoading(false)
    }
  }

  const handleEditProfile = async (e) => {
    e.preventDefault()
    
    if (!editForm.name.trim()) {
      toast.error('Name is required')
      return
    }

    try {
      // Update profile API call
      const response = await axios.put('/user/profile', {
        name: editForm.name.trim(),
        email: editForm.email.trim()
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      toast.success('Profile updated successfully!')
      setIsEditing(false)
      
      // Update local user data
      // In a real app, you would update the auth context
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }

  const handleDeposit = () => {
    navigate('/add-fund')
  }

  const handleWithdraw = () => {
    navigate('/withdraw-fund')
  }

  const handleTransactions = () => {
    navigate('/withdraw-history')
  }

  const handleWalletStatement = () => {
    navigate('/wallet-statement')
  }

  const handleRefresh = () => {
    loadWalletData()
    toast.success('Wallet data refreshed!')
  }

  if (loading) {
    return (
      <Layout title="Wallet" showBackButton={false}>
        <LoadingSpinner size="lg" message="Loading wallet..." />
      </Layout>
    )
  }

  return (
    <Layout title="Wallet" showBackButton={true} backPath="/dashboard">
      <div className="p-4 lg:p-6">
        {/* Profile Section */}
        <Card className="mb-6">
          <div className="text-center">
            {/* Profile Picture */}
            <div className="w-20 h-20 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
              <img 
                src="/logo.jpg" 
                alt="Raj Kalyan Matka Logo" 
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
            
            {/* User Info */}
            <h2 className="text-xl font-bold text-gray-900 mb-1">{user?.name || 'Arpit'}</h2>
            <p className="text-gray-600 mb-4">{user?.email || 'Email'}</p>
            
            {/* Edit Profile Button */}
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
            >
              Edit Profile
            </Button>
          </div>

          {/* Edit Profile Form */}
          {isEditing && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <form onSubmit={handleEditProfile}>
                <div className="space-y-4">
                  <Input
                    label="Name"
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    placeholder="Enter your name"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    placeholder="Enter your email"
                  />
                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-1"
                    >
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsEditing(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </Card>

        {/* Wallet Balance */}
        <div className="bg-yellow-500 rounded-lg shadow-md p-6 mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-white text-lg font-semibold mb-2">Wallet Balance</h3>
            <p className="text-white text-3xl font-bold">₹ {walletBalance.toLocaleString()}</p>
          </div>
          {/* Logo in corner */}
          <div className="absolute bottom-2 right-2">
            <img 
              src="/logo.jpg" 
              alt="Raj Kalyan Matka Logo" 
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={handleDeposit}
            size="lg"
            className="w-full shadow-md"
          >
            <span className="text-xl mr-2">💰</span>
            Add Funds
          </Button>
          <Button
            onClick={handleWithdraw}
            variant="secondary"
            size="lg"
            className="w-full shadow-md bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
          >
            <span className="text-xl mr-2">💸</span>
            Withdraw Funds
          </Button>
          <Button
            onClick={handleTransactions}
            variant="secondary"
            size="lg"
            className="w-full shadow-md bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
          >
            <span className="text-xl mr-2">📊</span>
            Withdrawal History
          </Button>
          <Button
            onClick={handleWalletStatement}
            variant="secondary"
            size="lg"
            className="w-full shadow-md bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
          >
            <span className="text-xl mr-2">📋</span>
            Wallet Statement
          </Button>
        </div>

        {/* Floating Refresh Button */}
        <FloatingActionButton
          onClick={handleRefresh}
          tooltip="Refresh wallet data"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        />
      </div>
    </Layout>
  )
}

export default Wallet