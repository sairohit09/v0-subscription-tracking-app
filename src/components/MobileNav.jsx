import { useState } from 'react'
import './MobileNav.css'

export default function MobileNav({ onAddClick, onViewChange, activeView }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleViewChange = (view) => {
    onViewChange(view)
    setIsMenuOpen(false)
  }

  return (
    <nav className="mobile-nav">
      <button 
        className="nav-fab nav-fab-primary"
        onClick={onAddClick}
        aria-label="Add new subscription"
        title="Add Subscription"
      >
        +
      </button>

      <div className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
        <button
          className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleViewChange('dashboard')}
          aria-label="Dashboard view"
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Dashboard</span>
        </button>
        <button
          className={`nav-item ${activeView === 'subscriptions' ? 'active' : ''}`}
          onClick={() => handleViewChange('subscriptions')}
          aria-label="Subscriptions list"
        >
          <span className="nav-icon">📋</span>
          <span className="nav-label">Subscriptions</span>
        </button>
        <button
          className={`nav-item ${activeView === 'insights' ? 'active' : ''}`}
          onClick={() => handleViewChange('insights')}
          aria-label="Insights view"
        >
          <span className="nav-icon">💡</span>
          <span className="nav-label">Insights</span>
        </button>
        <button
          className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => handleViewChange('settings')}
          aria-label="Settings"
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Settings</span>
        </button>
      </div>

      <button
        className="nav-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isMenuOpen}
      >
        <span className="hamburger"></span>
      </button>
    </nav>
  )
}
