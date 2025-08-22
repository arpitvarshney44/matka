import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const EnquiryManagement = () => {
  const { user, API_URL } = useAuth()
  const navigate = useNavigate()
  const [enquiries, setEnquiries] = useState([])
  const [selectedEnquiry, setSelectedEnquiry] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Access denied. Admin only.')
      navigate('/dashboard')
      return
    }
    loadEnquiries()
  }, [user, navigate])

  useEffect(() => {
    scrollToBottom()
  }, [selectedEnquiry])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadEnquiries = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/enquiry/admin`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      setEnquiries(response.data)
    } catch (error) {
      console.error('Error loading enquiries:', error)
      toast.error('Failed to load enquiries')
    } finally {
      setLoading(false)
    }
  }

  const selectEnquiry = async (enquiry) => {
    try {
      const response = await axios.get(`${API_URL}/enquiry/admin/${enquiry._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      setSelectedEnquiry(response.data)
    } catch (error) {
      console.error('Error loading enquiry details:', error)
      toast.error('Failed to load enquiry details')
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    
    if (!message.trim() || !selectedEnquiry) {
      return
    }

    setSending(true)
    try {
      await axios.post(`${API_URL}/enquiry/admin/${selectedEnquiry._id}`, 
        { message: message.trim() },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      setMessage('')
      toast.success('Message sent successfully!')
      
      // Reload the selected enquiry
      await selectEnquiry(selectedEnquiry)
      // Reload all enquiries to update the list
      await loadEnquiries()
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }



  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getLastMessage = (enquiry) => {
    if (enquiry.messages && enquiry.messages.length > 0) {
      const lastMsg = enquiry.messages[enquiry.messages.length - 1]
      return lastMsg.message.length > 50 
        ? lastMsg.message.substring(0, 50) + '...' 
        : lastMsg.message
    }
    return 'No messages yet'
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
              <h1 className="text-2xl font-bold text-gray-900">User Queries</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Enquiries List */}
        <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Enquiries</h2>
            {enquiries.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-500">No enquiries yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {enquiries.map((enquiry) => (
                  <div
                    key={enquiry._id}
                    onClick={() => selectEnquiry(enquiry)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors duration-200 ${
                      selectedEnquiry?._id === enquiry._id
                        ? 'bg-purple-50 border border-purple-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{enquiry.userName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        enquiry.status === 'open' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {enquiry.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{enquiry.userMobile}</p>
                    <p className="text-sm text-gray-500 mb-2">{getLastMessage(enquiry)}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{formatDate(enquiry.lastMessageAt)}</span>
                      {!enquiry.isReadByAdmin && enquiry.status === 'open' && (
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedEnquiry ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedEnquiry.userName} ({selectedEnquiry.userMobile})
                    </h2>
                                         <p className="text-sm text-gray-600">
                       Status: 
                       <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                         selectedEnquiry.status === 'open' 
                           ? 'bg-green-100 text-green-800' 
                           : 'bg-red-100 text-red-800'
                       }`}>
                         {selectedEnquiry.status}
                       </span>
                     </p>
                   </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
                <div className="space-y-4">
                  {selectedEnquiry.messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.sender === 'admin'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender === 'admin' ? 'text-purple-100' : 'text-gray-500'
                        }`}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

                             {/* Message Input */}
               <div className="bg-white border-t border-gray-200 p-4">
                 <form onSubmit={sendMessage} className="flex space-x-4">
                   <input
                     type="text"
                     value={message}
                     onChange={(e) => setMessage(e.target.value)}
                     placeholder="Type your message..."
                     className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                     disabled={sending}
                   />
                   <button
                     type="submit"
                     disabled={sending || !message.trim()}
                     className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {sending ? 'Sending...' : 'Send'}
                   </button>
                 </form>
               </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an enquiry</h3>
                <p className="text-gray-600">Choose an enquiry from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EnquiryManagement 