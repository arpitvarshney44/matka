import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const SubAdminList = () => {
  const { user, API_URL } = useAuth()
  const navigate = useNavigate()
  const [subAdmins, setSubAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState(null)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard')
      return
    }
    loadSubAdmins()
  }, [user, navigate])

  const loadSubAdmins = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/sub-admin-management`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      setSubAdmins(response.data.subAdmins)
    } catch (error) {
      console.error('Error loading sub admins:', error)
      toast.error('Failed to load sub admins')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (subAdminId) => {
    if (!window.confirm('Are you sure you want to delete this sub admin?')) {
      return
    }

    setDeleteLoading(subAdminId)
    try {
      await axios.delete(`${API_URL}/sub-admin-management/${subAdminId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      toast.success('Sub admin deleted successfully')
      loadSubAdmins()
    } catch (error) {
      console.error('Error deleting sub admin:', error)
      toast.error('Failed to delete sub admin')
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleAddAdmin = () => {
    navigate('/sub-admin-registration')
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-white hover:text-gray-200 transition-colors duration-200 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg md:text-xl font-semibold">Admin List</h1>
          </div>
          
          {/* Mobile Add Button */}
          <button
            onClick={handleAddAdmin}
            className="md:hidden bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-400 transition-colors duration-200"
            title="Add Admin"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6">
        {/* Desktop Add Admin Button */}
        <div className="mb-6 hidden md:block">
          <button
            onClick={handleAddAdmin}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Admin</span>
          </button>
        </div>

        {/* Sub Admins List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Desktop Header - Hidden on mobile */}
          <div className="bg-purple-600 text-white px-6 py-4 hidden md:block">
            <div className="grid grid-cols-5 gap-4 font-semibold">
              <div>#</div>
              <div>Name</div>
              <div>Email</div>
              <div>Username</div>
              <div>Action</div>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading sub admins...</p>
            </div>
          ) : subAdmins.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No sub admins found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {subAdmins.map((subAdmin, index) => (
                <div key={subAdmin._id} className="bg-white">
                  {/* Desktop Layout */}
                  <div className="hidden md:block px-6 py-4">
                    <div className="grid grid-cols-5 gap-4 items-center">
                      <div className="font-medium">{index + 1}</div>
                      <div>{subAdmin.adminName}</div>
                      <div>{subAdmin.email || 'N/A'}</div>
                      <div>{subAdmin.mobileNumber}</div>
                      <div>
                        <button
                          onClick={() => handleDelete(subAdmin._id)}
                          disabled={deleteLoading === subAdmin._id}
                          className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                        >
                          {deleteLoading === subAdmin._id ? 'Deleting...' : 'DELETE'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden p-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      {/* Admin Number Badge */}
                      <div className="flex justify-between items-start mb-3">
                        <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                      </div>

                      {/* Admin Details */}
                      <div className="space-y-2 mb-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Name:</span>
                          <p className="text-base font-semibold text-gray-900">{subAdmin.adminName}</p>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium text-gray-500">Email:</span>
                          <p className="text-base text-gray-900">{subAdmin.email || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium text-gray-500">Username:</span>
                          <p className="text-base text-gray-900">{subAdmin.mobileNumber}</p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-3 border-t border-gray-200">
                        <button
                          onClick={() => handleDelete(subAdmin._id)}
                          disabled={deleteLoading === subAdmin._id}
                          className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleteLoading === subAdmin._id ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Deleting...
                            </div>
                          ) : (
                            'DELETE ADMIN'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SubAdminList 