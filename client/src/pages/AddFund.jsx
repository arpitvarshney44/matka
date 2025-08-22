import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'
import { Layout, Card, Button, Input, Modal, Grid, FloatingActionButton } from '../components'

const AddFund = () => {
  const navigate = useNavigate()
  const { user, API_URL } = useAuth()
  const [loading, setLoading] = useState(false)
  const [currentPoints, setCurrentPoints] = useState(0)
  const [depositAmount, setDepositAmount] = useState('')
  const [upiId, setUpiId] = useState('')
  const [minimumDeposit, setMinimumDeposit] = useState(1)
  const [transactionId, setTransactionId] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('') // 'upi' or 'qr'
  const [showQR, setShowQR] = useState(false)

  const predefinedAmounts = [500, 1000, 2000, 5000, 10000, 15000]

  useEffect(() => {
    loadUserBalance()
    loadMainSettings()
  }, [])

  const loadUserBalance = async () => {
    try {
      const response = await axios.get(`${API_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const newBalance = response.data.user.balance || 0
      setCurrentPoints(newBalance)

      // Update user context with new balance
      if (user && user.balance !== newBalance) {
        // You might want to update the auth context here
        // This depends on how your AuthContext is implemented
        console.log('Balance updated:', newBalance)
      }
    } catch (error) {
      console.error('Error loading user balance:', error)
    }
  }

  const loadMainSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/main-settings/public`)
      setUpiId(response.data.upiId || '787794312@kbl')
      setMinimumDeposit(response.data.minimumDeposit || 1)
    } catch (error) {
      console.error('Error loading main settings:', error)
      setUpiId('787794312@kbl')
      setMinimumDeposit(1)
    }
  }

  const handleAmountChange = (e) => {
    const value = e.target.value
    // Only allow numbers
    if (/^\d*$/.test(value)) {
      setDepositAmount(value)
    }
  }

  const handlePredefinedAmount = (amount) => {
    setDepositAmount(amount.toString())
  }

  const generateUPILink = (amount) => {
    // Generate a unique transaction ID with timestamp and random component
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    const tid = `${timestamp}${random}`
    setTransactionId(tid)

    // Validate UPI ID format
    if (!upiId || !upiId.includes('@')) {
      console.error('Invalid UPI ID format:', upiId)
      toast.error('Invalid UPI ID configuration. Please contact support.')
      return null
    }

    // Validate amount
    if (!amount || amount <= 0) {
      console.error('Invalid amount:', amount)
      toast.error('Invalid amount specified')
      return null
    }

    // Create UPI parameters according to UPI deep link specification
    const params = new URLSearchParams()

    // Required parameters
    params.append('pa', upiId) // Payee address (UPI ID)
    params.append('pn', 'RAJ KALYAN MATKA') // Payee name
    params.append('tn', `Deposit Points - ${user?.name || 'User'}`) // Transaction note
    params.append('am', amount.toString()) // Amount in rupees (not paise)
    params.append('cu', 'INR') // Currency

    // Optional parameters
    params.append('mc', '1234') // Merchant code
    params.append('tid', tid) // Transaction ID
    params.append('tr', tid) // Transaction reference

    // Build the UPI deep link
    const upiLink = `upi://pay?${params.toString()}`

    console.log('Generated UPI Link:', upiLink)
    console.log('Transaction ID:', tid)
    console.log('Amount:', amount)
    console.log('UPI ID:', upiId)

    return { upiLink, transactionId: tid }
  }

  const generateQRCode = async (upiLink) => {
    try {
      if (!upiLink) {
        throw new Error('UPI link is required for QR code generation')
      }

      console.log('Generating QR code for UPI link:', upiLink)

      // Clear any existing QR code first
      setQrCodeUrl('')

      // Add a small delay to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100))

      const qrDataUrl = await QRCode.toDataURL(upiLink, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })

      setQrCodeUrl(qrDataUrl)
      console.log('QR code generated successfully')

      // Verify the QR code was set
      if (!qrDataUrl) {
        throw new Error('QR code generation failed - no data URL returned')
      }

    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error('Failed to generate QR code. Please try again.')
      throw new Error('QR code generation failed: ' + error.message)
    }
  }

  const handleUPIPayment = async () => {
    if (!depositAmount || depositAmount < minimumDeposit) {
      toast.error(`Minimum deposit amount is ${minimumDeposit} points`)
      return
    }

    setLoading(true)
    try {
      const result = generateUPILink(parseInt(depositAmount))

      // Check if UPI link generation failed
      if (!result) {
        setLoading(false)
        return
      }

      const { upiLink, transactionId: currentTransactionId } = result

      console.log('Creating fund request with transactionId:', currentTransactionId)

      // Create fund request (not auto-approve)
      const requestResponse = await axios.post(`${API_URL}/fund-request/create`, {
        amount: parseInt(depositAmount),
        transactionId: currentTransactionId,
        paymentMethod: 'UPI'
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      console.log('Fund request created:', requestResponse.data)
      toast.success('Fund request submitted successfully! Please wait for admin approval.')

      setPaymentMethod('upi')

      // Try to open UPI link in new window/tab
      try {
        window.open(upiLink, '_blank')
        toast.success('Opening UPI payment app...')
      } catch (windowError) {
        console.error('Error opening UPI link:', windowError)
        // Fallback: copy link to clipboard or show it
        navigator.clipboard.writeText(upiLink).then(() => {
          toast.success('UPI link copied to clipboard. Please open your UPI app and paste the link.')
        }).catch(() => {
          toast.info(`Please copy this UPI link: ${upiLink}`)
        })
      }

      // Reset form after successful request
      setDepositAmount('')

    } catch (error) {
      console.error('Error creating fund request:', error)
      if (error.response) {
        console.error('Server response:', error.response.data)
        if (error.response.data.errors) {
          const errorMessages = error.response.data.errors.map(err => err.msg).join(', ')
          toast.error(`Validation error: ${errorMessages}`)
        } else if (error.response.data.message) {
          toast.error(error.response.data.message)
        } else {
          toast.error('Failed to create fund request. Please try again.')
        }
      } else {
        toast.error('Failed to create fund request')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleQRPayment = async () => {
    if (!depositAmount || depositAmount < minimumDeposit) {
      toast.error(`Minimum deposit amount is ${minimumDeposit} points`)
      return
    }

    setLoading(true)

    // Reset QR-related state
    setQrCodeUrl('')
    setShowQR(false)

    try {
      const result = generateUPILink(parseInt(depositAmount))

      // Check if UPI link generation failed
      if (!result) {
        setLoading(false)
        return
      }

      const { upiLink, transactionId: currentTransactionId } = result

      console.log('Creating fund request with transactionId:', currentTransactionId)

      // Create fund request (not auto-approve)
      const requestResponse = await axios.post(`${API_URL}/fund-request/create`, {
        amount: parseInt(depositAmount),
        transactionId: currentTransactionId,
        paymentMethod: 'QR'
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      console.log('Fund request created:', requestResponse.data)
      toast.success('Fund request submitted successfully! Please wait for admin approval.')

      // Generate QR code after fund request is created
      await generateQRCode(upiLink)

      setPaymentMethod('qr')
      setShowQR(true)

      // Reset form after successful request
      setDepositAmount('')

    } catch (error) {
      console.error('Error creating fund request:', error)
      if (error.response) {
        console.error('Server response:', error.response.data)
        if (error.response.data.errors) {
          const errorMessages = error.response.data.errors.map(err => err.msg).join(', ')
          toast.error(`Validation error: ${errorMessages}`)
        } else if (error.response.data.message) {
          toast.error(error.response.data.message)
        } else {
          toast.error('Failed to create fund request. Please try again.')
        }
      } else if (error.message && error.message.includes('QR code')) {
        toast.error('Failed to generate QR code. Please try again.')
      } else {
        toast.error('Failed to create fund request. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }


  const handleRefresh = () => {
    loadUserBalance()
    loadMainSettings()
    toast.success('Refreshed successfully')
  }



  return (
    <Layout
      title="Deposit"
      showBalance={true}
      balance={currentPoints}
    >
      <div className="p-4 lg:p-6">
        <div className="max-w-md mx-auto">
          {/* Current Points */}
          <div className="text-center mb-6">
            <p className="text-gray-600">Current Points:</p>
            <p className="text-2xl font-bold text-orange-600">{currentPoints}</p>
          </div>

          {/* Points Input */}
          <Card className="mb-6">
            <Input
              type="text"
              value={depositAmount}
              onChange={handleAmountChange}
              placeholder="Enter points"
              className="text-lg"
            />
            <p className="text-orange-600 text-sm mt-2">Minimum deposit points is {minimumDeposit}</p>
          </Card>

          {/* Predefined Amounts */}
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Select</h3>
            <div className="grid grid-cols-3 gap-3">
              {predefinedAmounts.map((amount) => (
                <Button
                  key={amount}
                  onClick={() => handlePredefinedAmount(amount)}
                  variant="secondary"
                  className="bg-yellow-400 text-gray-900 hover:bg-yellow-500 focus:ring-yellow-500"
                >
                  {amount}
                </Button>
              ))}
            </div>
          </Card>

          {/* Payment Options */}
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
            <div className="space-y-3">
              <Button
                onClick={handleUPIPayment}
                disabled={loading || !depositAmount}
                size="lg"
                className="w-full"
              >
                <span className="text-xl mr-3">💳</span>
                Pay using UPI App
              </Button>

              <Button
                onClick={handleQRPayment}
                disabled={loading || !depositAmount}
                variant="secondary"
                size="lg"
                className="w-full bg-gray-400 hover:bg-gray-500 focus:ring-gray-500"
              >
                <span className="text-xl mr-3">📱</span>
                Scan using QR Code
              </Button>
            </div>
          </Card>

          {/* QR Code Modal */}
          <Modal
            isOpen={showQR && qrCodeUrl}
            onClose={() => setShowQR(false)}
            title="Scan QR Code"
            size="sm"
          >
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg border mb-4">
                <img src={qrCodeUrl} alt="QR Code" className="w-full h-auto" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code with any UPI app to complete payment
              </p>
              <Button
                onClick={() => setShowQR(false)}
                variant="secondary"
                className="w-full"
              >
                Close
              </Button>
            </div>
          </Modal>


        </div>

        {/* Floating Refresh Button */}
        <FloatingActionButton
          onClick={handleRefresh}
          tooltip="Refresh"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        />
      </div>
    </Layout>
  )
}

export default AddFund 