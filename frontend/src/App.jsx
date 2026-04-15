import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { NotificationProvider } from './context/NotificationContext'
import HomePage from './pages/HomePage'
import UserDashboard from './pages/UserDashboard'
import StaffDashboard from './pages/StaffDashboard'
import AdminDashboard from './pages/AdminDashboard'
import HistoryPage from './pages/HistoryPage'
import EmergencyPage from './pages/EmergencyPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import './index.css'

const savedLang = localStorage.getItem('echosign_lang') || 'en'

function AppContent({ selectedLang, setSelectedLang }) {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'

  return (
    <NotificationProvider>
      <div className="app">
        {!isAuthPage && <Navbar selectedLang={selectedLang} setSelectedLang={setSelectedLang} />}
        <main className={isAuthPage ? 'auth-main' : 'main-content'}>
          <Routes>
            <Route path="/" element={<HomePage selectedLang={selectedLang} />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            {/* Role-Specific Dashboards */}
            <Route path="/dashboard/user" element={
              <ProtectedRoute><UserDashboard selectedLang={selectedLang} /></ProtectedRoute>
            } />
            <Route path="/dashboard/staff" element={
              <ProtectedRoute><StaffDashboard selectedLang={selectedLang} /></ProtectedRoute>
            } />
            <Route path="/dashboard/admin" element={
              <ProtectedRoute><AdminDashboard selectedLang={selectedLang} /></ProtectedRoute>
            } />

            {/* Legacy/Compat routes */}
            <Route path="/translator" element={
              <ProtectedRoute><UserDashboard selectedLang={selectedLang} /></ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute><HistoryPage selectedLang={selectedLang} /></ProtectedRoute>
            } />
            <Route path="/emergency" element={
              <ProtectedRoute><EmergencyPage selectedLang={selectedLang} /></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute><SettingsPage selectedLang={selectedLang} /></ProtectedRoute>
            } />
          </Routes>
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(15, 18, 35, 0.95)',
              color: '#e2e8f0',
              border: '1px solid rgba(79, 142, 247, 0.3)',
              backdropFilter: 'blur(20px)',
            },
          }}
        />
      </div>
    </NotificationProvider>
  )
}

function App() {
  const [selectedLang, setSelectedLang] = useState(savedLang)

  useEffect(() => {
    localStorage.setItem('echosign_lang', selectedLang)
  }, [selectedLang])

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent selectedLang={selectedLang} setSelectedLang={setSelectedLang} />
    </BrowserRouter>
  )
}

export default App
