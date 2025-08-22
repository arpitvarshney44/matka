import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const Enquiry = () => {
  const navigate = useNavigate()
  const { user, API_URL } = useAuth()
  const [enquiries, setEnquiries] = useState([])
  const [currentEnquiry, setCurrentEnquiry] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [hasCheckedEnquiries, setHasCheckedEnquiries] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }
    loadEnquiries()
  }, [user, navigate])

  useEffect(() => {
    scrollToBottom()
  }, [currentEnquiry])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadEnquiries = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/enquiry/user`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      // Check if there are any enquiries
      if (response.data && response.data.length > 0) {
        setEnquiries(response.data)
        setCurrentEnquiry(response.data[0])
      } else {
        // No enquiries found - set empty state
        setEnquiries([])
        setCurrentEnquiry(null)
      }
      setHasCheckedEnquiries(true)
    } catch (error) {
      console.error('Error loading enquiries:', error)
      // If it's a 404 or no data, set empty state instead of showing error
      if (error.response?.status === 404 || error.response?.data?.length === 0) {
        setEnquiries([])
        setCurrentEnquiry(null)
      } else {
        toast.error('Failed to load enquiries')
      }
      setHasCheckedEnquiries(true)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    
    if (!message.trim()) {
      return
    }

    setSending(true)
    try {
      const response = await axios.post(`${API_URL}/enquiry/user`, 
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
      
      // If this was the first enquiry, update the current enquiry directly
      if (!currentEnquiry || enquiries.length === 0) {
        setCurrentEnquiry(response.data.enquiry)
        setEnquiries([response.data.enquiry])
      } else {
        // Reload enquiries to get updated data
        await loadEnquiries()
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-matka-grey-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-matka-green-500 mx-auto mb-4"></div>
          <p className="text-white">Loading enquiries...</p>
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
          <h1 className="text-xl font-bold text-white">Enquiry & Support</h1>
          <div className="w-6"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {currentEnquiry ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Support Chat</h2>
                    <p className="text-sm text-gray-600">
                      Status: 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        currentEnquiry.status === 'open' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {currentEnquiry.status === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(currentEnquiry.createdAt)}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
                <div className="space-y-4">
                  {currentEnquiry.messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.sender === 'user'
                            ? 'bg-matka-green-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender === 'user' ? 'text-matka-green-100' : 'text-gray-500'
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
              {currentEnquiry.status === 'open' && (
                <div className="bg-white border-t border-gray-200 p-4">
                  <form onSubmit={sendMessage} className="flex space-x-4">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-matka-green-500 focus:border-transparent"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !message.trim()}
                      className="px-6 py-2 bg-matka-green-600 text-white rounded-lg hover:bg-matka-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                </div>
              )}

              {currentEnquiry.status === 'closed' && (
                <div className="bg-yellow-50 border-t border-yellow-200 p-4">
                  <p className="text-center text-yellow-800">
                    This enquiry has been closed. Please start a new enquiry if you need further assistance.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No enquiries yet</h3>
                <p className="text-gray-600 mb-4">Start a conversation with our support team</p>
                <button
                  onClick={() => setCurrentEnquiry({ messages: [], status: 'open' })}
                  className="px-4 py-2 bg-matka-green-600 text-white rounded-lg hover:bg-matka-green-700 transition-colors duration-200"
                >
                  Start New Enquiry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Enquiry 