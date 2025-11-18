import { useAuth } from '../context/AuthContext'
import { useNavigate, useEffect } from 'react-router-dom'
import GoogleSignInButton from '../components/GoogleSignInButton'
import './Login.css'

export default function Login() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

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
              <GoogleSignInButton />

              <div className="divider">
                <span>Or continue as</span>
              </div>

              <p className="demo-note">
                Demo email: <code>demo@subsentry.com</code>
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
