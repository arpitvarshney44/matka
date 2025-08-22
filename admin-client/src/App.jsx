import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components'
import AdminDashboard from './pages/AdminDashboard'
import AuthPage from './pages/AuthPage'
import HowToPlayAdmin from './pages/HowToPlayAdmin'
import ContactSettingsAdmin from './pages/ContactSettingsAdmin'
import EnquiryManagement from './pages/EnquiryManagement'
import AutoActive from './pages/AutoActive'
import UserManagement from './pages/UserManagement'
import SubAdminList from './pages/SubAdminList'
import SubAdminRegistration from './pages/SubAdminRegistration'
import BannerSettingsAdmin from './pages/BannerSettingsAdmin'
import MainSettingsAdmin from './pages/MainSettingsAdmin'
import QRSettingsAdmin from './pages/QRSettingsAdmin'
import UserProfile from './pages/UserProfile'
import GameRatesAdmin from './pages/GameRatesAdmin'
import GameNames from './pages/GameNames'
import AddGame from './pages/AddGame'
import EditGame from './pages/EditGame'
import FundRequest from './pages/FundRequest'
import WithdrawRequest from './pages/WithdrawRequest'
import AddFundUserWallet from './pages/AddFundUserWallet'
import WithdrawFundUserWallet from './pages/WithdrawFundUserWallet'
import DeclareResult from './pages/DeclareResult'
import CheckWinners from './pages/CheckWinners'
import StarlineGameManagement from './pages/StarlineGameManagement'
import StarlineRateManagement from './pages/StarlineRateManagement'
import StarlineResultDeclaration from './pages/StarlineDeclareResult'
import StarlineCheckWinners from './pages/StarlineCheckWinners'
import StarlineReports from './pages/StarlineReports'
import WinnerManagement from './pages/WinnerManagement'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/game-rates-admin" element={
        <ProtectedRoute>
          <GameRatesAdmin />
        </ProtectedRoute>
      } />
      <Route path="/game-names" element={
        <ProtectedRoute>
          <GameNames />
        </ProtectedRoute>
      } />
      <Route path="/add-game" element={
        <ProtectedRoute>
          <AddGame />
        </ProtectedRoute>
      } />
      <Route path="/edit-game/:id" element={
        <ProtectedRoute>
          <EditGame />
        </ProtectedRoute>
      } />
      <Route path="/how-to-play-admin" element={
        <ProtectedRoute>
          <HowToPlayAdmin />
        </ProtectedRoute>
      } />
      <Route path="/contact-settings-admin" element={
        <ProtectedRoute>
          <ContactSettingsAdmin />
        </ProtectedRoute>
      } />
      <Route path="/enquiry-management" element={
        <ProtectedRoute>
          <EnquiryManagement />
        </ProtectedRoute>
      } />
      <Route path="/auto-active" element={
        <ProtectedRoute>
          <AutoActive />
        </ProtectedRoute>
      } />
      <Route path="/user-management" element={
        <ProtectedRoute>
          <UserManagement />
        </ProtectedRoute>
      } />
      <Route path="/sub-admin-list" element={
        <ProtectedRoute>
          <SubAdminList />
        </ProtectedRoute>
      } />
      <Route path="/sub-admin-registration" element={
        <ProtectedRoute>
          <SubAdminRegistration />
        </ProtectedRoute>
      } />
      <Route path="/banner-settings-admin" element={
        <ProtectedRoute>
          <BannerSettingsAdmin />
        </ProtectedRoute>
      } />
      <Route path="/main-settings-admin" element={
        <ProtectedRoute>
          <MainSettingsAdmin />
        </ProtectedRoute>
      } />
      <Route path="/qr-settings-admin" element={
        <ProtectedRoute>
          <QRSettingsAdmin />
        </ProtectedRoute>
      } />
      <Route path="/user-profile/:userId" element={
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
      } />
      <Route path="/fund-request" element={
        <ProtectedRoute>
          <FundRequest />
        </ProtectedRoute>
      } />
      <Route path="/withdraw-request" element={
        <ProtectedRoute>
          <WithdrawRequest />
        </ProtectedRoute>
      } />
      <Route path="/add-fund-user-wallet" element={
        <ProtectedRoute>
          <AddFundUserWallet />
        </ProtectedRoute>
      } />
      <Route path="/withdraw-fund-user-wallet" element={
        <ProtectedRoute>
          <WithdrawFundUserWallet />
        </ProtectedRoute>
      } />
      <Route path="/declare-result" element={
        <ProtectedRoute>
          <DeclareResult />
        </ProtectedRoute>
      } />
      <Route path="/check-winners" element={
        <ProtectedRoute>
          <CheckWinners />
        </ProtectedRoute>
      } />
      <Route path="/admin-dashboard" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      {/* Starline Routes */}
      <Route path="/starline-game-management" element={
        <ProtectedRoute>
          <StarlineGameManagement />
        </ProtectedRoute>
      } />
      <Route path="/starline-rate-management" element={
        <ProtectedRoute>
          <StarlineRateManagement />
        </ProtectedRoute>
      } />
      <Route path="/starline-result-declaration" element={
        <ProtectedRoute>
          <StarlineResultDeclaration />
        </ProtectedRoute>
      } />
      <Route path="/starline-check-winners" element={
        <ProtectedRoute>
          <StarlineCheckWinners />
        </ProtectedRoute>
      } />
      <Route path="/starline-reports" element={
        <ProtectedRoute>
          <StarlineReports />
        </ProtectedRoute>
      } />
      <Route path="/winner-management" element={
        <ProtectedRoute>
          <WinnerManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App