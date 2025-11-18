/**
 * Notification preferences UI component
 */

import { useState } from 'react'
import './NotificationPreferences.css'

export default function NotificationPreferences({
  preferences,
  onSave,
  isSaving,
}) {
  const [prefs, setPrefs] = useState(preferences)

  const handleChannelToggle = (channel) => {
    setPrefs({
      ...prefs,
      channels: {
        ...prefs.channels,
        [channel]: !prefs.channels[channel],
      },
    })
  }

  const handleAlertToggle = (alertType) => {
    setPrefs({
      ...prefs,
      alertPreferences: {
        ...prefs.alertPreferences,
        [alertType]: {
          ...prefs.alertPreferences[alertType],
          enabled: !prefs.alertPreferences[alertType].enabled,
        },
      },
    })
  }

  const handleDaysChange = (alertType, value) => {
    const days = Math.max(1, Math.min(90, parseInt(value) || 1))
    setPrefs({
      ...prefs,
      alertPreferences: {
        ...prefs.alertPreferences,
        [alertType]: {
          ...prefs.alertPreferences[alertType],
          daysBeforeDueDays: days,
        },
      },
    })
  }

  const handleThresholdChange = (value) => {
    const threshold = Math.max(1000, parseInt(value) || 10000)
    setPrefs({
      ...prefs,
      alertPreferences: {
        ...prefs.alertPreferences,
        spending: {
          ...prefs.alertPreferences.spending,
          threshold,
        },
      },
    })
  }

  const handleSave = () => {
    onSave?.(prefs)
  }

  return (
    <div className="notification-preferences">
      <div className="preferences-section">
        <h3 className="section-title">Notification Channels</h3>
        <div className="channel-options">
          {Object.entries(prefs.channels).map(([channel, enabled]) => (
            <label key={channel} className="channel-option">
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => handleChannelToggle(channel)}
                disabled={isSaving}
              />
              <span className="channel-label">
                {channel === 'inApp' && 'In-App Notifications'}
                {channel === 'email' && 'Email Alerts'}
                {channel === 'push' && 'Browser Push'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="preferences-section">
        <h3 className="section-title">Alert Preferences</h3>

        <div className="alert-pref">
          <div className="alert-pref-header">
            <label className="alert-toggle">
              <input
                type="checkbox"
                checked={prefs.alertPreferences.renewal.enabled}
                onChange={() => handleAlertToggle('renewal')}
                disabled={isSaving}
              />
              <span>Renewal Reminders</span>
            </label>
          </div>
          {prefs.alertPreferences.renewal.enabled && (
            <div className="alert-pref-options">
              <label className="option-input">
                <span>Days before renewal:</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={prefs.alertPreferences.renewal.daysBeforeDueDays}
                  onChange={(e) => handleDaysChange('renewal', e.target.value)}
                  disabled={isSaving}
                />
              </label>
            </div>
          )}
        </div>

        <div className="alert-pref">
          <div className="alert-pref-header">
            <label className="alert-toggle">
              <input
                type="checkbox"
                checked={prefs.alertPreferences.trial.enabled}
                onChange={() => handleAlertToggle('trial')}
                disabled={isSaving}
              />
              <span>Trial Expiring Soon</span>
            </label>
          </div>
          {prefs.alertPreferences.trial.enabled && (
            <div className="alert-pref-options">
              <label className="option-input">
                <span>Days before expiry:</span>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={prefs.alertPreferences.trial.daysBefore}
                  onChange={(e) => handleDaysChange('trial', e.target.value)}
                  disabled={isSaving}
                />
              </label>
            </div>
          )}
        </div>

        <div className="alert-pref">
          <div className="alert-pref-header">
            <label className="alert-toggle">
              <input
                type="checkbox"
                checked={prefs.alertPreferences.unusedServices.enabled}
                onChange={() => handleAlertToggle('unusedServices')}
                disabled={isSaving}
              />
              <span>Unused Services</span>
            </label>
          </div>
          {prefs.alertPreferences.unusedServices.enabled && (
            <div className="alert-pref-options">
              <label className="option-input">
                <span>Days unused to alert:</span>
                <input
                  type="number"
                  min="7"
                  max="90"
                  value={prefs.alertPreferences.unusedServices.daysUnused}
                  onChange={(e) => handleDaysChange('unusedServices', e.target.value)}
                  disabled={isSaving}
                />
              </label>
            </div>
          )}
        </div>

        <div className="alert-pref">
          <div className="alert-pref-header">
            <label className="alert-toggle">
              <input
                type="checkbox"
                checked={prefs.alertPreferences.spending.enabled}
                onChange={() => handleAlertToggle('spending')}
                disabled={isSaving}
              />
              <span>Spending Alerts</span>
            </label>
          </div>
          {prefs.alertPreferences.spending.enabled && (
            <div className="alert-pref-options">
              <label className="option-input">
                <span>Monthly spending threshold:</span>
                <div className="threshold-input">
                  $
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={prefs.alertPreferences.spending.threshold / 100}
                    onChange={(e) => handleThresholdChange(e.target.value * 100)}
                    disabled={isSaving}
                  />
                  <span>/month</span>
                </div>
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="preferences-actions">
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}
