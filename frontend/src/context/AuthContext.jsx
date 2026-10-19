import { createContext, useContext, useEffect, useState } from 'react'
import { apiRequest } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function refreshUser() {
    try {
      const data = await apiRequest('/api/users/me')
      const currentUser = data.user || data
      setUser(currentUser)
      return currentUser
    } catch {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  async function login(credentials) {
    const data = await apiRequest('/api/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    if (data.user) setUser(data.user)
    else await refreshUser()

    return data
  }

  async function register(details) {
    return apiRequest('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(details),
    })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}