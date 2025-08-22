import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'

const HowToPlayAdmin = () => {
  const { user, logout, API_URL } = useAuth()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/auth')
      return
    }
    loadHowToPlayContent()
  }, [user, navigate])

  const loadHowToPlayContent = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/how-to-play/admin`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      setContent(response.data.content)
      setLastUpdated(response.data.updatedAt)
    } catch (error) {
      console.error('Error loading content:', error)
      toast.error('Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Please enter some content')
      return
    }

    setSaving(true)
    try {
      const response = await axios.put(`${API_URL}/how-to-play`, 
        { content: content.trim() },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      toast.success('How to Play content saved successfully!')
      setLastUpdated(response.data.updatedAt)
    } catch (error) {
      console.error('Error saving content:', error)
      if (error.response?.status === 403) {
        toast.error('Access denied. Admin only.')
      } else {
        toast.error('Failed to save content')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-purple-800 shadow-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-md text-white hover:bg-purple-700 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">How to Play - Content Management</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Edit How to Play Content</h2>
              <p className="text-gray-600">
                This content will be displayed to users when they click "How to Play" in the client dashboard.
                You can use markdown formatting for better presentation.
              </p>
            </div>

            {/* Content Editor */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content (Markdown supported)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Enter the How to Play content here..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Content'}
              </button>
            </div>

            {/* Last Updated Info */}
            {lastUpdated && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Last Updated:</strong> {new Date(lastUpdated).toLocaleString()}
                </p>
              </div>
            )}

            {/* Help Section */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Markdown Formatting Help</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong># Heading 1</strong> - Main title</p>
                <p><strong>## Heading 2</strong> - Section title</p>
                <p><strong>**Bold text**</strong> - Important information</p>
                <p><strong>*Italic text*</strong> - Emphasis</p>
                <p><strong>- List item</strong> - Bullet points</p>
                <p><strong>1. Numbered item</strong> - Numbered lists</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HowToPlayAdmin 