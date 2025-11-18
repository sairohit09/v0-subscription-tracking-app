import { useAuth, useSignIn } from '@clerk/clerk-react'
import { useNavigate, useEffect } from 'react-router-dom'
import './Login.css'

export default function Login() {
  const { isSignedIn } = useAuth()
  const { signIn } = useSignIn()
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    if (isSignedIn) {
      navigate('/dashboard')
    }
  }, [isSignedIn, navigate])

  const handleGoogleSignIn = async () => {
    if (!signIn) return

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/dashboard',
        redirectUrlComplete: '/dashboard',
      })
    } catch (error) {
      console.error('Google sign-in error:', error)
    }
  }

  return (
    <main className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="app-title">SubSentry</h1>
          <p className="app-subtitle">Take control of your subscriptions</p>
        </div>

        <div className="login-content">
          <div className="login-card">
            <h2>Sign In</h2>
            <p className="login-description">
              Track, manage, and optimize all your subscriptions in one place.
            </p>

            <div className="login-form">
              <button
                onClick={handleGoogleSignIn}
                className="google-sign-in-btn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>

              <div className="divider">
                <span>Powered by Clerk</span>
              </div>

              <p className="demo-note">
                Sign in securely with your Google account
              </p>
            </div>

            <div className="login-footer">
              <p className="terms-text">
                By signing in, you agree to our{' '}
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>

        <footer className="login-footer-bottom">
          <p>SubSentry © 2025. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}
