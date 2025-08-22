import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'
import PageHeader from '../components/PageHeader'

const WalletStatement = () => {
  const { API_URL } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [fundRequests, setFundRequests] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [bets, setBets] = useState([])
  const [starlineBets, setStarlineBets] = useState([])
  const [activeTab, setActiveTab] = useState('all') // all, fund-requests, withdrawals, bets, starline-bets, winnings, starline-winnings
  const [combinedTransactions, setCombinedTransactions] = useState([])

  useEffect(() => {
    fetchWalletData()
  }, [])

  const fetchWalletData = async () => {
    setLoading(true)
    try {
      // Fetch fund requests
      const fundResponse = await axios.get(`${API_URL}/fund-request/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      // Fetch withdrawal history
      const withdrawResponse = await axios.get(`${API_URL}/withdraw/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      // Fetch bet history
      const betResponse = await axios.get(`${API_URL}/bets/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      // Fetch Starline bet history
      const starlineBetResponse = await axios.get(`${API_URL}/starline/bets`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const funds = fundResponse.data.requests || []
      const withdraws = withdrawResponse.data.withdrawals || []
      const userBets = betResponse.data.bets || []
      const userStarlineBets = starlineBetResponse.data.success ? starlineBetResponse.data.data.bets || [] : []

      setFundRequests(funds)
      setWithdrawals(withdraws)
      setBets(userBets)
      setStarlineBets(userStarlineBets)

      // Filter won bets and create winning transactions
      const wonBets = userBets.filter(bet => bet.status === 'won' && bet.winAmount > 0)
      const winningTransactions = wonBets.map(bet => ({
        ...bet,
        type: 'winning',
        amount: bet.winAmount,
        createdAt: bet.resultDate || bet.betDate
      }))

      // Filter won Starline bets and create Starline winning transactions
      const wonStarlineBets = userStarlineBets.filter(bet => bet.status === 'won' && bet.winAmount > 0)
      const starlineWinningTransactions = wonStarlineBets.map(bet => ({
        ...bet,
        type: 'starline-winning',
        amount: bet.winAmount,
        createdAt: bet.resultDate || bet.betDate
      }))

      // Combine and sort by date
      const combined = [
        ...funds.map(item => ({ ...item, type: 'fund-request' })),
        ...withdraws.map(item => ({ ...item, type: 'withdrawal' })),
        ...userBets.map(item => ({ ...item, type: 'bet' })),
        ...userStarlineBets.map(item => ({ ...item, type: 'starline-bet' })),
        ...winningTransactions,
        ...starlineWinningTransactions
      ].sort((a, b) => {
        const getDate = (item) => {
          if (item.type === 'bet' || item.type === 'starline-bet') return item.betDate
          if (item.type === 'winning' || item.type === 'starline-winning') return item.resultDate || item.betDate
          return item.createdAt
        }
        const dateA = new Date(getDate(a))
        const dateB = new Date(getDate(b))
        return dateB - dateA
      })

      setCombinedTransactions(combined)

    } catch (error) {
      console.error('Error fetching wallet data:', error)
      toast.error('Failed to load wallet statement')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    )
  }

  const getTransactionIcon = (transaction) => {
    if (transaction.type === 'fund-request') {
      return '💰' // Money bag for fund requests
    } else if (transaction.type === 'bet') {
      return '🎲' // Dice for regular bets
    } else if (transaction.type === 'starline-bet') {
      return '⭐' // Star for Starline bets
    } else if (transaction.type === 'winning') {
      return '🎉' // Party popper for regular winnings
    } else if (transaction.type === 'starline-winning') {
      return '🌟' // Star for Starline winnings
    } else {
      // Withdrawal icons based on method
      const icons = {
        bank: '🏦',
        phonepe: '📱',
        googlepay: '💳',
        paytm: '💰'
      }
      return icons[transaction.method] || '💸'
    }
  }

  const getTransactionTitle = (transaction) => {
    if (transaction.type === 'fund-request') {
      return `Fund Request - ${transaction.paymentMethod}`
    } else if (transaction.type === 'bet') {
      const betTypeNames = {
        single: 'Single',
        jodi: 'Jodi',
        singlePanna: 'Single Panna',
        doublePanna: 'Double Panna',
        triplePanna: 'Triple Panna',
        halfSangam: 'Half Sangam',
        fullSangam: 'Full Sangam'
      }
      return `Bet - ${betTypeNames[transaction.betType] || transaction.betType}`
    } else if (transaction.type === 'starline-bet') {
      const starlineBetTypeNames = {
        'single digit': 'Single Digit',
        'single pana': 'Single Pana',
        'double pana': 'Double Pana',
        'triple pana': 'Triple Pana'
      }
      return `Starline Bet - ${starlineBetTypeNames[transaction.betType] || transaction.betType}`
    } else if (transaction.type === 'winning') {
      const betTypeNames = {
        single: 'Single',
        jodi: 'Jodi',
        singlePanna: 'Single Panna',
        doublePanna: 'Double Panna',
        triplePanna: 'Triple Panna',
        halfSangam: 'Half Sangam',
        fullSangam: 'Full Sangam'
      }
      return `Winning - ${betTypeNames[transaction.betType] || transaction.betType}`
    } else if (transaction.type === 'starline-winning') {
      const starlineBetTypeNames = {
        'single digit': 'Single Digit',
        'single pana': 'Single Pana',
        'double pana': 'Double Pana',
        'triple pana': 'Triple Pana'
      }
      return `Starline Win - ${starlineBetTypeNames[transaction.betType] || transaction.betType}`
    } else {
      const methodNames = {
        bank: 'Bank Account',
        phonepe: 'PhonePe',
        googlepay: 'Google Pay',
        paytm: 'Paytm'
      }
      return `Withdrawal - ${methodNames[transaction.method] || 'Unknown'}`
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFilteredTransactions = () => {
    switch (activeTab) {
      case 'fund-requests':
        return combinedTransactions.filter(t => t.type === 'fund-request')
      case 'withdrawals':
        return combinedTransactions.filter(t => t.type === 'withdrawal')
      case 'bets':
        return combinedTransactions.filter(t => t.type === 'bet' || t.type === 'starline-bet')
      case 'winnings':
        return combinedTransactions.filter(t => t.type === 'winning' || t.type === 'starline-winning')
      case 'starline-bets':
        return combinedTransactions.filter(t => t.type === 'starline-bet')
      case 'starline-winnings':
        return combinedTransactions.filter(t => t.type === 'starline-winning')
      default:
        return combinedTransactions
    }
  }

  const filteredTransactions = getFilteredTransactions()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wallet statement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Wallet Statement" 
        subtitle="Track all your wallet transactions"
        showBackButton={true}
        backPath="/dashboard"
        rightContent={
          <button
            onClick={fetchWalletData}
            className="p-2 rounded-full text-white hover:bg-green-700 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        }
      />

      <div className="p-4 max-w-4xl mx-auto">
        {/* Filter Tabs - Mobile Optimized */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-x-auto">
          <div className="flex min-w-full">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 min-w-[60px] py-3 px-2 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="text-base mb-1">📋</span>
                <span>All</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('fund-requests')}
              className={`flex-1 min-w-[60px] py-3 px-2 text-xs font-medium transition-colors whitespace-nowrap border-l border-gray-200 ${
                activeTab === 'fund-requests'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="text-base mb-1">💰</span>
                <span>Funds</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`flex-1 min-w-[60px] py-3 px-2 text-xs font-medium transition-colors whitespace-nowrap border-l border-gray-200 ${
                activeTab === 'withdrawals'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="text-base mb-1">💸</span>
                <span>Withdraw</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('bets')}
              className={`flex-1 min-w-[60px] py-3 px-2 text-xs font-medium transition-colors whitespace-nowrap border-l border-gray-200 ${
                activeTab === 'bets'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="text-base mb-1">🎲</span>
                <span>Bets</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('winnings')}
              className={`flex-1 min-w-[60px] py-3 px-2 text-xs font-medium transition-colors whitespace-nowrap border-l border-gray-200 ${
                activeTab === 'winnings'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="text-base mb-1">🎉</span>
                <span>Wins</span>
              </div>
            </button>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-sm text-gray-600 mb-1">Fund Requests</div>
            <div className="text-lg font-bold text-green-600">{fundRequests.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl mb-2">💸</div>
            <div className="text-sm text-gray-600 mb-1">Withdrawals</div>
            <div className="text-lg font-bold text-blue-600">{withdrawals.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl mb-2">🎲</div>
            <div className="text-sm text-gray-600 mb-1">Total Bets</div>
            <div className="text-lg font-bold text-purple-600">{bets.length + starlineBets.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl mb-2">🎉</div>
            <div className="text-sm text-gray-600 mb-1">Total Winnings</div>
            <div className="text-lg font-bold text-yellow-600">
              {bets.filter(b => b.status === 'won' && b.winAmount > 0).length + 
               starlineBets.filter(b => b.status === 'won' && b.winAmount > 0).length}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length > 0 ? (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div key={`${transaction.type}-${transaction._id}`} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getTransactionIcon(transaction)}</span>
                    <span className="font-medium text-gray-900 text-sm">
                      {getTransactionTitle(transaction)}
                    </span>
                  </div>
                  {getStatusBadge(transaction.status)}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className={`font-semibold ${
                      transaction.type === 'fund-request' || transaction.type === 'winning' || transaction.type === 'starline-winning' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'fund-request' || transaction.type === 'winning' || transaction.type === 'starline-winning' ? '+' : '-'}₹{(transaction.type === 'bet' || transaction.type === 'starline-bet') ? transaction.betAmount : transaction.amount}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Date:</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(
                        (transaction.type === 'bet' || transaction.type === 'starline-bet') ? transaction.betDate :
                        (transaction.type === 'winning' || transaction.type === 'starline-winning') ? (transaction.resultDate || transaction.betDate) :
                        transaction.createdAt
                      )}
                    </span>
                  </div>

                  {/* Fund Request specific details */}
                  {transaction.type === 'fund-request' && (
                    <>
                      {transaction.requestId && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Request ID:</span>
                          <span className="text-sm text-gray-900 font-mono">{transaction.requestId}</span>
                        </div>
                      )}
                      {transaction.transactionId && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Transaction ID:</span>
                          <span className="text-sm text-gray-900 font-mono">{transaction.transactionId}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Withdrawal specific details */}
                  {transaction.type === 'withdrawal' && (
                    <>
                      {transaction.accountDetails && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Account:</span>
                          <span className="text-sm text-gray-900">{transaction.accountDetails}</span>
                        </div>
                      )}
                      {transaction.transactionId && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Transaction ID:</span>
                          <span className="text-sm text-gray-900 font-mono">{transaction.transactionId}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Bet specific details */}
                  {transaction.type === 'bet' && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Game:</span>
                        <span className="text-sm text-gray-900">{transaction.gameName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Session:</span>
                        <span className="text-sm text-gray-900 capitalize">{transaction.session}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Number:</span>
                        <span className="text-sm text-gray-900 font-mono">{transaction.betNumber}</span>
                      </div>
                    </>
                  )}
                  
                  {/* Starline Bet specific details */}
                  {transaction.type === 'starline-bet' && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Game:</span>
                        <span className="text-sm text-gray-900">{transaction.gameId?.gameName || 'Starline Game'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Number:</span>
                        <span className="text-sm text-gray-900 font-mono">{transaction.betNumber}</span>
                      </div>
                    </>
                  )}
                  
                  {/* Winning specific details */}
                  {transaction.type === 'winning' && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Game:</span>
                        <span className="text-sm text-gray-900">{transaction.gameName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Session:</span>
                        <span className="text-sm text-gray-900 capitalize">{transaction.session}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Bet Number:</span>
                        <span className="text-sm text-gray-900 font-mono">{transaction.betNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Bet Amount:</span>
                        <span className="text-sm text-gray-900">₹{transaction.betAmount}</span>
                      </div>
                      {transaction.result && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Result:</span>
                          <span className="text-sm text-gray-900 font-mono">{transaction.result}</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Starline Winning specific details */}
                  {transaction.type === 'starline-winning' && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Game:</span>
                        <span className="text-sm text-gray-900">{transaction.gameId?.gameName || 'Starline Game'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Bet Number:</span>
                        <span className="text-sm text-gray-900 font-mono">{transaction.betNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Bet Amount:</span>
                        <span className="text-sm text-gray-900">₹{transaction.betAmount}</span>
                      </div>
                      {transaction.result && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Result:</span>
                          <span className="text-sm text-gray-900 font-mono">{transaction.result}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {transaction.remarks && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Remarks:</span>
                      <p className="text-sm text-gray-900 mt-1">{transaction.remarks}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">
              {activeTab === 'fund-requests' ? '💰' :
               activeTab === 'withdrawals' ? '💸' :
               activeTab === 'bets' ? '🎲' :
               activeTab === 'winnings' ? '🎉' : '📆'}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === 'fund-requests' ? 'No Fund Requests' :
               activeTab === 'withdrawals' ? 'No Withdrawals' :
               activeTab === 'bets' ? 'No Bets' :
               activeTab === 'winnings' ? 'No Winnings' : 'No Transactions'}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'fund-requests' ? 'You haven\'t made any fund requests yet.' :
               activeTab === 'withdrawals' ? 'You haven\'t made any withdrawal requests yet.' :
               activeTab === 'bets' ? 'You haven\'t placed any bets yet.' :
               activeTab === 'winnings' ? 'You haven\'t won any bets yet.' :
               'You have no wallet transactions yet.'}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/add-fund')}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200"
              >
                Add Funds
              </button>
              <button
                onClick={() => navigate('/withdraw-fund')}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
              >
                Withdraw Funds
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WalletStatement
