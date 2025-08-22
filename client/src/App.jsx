import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import GameSelection from './pages/GameSelection'
import GameChart from './pages/GameChart'
import Wallet from './pages/Wallet'
import PrivacyPolicy from './pages/PrivacyPolicy'
import HowToPlay from './pages/HowToPlay'
import ContactUs from './pages/ContactUs'
import Enquiry from './pages/Enquiry'
import ChangePassword from './pages/ChangePassword'
import Bank from './pages/Bank'
import Paytm from './pages/Paytm'
import GooglePay from './pages/GooglePay'
import PhonePe from './pages/PhonePe'
import AddFund from './pages/AddFund'
import WithdrawFund from './pages/WithdrawFund'
import WithdrawHistory from './pages/WithdrawHistory'
import WalletStatement from './pages/WalletStatement'
import GameRates from './pages/GameRates'
import SingleDigitBet from './pages/SingleDigitBet'
import JodiBet from './pages/JodiBet'
import SinglePannaBet from './pages/SinglePannaBet'
import DoublePannaBet from './pages/DoublePannaBet'
import TriplePannaBet from './pages/TriplePannaBet'
import HalfSangamBet from './pages/HalfSangamBet'
import FullSangamBet from './pages/FullSangamBet'
import BiddingHistory from './pages/BiddingHistory'
import WinningHistory from './pages/WinningHistory'
import StarlineGaming from './pages/StarlineGaming'
import StarlineHistory from './pages/StarlineHistory'
import StarlineChart from './pages/StarlineChart'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Auth routes */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected user routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Game Selection page */}
            <Route
              path="/game-selection/:gameId"
              element={
                <ProtectedRoute>
                  <GameSelection />
                </ProtectedRoute>
              }
            />
            
            {/* Game Chart page */}
            <Route
              path="/game-chart/:gameId"
              element={
                <ProtectedRoute>
                  <GameChart />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/wallet" 
              element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/change-password" 
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bank" 
              element={
                <ProtectedRoute>
                  <Bank />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/paytm" 
              element={
                <ProtectedRoute>
                  <Paytm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/googlepay" 
              element={
                <ProtectedRoute>
                  <GooglePay />
                </ProtectedRoute>
              } 
            />
                          <Route 
                path="/phonepe" 
                element={
                  <ProtectedRoute>
                    <PhonePe />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/add-fund" 
                element={
                  <ProtectedRoute>
                    <AddFund />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/withdraw-fund" 
                element={
                  <ProtectedRoute>
                    <WithdrawFund />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/withdraw-history" 
                element={
                  <ProtectedRoute>
                    <WithdrawHistory />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/wallet-statement" 
                element={
                  <ProtectedRoute>
                    <WalletStatement />
                  </ProtectedRoute>
                } 
              />
            
            {/* Bidding History page (protected) */}
            <Route
              path="/bidding-history"
              element={
                <ProtectedRoute>
                  <BiddingHistory />
                </ProtectedRoute>
              }
            />

            {/* Winning History page (protected) */}
            <Route
              path="/winning-history"
              element={
                <ProtectedRoute>
                  <WinningHistory />
                </ProtectedRoute>
              }
            />

            {/* Starline Gaming page (protected) */}
            <Route
              path="/starline-gaming"
              element={
                <ProtectedRoute>
                  <StarlineGaming />
                </ProtectedRoute>
              }
            />

            {/* Starline History page (protected) */}
            <Route
              path="/starline-history"
              element={
                <ProtectedRoute>
                  <StarlineHistory />
                </ProtectedRoute>
              }
            />

            {/* Starline Chart pages (protected) */}
            <Route
              path="/starline-chart"
              element={
                <ProtectedRoute>
                  <StarlineChart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/starline-chart/:gameId"
              element={
                <ProtectedRoute>
                  <StarlineChart />
                </ProtectedRoute>
              }
            />

            {/* Game Rates page (protected) */}
            <Route 
              path="/game-rates" 
              element={
                <ProtectedRoute>
                  <GameRates />
                </ProtectedRoute>
              } 
            />

            {/* Betting pages (protected) */}
            <Route 
              path="/bet/single-digit" 
              element={
                <ProtectedRoute>
                  <SingleDigitBet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bet/single-digit/:gameId" 
              element={
                <ProtectedRoute>
                  <SingleDigitBet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bet/jodi" 
              element={
                <ProtectedRoute>
                  <JodiBet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bet/jodi/:gameId" 
              element={
                <ProtectedRoute>
                  <JodiBet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bet/single-panna" 
              element={
                <ProtectedRoute>
                  <SinglePannaBet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bet/single-panna/:gameId" 
              element={
                <ProtectedRoute>
                  <SinglePannaBet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bet/double-panna" 
              element={
                <ProtectedRoute>
                  <DoublePannaBet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bet/double-panna/:gameId" 
              element={
                <ProtectedRoute>
                  <DoublePannaBet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bet/triple-panna" 
              element={
                <ProtectedRoute>
                  <TriplePannaBet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bet/triple-panna/:gameId" 
              element={
                <ProtectedRoute>
                  <TriplePannaBet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bet/half-sangam" 
              element={
                <ProtectedRoute>
                  <HalfSangamBet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bet/half-sangam/:gameId" 
              element={
                <ProtectedRoute>
                  <HalfSangamBet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bet/full-sangam" 
              element={
                <ProtectedRoute>
                  <FullSangamBet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bet/full-sangam/:gameId" 
              element={
                <ProtectedRoute>
                  <FullSangamBet />
                </ProtectedRoute>
              } 
            />

            {/* Public routes */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/how-to-play" element={<HowToPlay />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/enquiry" element={<Enquiry />} />
            <Route path="/change-password" element={<ChangePassword />} />
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
          <Toaster position="top-right" />
          <PWAInstallPrompt />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App