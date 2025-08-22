import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const AuthPage = () => {
  const [formData, setFormData] = useState({
    mobileNumber: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { user, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await login(formData.mobileNumber, formData.password)
      if (result.success) {
        toast.success('Login successful!')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="min-h-screen bg-matka-grey-900 flex flex-col">
      {/* Header */}
      <div className="bg-matka-green-800 shadow-lg px-6 py-4">
        <div className="flex items-center justify-center">
          <h1 className="text-2xl font-bold text-white">RAJ KALYAN MATKA - ADMIN</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          {/* Logo and Welcome Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/logo.jpg" 
                alt="Raj Kalyan Matka Logo" 
                className="w-32 h-32 object-cover rounded-full shadow-xl"
              />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Admin Panel Login
            </h2>
            <p className="text-gray-300 text-lg">
              Sign in to admin panel
            </p>
          </div>

          {/* Login/Register Form */}
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">

              <div>
                <label htmlFor="mobileNumber" className="block text-sm font-semibold text-gray-200 mb-2">
                  Mobile Number
                </label>
                <input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  required
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-matka-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter mobile number"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-matka-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>



              <button
                type="submit"
                disabled={loading}
                className="w-full bg-matka-green-600 text-white py-3 px-4 rounded-lg font-semibold text-lg hover:bg-matka-green-500 focus:outline-none focus:ring-2 focus:ring-matka-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Please wait...
                  </div>
                ) : (
                  'Login'
                )}
              </button>
            </form>



            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-center text-sm text-gray-400">
                Admin access only. Unauthorized access is prohibited.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              Admin Panel v1.0.0 • Secure Access Only
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage 