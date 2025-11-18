import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('subsentry_user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (err) {
        console.error('Failed to parse stored user:', err)
        localStorage.removeItem('subsentry_user')
      }
    }
    setLoading(false)
  }, [])

  const login = (userData) => {
    try {
      setUser(userData)
      localStorage.setItem('subsentry_user', JSON.stringify(userData))
      setError(null)
    } catch (err) {
      setError('Failed to login')
      console.error('Login error:', err)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('subsentry_user')
    setError(null)
  }

  const clearError = () => setError(null)

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
