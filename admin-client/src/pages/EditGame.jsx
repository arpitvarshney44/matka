import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'

const daysOfWeek = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
]

const EditGame = () => {
  const { API_URL } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [formData, setFormData] = useState({
    gameName: '',
    gameNameHindi: '',
    schedule: daysOfWeek.map(day => ({ day, openTime: '', closeTime: '', isActive: true }))
  })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchGameData()
  }, [id])

  const fetchGameData = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/games/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const game = response.data
      setFormData({
        gameName: game.gameName,
        gameNameHindi: game.gameNameHindi || '',
        schedule: game.schedule && game.schedule.length === 7
          ? game.schedule
          : daysOfWeek.map(day => ({ day, openTime: '', closeTime: '', isActive: true }))
      })
    } catch (error) {
      console.error('Error fetching game data:', error)
      toast.error('Failed to fetch game data')
      navigate('/game-names')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleScheduleChange = (idx, field, value) => {
    setFormData(prev => {
      const updatedSchedule = [...prev.schedule]
      updatedSchedule[idx] = { ...updatedSchedule[idx], [field]: value }
      return { ...prev, schedule: updatedSchedule }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUpdating(true)

    if (!formData.gameName) {
      toast.error('Game name is required')
      setUpdating(false)
      return
    }
    // Validate all days
    for (let i = 0; i < formData.schedule.length; i++) {
      const dayObj = formData.schedule[i]
      if (!dayObj.openTime || !dayObj.closeTime) {
        toast.error(`Please fill open and close time for ${dayObj.day}`)
        setUpdating(false)
        return
      }
    }

    try {
      await axios.put(`${API_URL}/games/${id}`,
        {
          gameName: formData.gameName,
          gameNameHindi: formData.gameNameHindi,
          schedule: formData.schedule
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      toast.success('Game updated successfully!')
      navigate('/game-names')
    } catch (error) {
      console.error('Error updating game:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update game'
      toast.error(errorMessage)
    } finally {
      setUpdating(false)
    }
  }

  const handleBack = () => {
    navigate('/game-names')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading game data...</p>
        </div>
      </div>
    )
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
        <h1 className="text-xl font-bold">Edit Game</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">Update Game Schedule</h2>
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
            {/* Per-day schedule */}
            <div className="space-y-6">
              {formData.schedule.map((dayObj, idx) => (
                <div key={dayObj.day} className="bg-gray-50 rounded-lg p-4 shadow">
                  <div className="font-bold text-lg mb-2">{dayObj.day}</div>
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Open Time</label>
                      <input
                        type="time"
                        value={dayObj.openTime}
                        onChange={e => handleScheduleChange(idx, 'openTime', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Close Time</label>
                      <input
                        type="time"
                        value={dayObj.closeTime}
                        onChange={e => handleScheduleChange(idx, 'closeTime', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dayObj.isActive}
                          onChange={e => handleScheduleChange(idx, 'isActive', e.target.checked)}
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span className="ml-2 text-gray-700">{dayObj.isActive ? 'Active' : 'Inactive'}</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Submit Button */}
            <div className="text-center pt-4">
              <button
                type="submit"
                disabled={updating}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating Game...' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditGame
