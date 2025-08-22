import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'

const ContactSettingsAdmin = () => {
  const { user, API_URL } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    mobileNumber: '',
    email: '',
    whatsappNumber: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Access denied. Admin only.')
      navigate('/dashboard')
      return
    }
    loadContactSettings()
  }, [user, navigate])

  const loadContactSettings = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/contact-settings/admin`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      setFormData({
        mobileNumber: response.data.mobileNumber,
        email: response.data.email,
        whatsappNumber: response.data.whatsappNumber
      })
      setLastUpdated(response.data.updatedAt)
    } catch (error) {
      console.error('Error loading contact settings:', error)
      toast.error('Failed to load contact settings')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form data
    if (!formData.mobileNumber.trim() || !formData.email.trim() || !formData.whatsappNumber.trim()) {
      toast.error('All fields are required')
      return
    }

    setSaving(true)
    try {
      const response = await axios.put(`${API_URL}/contact-settings`, 
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )
      toast.success('Contact settings saved successfully!')
      setLastUpdated(response.data.updatedAt)
    } catch (error) {
      console.error('Error saving contact settings:', error)
      if (error.response?.status === 403) {
        toast.error('Access denied. Admin only.')
      } else {
        toast.error('Failed to save contact settings')
      }
    } finally {
      setSaving(false)
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Contact Settings</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Update Contact Information</h2>
              <p className="text-sm text-gray-600">
                Update the contact information that will be displayed to users in the dashboard sidebar.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number eg. 1234567890
                </label>
                <input
                  type="tel"
                  id="mobileNumber"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Enter mobile number"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Whatsapp Number
                </label>
                <input
                  type="tel"
                  id="whatsappNumber"
                  name="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Enter WhatsApp number"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {saving ? 'Saving...' : 'Submit'}
                </button>
              </div>
            </form>

            {/* Last Updated Info */}
            {lastUpdated && (
              <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Last Updated:</strong> {new Date(lastUpdated).toLocaleString()}
                </p>
              </div>
            )}

            {/* Help Section */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Help</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Mobile Number: Enter the contact mobile number (e.g., 766500780)</li>
                <li>• Email: Enter the contact email address</li>
                <li>• WhatsApp Number: Enter the WhatsApp number with country code (e.g., 91766500780)</li>
                <li>• All fields are required and will be displayed to users in the dashboard sidebar</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactSettingsAdmin 