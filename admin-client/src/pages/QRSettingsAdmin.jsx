import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'

const QRSettingsAdmin = () => {
  const { user, API_URL } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [qrCode, setQrCode] = useState({
    title: '',
    description: '',
    imagePath: '',
    isActive: false
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'subadmin') {
      navigate('/auth')
      return
    }
    loadQRCode()
  }, [user, navigate])

  const loadQRCode = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/qr-settings/admin`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      setQrCode(response.data)
      if (response.data.imagePath) {
        setPreviewUrl(`${API_URL.replace('/api', '')}/uploads/${response.data.imagePath}`)
      }
    } catch (error) {
      console.error('Error loading QR code:', error)
      toast.error('Failed to load QR code')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedFile && !qrCode.imagePath) {
      toast.error('Please select a QR code image')
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append('title', qrCode.title)
    formDataToSend.append('description', qrCode.description)
    
    if (selectedFile) {
      formDataToSend.append('image', selectedFile)
    }

    try {
      await axios.post(`${API_URL}/qr-settings/admin`, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      toast.success('QR code saved successfully')
      setSelectedFile(null)
      loadQRCode()
    } catch (error) {
      console.error('Error saving QR code:', error)
      toast.error('Failed to save QR code')
    }
  }

  const handleToggleStatus = async () => {
    try {
      await axios.patch(`${API_URL}/qr-settings/admin/toggle`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      toast.success('QR code status updated')
      loadQRCode()
    } catch (error) {
      console.error('Error toggling QR code status:', error)
      toast.error('Failed to update QR code status')
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this QR code?')) {
      try {
        await axios.delete(`${API_URL}/qr-settings/admin`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        toast.success('QR code deleted successfully')
        setQrCode({
          title: '',
          description: '',
          imagePath: '',
          isActive: false
        })
        setPreviewUrl('')
        setSelectedFile(null)
        const fileInput = document.getElementById('qr-image')
        if (fileInput) fileInput.value = ''
      } catch (error) {
        console.error('Error deleting QR code:', error)
        toast.error('Failed to delete QR code')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading QR code...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="mr-4 text-white hover:text-gray-200 transition-colors duration-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center">
              <svg className="w-8 h-8 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
              </svg>
              <h1 className="text-2xl font-bold text-white">QR Code Settings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">QR Code Management</h2>
          <p className="text-gray-600 text-lg">Upload and manage your QR code</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Form */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <div className="bg-purple-100 p-3 rounded-lg mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">QR Code Details</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  QR Code Image
                </label>
                <input
                  id="qr-image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                />
              </div>

              {previewUrl && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preview
                  </label>
                  <div className="w-48 h-48 border-2 border-gray-300 rounded-lg overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="QR Code Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={qrCode.title}
                  onChange={(e) => setQrCode({ ...qrCode, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Enter QR code title"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={qrCode.description}
                  onChange={(e) => setQrCode({ ...qrCode, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Enter description"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {qrCode.imagePath ? 'Update QR Code' : 'Upload QR Code'}
              </button>
            </form>
          </div>

          {/* QR Code Status */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">QR Code Status</h3>
            </div>

            {qrCode.imagePath ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border-2 ${
                  qrCode.isActive 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {qrCode.title || 'QR Code'}
                    </h4>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      qrCode.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {qrCode.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {qrCode.description && (
                    <p className="text-sm text-gray-600 mb-3">{qrCode.description}</p>
                  )}
                  
                  <div className="w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden">
                    <img
                      src={`${API_URL.replace('/api', '')}/uploads/${qrCode.imagePath}`}
                      alt={qrCode.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleToggleStatus}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                      qrCode.isActive
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {qrCode.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2 px-4 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-semibold transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                </svg>
                <p className="text-gray-500">No QR code uploaded yet</p>
                <p className="text-sm text-gray-400 mt-1">Upload a QR code image to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRSettingsAdmin 