import { usePWA } from '../hooks/usePWA'
import './PWAInstallPrompt.css'

export default function PWAInstallPrompt() {
  const { isInstalled, canInstall, isUpdating, installApp } = usePWA()

  if (isInstalled || !canInstall) {
    return null
  }

  return (
    <div className="pwa-prompt">
      <div className="pwa-content">
        <div className="pwa-icon">📱</div>
        <div className="pwa-text">
          <h3>Install SubSentry</h3>
          <p>Add SubSentry to your home screen for quick access</p>
        </div>
      </div>
      <button
        className="pwa-install-btn"
        onClick={installApp}
        disabled={isUpdating}
      >
        {isUpdating ? 'Installing...' : 'Install'}
      </button>
    </div>
  )
}
