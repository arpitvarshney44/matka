import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const AutoActive = () => {
  const { user, API_URL } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    mode: 'MANUAL',
    updatedAt: null,
    updatedBy: 'Admin'
  })

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Access denied. Admin only.')
      navigate('/dashboard')
      return
    }
    loadAutoActiveConfig()
  }, [user, navigate])

  const loadAutoActiveConfig = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/auto-active/admin`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      setConfig(response.data)
    } catch (error) {
      console.error('Error loading auto active config:', error)
      toast.error('Failed to load auto active configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleModeChange = async (mode) => {
    setSaving(true)
    try {
      const response = await axios.put(`${API_URL}/auto-active/admin`,
        { mode },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )
      setConfig(response.data)
      toast.success(`Auto active mode updated to ${mode}`)
    } catch (error) {
      console.error('Error updating auto active config:', error)
      toast.error('Failed to update auto active configuration')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Auto Active Configuration</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">User Approval Mode</h2>
            <p className="text-gray-600 mb-6">
              Choose how new user registrations should be handled. This setting affects whether new users are automatically approved or require manual approval.
            </p>
          </div>

          {/* Mode Selection */}
          <div className="space-y-6">
            {/* AUTO Mode */}
            <div className={`border-2 rounded-lg p-6 transition-all duration-200 ${
              config.mode === 'AUTO' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    config.mode === 'AUTO' 
                      ? 'border-purple-500 bg-purple-500' 
                      : 'border-gray-300'
                  }`}>
                    {config.mode === 'AUTO' && (
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">AUTO Mode</h3>
                    <p className="text-gray-600">
                      New users are automatically approved upon registration. No manual intervention required.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleModeChange('AUTO')}
                  disabled={saving || config.mode === 'AUTO'}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                    config.mode === 'AUTO'
                      ? 'bg-purple-600 text-white cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {saving && config.mode !== 'AUTO' ? 'Updating...' : 'Select'}
                </button>
              </div>
            </div>

            {/* MANUAL Mode */}
            <div className={`border-2 rounded-lg p-6 transition-all duration-200 ${
              config.mode === 'MANUAL' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    config.mode === 'MANUAL' 
                      ? 'border-purple-500 bg-purple-500' 
                      : 'border-gray-300'
                  }`}>
                    {config.mode === 'MANUAL' && (
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">MANUAL Mode</h3>
                    <p className="text-gray-600">
                      New users require manual approval by admin. Users will be inactive until approved.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleModeChange('MANUAL')}
                  disabled={saving || config.mode === 'MANUAL'}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                    config.mode === 'MANUAL'
                      ? 'bg-purple-600 text-white cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {saving && config.mode !== 'MANUAL' ? 'Updating...' : 'Select'}
                </button>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Current Mode</p>
                <p className="font-semibold text-gray-900">{config.mode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-semibold text-gray-900">{formatDate(config.updatedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Updated By</p>
                <p className="font-semibold text-gray-900">{config.updatedBy}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  config.mode === 'AUTO' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {config.mode === 'AUTO' ? 'Auto Approval' : 'Manual Approval'}
                </span>
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">How it works</h3>
            <div className="space-y-2 text-blue-800">
              <p>• <strong>AUTO Mode:</strong> When enabled, all new user registrations are automatically approved and can immediately access the platform.</p>
              <p>• <strong>MANUAL Mode:</strong> When enabled, new users are registered but remain inactive until manually approved by an admin through the User Management page.</p>
              <p>• Changes take effect immediately for new registrations.</p>
              <p>• Existing users are not affected by mode changes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AutoActive 