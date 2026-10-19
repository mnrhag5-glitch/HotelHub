
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminDashboard from './pages/AdminDashboard'
import AdminLiveChat from './pages/AdminLiveChat'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Hotels from './pages/Hotels'
import HotelDetails from './pages/HotelDetails'
import VerifyEmail from './pages/VerifyEmail'
import MyPayments from './pages/MyPayments'



import './index.css'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/hotels" element={<Hotels />} />
        <Route path="/hotels/:hotelId" element={<HotelDetails />} />
        <Route path="/my-payments" element={<MyPayments />} />
      </Route>
<Route element={<ProtectedRoute />}>
  <Route path="/admin" element={<AdminDashboard />} />
  <Route path="/admin/live-chat" element={<AdminLiveChat />} />
</Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
