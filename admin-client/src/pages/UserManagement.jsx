import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const UserManagement = () => {
  const { user, API_URL } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [unapprovedUsers, setUnapprovedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUnapproved, setShowUnapproved] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [approving, setApproving] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [searchTimeout, setSearchTimeout] = useState(null)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Access denied. Admin only.')
      navigate('/dashboard')
      return
    }
    loadUsers()
  }, [user, navigate, currentPage, showUnapproved])

  // Debounced search effect
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    // Don't search if searchTerm is empty and we're on the first page
    if (!searchTerm && currentPage === 1) {
      setIsSearching(false)
      return
    }
    
    if (searchTerm) {
      setIsSearching(true)
    }
    
    const timeout = setTimeout(() => {
      setCurrentPage(1) // Reset to first page when searching
      loadUsers()
    }, 800) // 800ms delay for better typing experience
    
    setSearchTimeout(timeout)
    
    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [searchTerm])

  // Keep search input focused
  const searchInputRef = useRef(null)

  const loadUsers = async () => {
    // Only show loading spinner for initial load, not for search updates
    if (!searchTerm) {
      setLoading(true)
    }
    
    try {
      const endpoint = showUnapproved ? '/unapproved' : ''
      const response = await axios.get(`${API_URL}/user-management/admin${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          search: searchTerm || undefined,
          page: currentPage,
          limit: 10
        }
      })
      
      if (showUnapproved) {
        setUnapprovedUsers(response.data.users)
        setTotalUsers(response.data.total)
        setTotalPages(response.data.totalPages)
      } else {
        setUsers(response.data.users)
        setTotalUsers(response.data.total)
        setTotalPages(response.data.totalPages)
      }
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  // Handle manual search (Enter key or search button)
  const handleManualSearch = () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    setCurrentPage(1)
    loadUsers()
  }

  const handleApprove = async (userId) => {
    setApproving(userId)
    try {
      await axios.put(`${API_URL}/user-management/admin/approve/${userId}`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      toast.success('User approved successfully!')
      loadUsers() // Reload the list
    } catch (error) {
      console.error('Error approving user:', error)
      toast.error('Failed to approve user')
    } finally {
      setApproving(null)
    }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }
    
    setDeleting(userId)
    try {
      await axios.delete(`${API_URL}/user-management/admin/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      toast.success('User deleted successfully!')
      loadUsers() // Reload the list
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    } finally {
      setDeleting(null)
    }
  }

  const handleWhatsAppClick = (user) => {
    const message = `Hello ${user.name}! Welcome to Raj Kalyan Matka. Your account has been registered successfully.`
    const whatsappUrl = `https://wa.me/${user.mobileNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleActiveToggle = async (userId, currentStatus) => {
    try {
      await axios.put(`${API_URL}/user-management/admin/approve/${userId}`, 
        { action: currentStatus ? 'deactivate' : 'approve' },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully!`)
      loadUsers() // Reload the list
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast.error('Failed to update user status')
    }
  }

  const handleViewUser = (user) => {
    navigate(`/user-profile/${user._id}`)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    }).replace(/\//g, '-')
  }

  const currentUsers = showUnapproved ? unapprovedUsers : users

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
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 {/* Search and Filter Section */}
         <div className="bg-white rounded-lg shadow-md p-6 mb-6">
           {/* Search Results Info */}
           {searchTerm && (
             <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-2">
                   <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                   <span className="text-sm font-medium text-blue-800">
                     Search results for: <span className="font-bold">"{searchTerm}"</span>
                   </span>
                 </div>
                 <div className="flex items-center space-x-2">
                   {isSearching && (
                     <div className="flex items-center space-x-1">
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                       <span className="text-xs text-blue-600">Searching...</span>
                     </div>
                   )}
                   <span className="text-sm text-blue-600">
                     {totalUsers} {totalUsers === 1 ? 'result' : 'results'} found
                   </span>
                 </div>
               </div>
             </div>
           )}
           
           <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                         <div className="flex-1 max-w-md">
               <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                 Search by Name or Phone
               </label>
               <div className="flex space-x-2">
                 <div className="relative flex-1">
                 <input
                   ref={searchInputRef}
                   type="text"
                   id="search"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   onKeyPress={(e) => {
                     if (e.key === 'Enter') {
                       e.preventDefault()
                       handleManualSearch()
                     }
                   }}
                   placeholder="Enter name or phone number..."
                   className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                   autoFocus
                 />
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                 </div>
                 {searchTerm && (
                   <button
                     onClick={() => {
                       setSearchTerm('')
                       setCurrentPage(1)
                       loadUsers()
                       // Keep focus on input after clearing
                       setTimeout(() => searchInputRef.current?.focus(), 0)
                     }}
                     className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                     title="Clear search"
                   >
                     <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                   </button>
                 )}
                 {!searchTerm && (
                   <button
                     onClick={() => {
                       handleManualSearch()
                       // Keep focus on input after refresh
                       setTimeout(() => searchInputRef.current?.focus(), 0)
                     }}
                     className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-purple-600 transition-colors duration-200"
                     title="Refresh results"
                   >
                     <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                     </svg>
                   </button>
                 )}
               </div>
               <button
                 onClick={() => {
                   handleManualSearch()
                   // Keep focus on input after search
                   setTimeout(() => searchInputRef.current?.focus(), 0)
                 }}
                 className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-1"
                 title="Search"
               >
                 <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                 </svg>
                 <span>Search</span>
               </button>
             </div>
           </div>
            <div className="flex space-x-3">
                             <button
                 onClick={() => setShowUnapproved(!showUnapproved)}
                 className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                   showUnapproved
                     ? 'bg-red-600 text-white hover:bg-red-700'
                     : 'bg-blue-600 text-white hover:bg-blue-700'
                 }`}
               >
                 {showUnapproved ? 'Show Approved Users' : 'Show Un-approved Users'}
               </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WhatsApp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mobile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    View
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentUsers.map((user, index) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(currentPage - 1) * 10 + index + 1}
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                       <button
                         onClick={() => handleWhatsAppClick(user)}
                         className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors duration-200 cursor-pointer"
                         title="Send WhatsApp message"
                       >
                         <span className="text-white text-xs">✓</span>
                       </button>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-blue-600 font-medium cursor-pointer hover:underline">
                        {user.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.mobileNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.balance || '0'}
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                       <button
                         onClick={() => handleActiveToggle(user._id, user.isActive)}
                         className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200 cursor-pointer hover:opacity-80 ${
                           user.isActive 
                             ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                             : 'bg-red-100 text-red-800 hover:bg-red-200'
                         }`}
                         title={user.isActive ? 'Click to deactivate' : 'Click to activate'}
                       >
                         {user.isActive ? 'Yes' : 'No'}
                       </button>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        onClick={() => handleViewUser(user)}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
                        title="View user profile"
                      >
                        👁️
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {!user.isActive && (
                          <button
                            onClick={() => handleApprove(user._id)}
                            disabled={approving === user._id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {approving === user._id ? 'Approving...' : 'Approve'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(user._id)}
                          disabled={deleting === user._id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {deleting === user._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {currentUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
                             <h3 className="text-lg font-medium text-gray-900 mb-2">
                 {showUnapproved ? 'No unapproved users' : 'No approved users found'}
               </h3>
               <p className="text-gray-500">
                 {showUnapproved 
                   ? 'All users are approved or no users exist.' 
                   : 'No approved users found. Try adjusting your search criteria.'
                 }
               </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow-md">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * 10, totalUsers)}
                  </span>{' '}
                  of <span className="font-medium">{totalUsers}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserManagement 