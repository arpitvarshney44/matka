import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'

const AddGame = () => {
  const { API_URL } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    gameName: '',
    gameNameHindi: '',
    openTime: '',
    closeTime: '',
    gameRates: {
      single: 9.5,
      jodi: 95,
      panna: 1500,
      halfSangam: 10000,
      fullSangam: 100000
    },
    description: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validate form data
    if (!formData.gameName || !formData.openTime || !formData.closeTime) {
      toast.error('Please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      await axios.post(`${API_URL}/admin/games`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      toast.success('Game added successfully!')
      navigate('/game-names')
    } catch (error) {
      console.error('Error adding game:', error)
      const errorMessage = error.response?.data?.message || 'Failed to add game'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/game-names')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center">
        <button
          onClick={handleBack}
          className="mr-4 p-2 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Add Game</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">Add New Game</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Game Name */}
            <div>
              <label htmlFor="gameName" className="block text-sm font-medium text-gray-700 mb-1">
                Game Name
              </label>
              <input
                type="text"
                id="gameName"
                name="gameName"
                value={formData.gameName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Game Name (Hindi) */}
            <div>
              <label htmlFor="gameNameHindi" className="block text-sm font-medium text-gray-700 mb-1">
                Game Name (Hindi)
              </label>
              <input
                type="text"
                id="gameNameHindi"
                name="gameNameHindi"
                value={formData.gameNameHindi}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Open Time */}
            <div>
              <label htmlFor="openTime" className="block text-sm font-medium text-gray-700 mb-1">
                Open Time
              </label>
              <input
                type="time"
                id="openTime"
                name="openTime"
                value={formData.openTime}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Close Time */}
            <div>
              <label htmlFor="closeTime" className="block text-sm font-medium text-gray-700 mb-1">
                Close Time
              </label>
              <input
                type="time"
                id="closeTime"
                name="closeTime"
                value={formData.closeTime}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>


            {/* Submit Button */}
            <div className="text-center pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding Game...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddGame
