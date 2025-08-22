import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { Layout, Card, Button, LoadingSpinner } from '../components'

const HowToPlay = () => {
  const navigate = useNavigate()
  const { API_URL } = useAuth()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadHowToPlayContent()
  }, [])

  const loadHowToPlayContent = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${API_URL}/how-to-play`)
      setContent(response.data.content)
    } catch (error) {
      console.error('Failed to load content:', error)
      setError('Failed to load How to Play content. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const renderMarkdown = (text) => {
    if (!text) return ''

    return text
      .split('\n')
      .map((line, index) => {
        // Headings
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-3xl font-bold text-gray-800 mb-4">{line.substring(2)}</h1>
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-bold text-gray-700 mb-3 mt-6">{line.substring(3)}</h2>
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-semibold text-gray-600 mb-2 mt-4">{line.substring(4)}</h3>
        }

        // Bold text
        if (line.includes('**')) {
          const parts = line.split('**')
          return (
            <p key={index} className="mb-2">
              {parts.map((part, i) => 
                i % 2 === 1 ? <strong key={i} className="font-bold">{part}</strong> : part
              )}
            </p>
          )
        }

        // Italic text
        if (line.includes('*') && !line.includes('**')) {
          const parts = line.split('*')
          return (
            <p key={index} className="mb-2">
              {parts.map((part, i) => 
                i % 2 === 1 ? <em key={i} className="italic">{part}</em> : part
              )}
            </p>
          )
        }

        // Lists
        if (line.startsWith('- ')) {
          return <li key={index} className="ml-6 mb-1">{line.substring(2)}</li>
        }
        if (line.match(/^\d+\. /)) {
          return <li key={index} className="ml-6 mb-1">{line.replace(/^\d+\. /, '')}</li>
        }

        // Empty lines
        if (line.trim() === '') {
          return <br key={index} />
        }

        // Regular text
        return <p key={index} className="mb-2">{line}</p>
      })
  }

  if (loading) {
    return (
      <Layout title="How to Play">
        <LoadingSpinner size="lg" message="Loading How to Play guide..." />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="How to Play">
        <div className="flex items-center justify-center min-h-64">
          <Card className="max-w-md w-full mx-4">
            <div className="text-center">
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
                <p>{error}</p>
              </div>
              <Button onClick={loadHowToPlayContent} className="w-full">
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="How to Play">
      <div className="p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <Card padding="p-6 lg:p-8">
            <div className="prose prose-lg max-w-none">
              {renderMarkdown(content)}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

export default HowToPlay 