import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const ContactUs = () => {
  const navigate = useNavigate()
  const { API_URL } = useAuth()
  const [contactInfo, setContactInfo] = useState({
    mobileNumber: '',
    email: '',
    whatsappNumber: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadContactInfo()
  }, [])

  const loadContactInfo = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${API_URL}/contact-settings`)
      setContactInfo(response.data)
    } catch (error) {
      console.error('Failed to load contact information:', error)
      setError('Failed to load contact information. Please try again later.')
    } finally {
      setLoading(false)
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-matka-grey-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-matka-green-500 mx-auto mb-4"></div>
          <p className="text-white">Loading contact information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-matka-grey-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={loadContactInfo}
            className="px-4 py-2 bg-matka-green-600 text-white rounded-md hover:bg-matka-green-700 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-matka-grey-900">
      {/* Header */}
      <div className="bg-matka-green-800 shadow-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-white hover:text-gray-200 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">Contact Us</h1>
          <div className="w-6"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-matka-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-matka-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Get in Touch</h2>
              <p className="text-gray-600">We're here to help! Contact us through any of the following channels.</p>
            </div>

            {/* Contact Options */}
            <div className="space-y-4">
              {/* Mobile Number */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Mobile Number</h3>
                  <p className="text-gray-600 text-lg">{contactInfo.mobileNumber}</p>
                </div>
              </div>

              {/* Email */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                  <p className="text-gray-600 text-lg">{contactInfo.email}</p>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">WhatsApp</h3>
                  <p className="text-gray-600 text-lg">{contactInfo.whatsappNumber}</p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-8 p-4 bg-matka-green-50 rounded-lg">
              <h3 className="font-semibold text-matka-green-800 mb-2">Need Help?</h3>
              <p className="text-matka-green-700 text-sm">
                Our support team is available 24/7 to assist you with any questions or concerns. 
                Feel free to reach out through any of the contact methods above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactUs 