import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './GoogleSignInButton.css'

export default function GoogleSignInButton() {
  const { login, error, clearError } = useAuth()
  const navigate = useNavigate()
  const googleButtonRef = useRef(null)
  const [isLoading, setIsLoading] = React.useState(false)

  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE',
        callback: handleCredentialResponse,
        error_uri: 'https://localhost:3000/login',
      })

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: '350',
        logo_alignment: 'center',
      })
    }
  }, [])

  async function handleCredentialResponse(response) {
    setIsLoading(true)
    clearError()

    try {
      // Decode JWT to get user info (frontend only - for production, verify on backend)
      const base64Url = response.credential.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )

      const decodedToken = JSON.parse(jsonPayload)

      // In production, you MUST verify this token on your backend
      const userData = {
        id: decodedToken.sub,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        loginTime: new Date().toISOString(),
      }

      login(userData)
      navigate('/dashboard')
    } catch (err) {
      console.error('Google Sign-In error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="google-signin-wrapper">
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      <div
        ref={googleButtonRef}
        className={isLoading ? 'opacity-50' : ''}
        aria-busy={isLoading}
      />
    </div>
  )
}
