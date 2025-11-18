/**
 * Main alerts panel showing active alerts and alert management
 */

import { useState } from 'react'
import AlertCard from './AlertCard'
import './AlertsPanel.css'

export default function AlertsPanel({
  alerts,
  onDismiss,
  onSnooze,
  onViewDetails,
  isLoading,
  criticalCount,
}) {
  const [expandedAlerts, setExpandedAlerts] = useState(new Set())
  const [actionLoading, setActionLoading] = useState(null)

  const handleDismiss = async (alertId) => {
    setActionLoading(alertId)
    try {
      onDismiss?.(alertId)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSnooze = async (alertId, minutes) => {
    setActionLoading(alertId)
    try {
      onSnooze?.(alertId, minutes)
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="alerts-panel loading">
        <div className="loading-skeleton" />
        <div className="loading-skeleton" style={{ animationDelay: '0.2s' }} />
        <div className="loading-skeleton" style={{ animationDelay: '0.4s' }} />
      </div>
    )
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="alerts-panel empty">
        <div className="empty-icon">✓</div>
        <h3>All caught up!</h3>
        <p>No active alerts at this time. Check back soon.</p>
      </div>
    )
  }

  const criticalAlerts = alerts.filter((a) => a.priority === 'critical')
  const otherAlerts = alerts.filter((a) => a.priority !== 'critical')

  return (
    <div className="alerts-panel">
      {criticalAlerts.length > 0 && (
        <div className="alerts-section critical">
          <h3 className="alerts-section-title">
            Critical Alerts <span className="alert-badge">{criticalAlerts.length}</span>
          </h3>
          <div className="alerts-list">
            {criticalAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onDismiss={handleDismiss}
                onSnooze={handleSnooze}
                onViewDetails={onViewDetails}
                isActionLoading={actionLoading === alert.id}
              />
            ))}
          </div>
        </div>
      )}

      {otherAlerts.length > 0 && (
        <div className="alerts-section">
          <h3 className="alerts-section-title">
            Active Alerts <span className="alert-badge">{otherAlerts.length}</span>
          </h3>
          <div className="alerts-list">
            {otherAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onDismiss={handleDismiss}
                onSnooze={handleSnooze}
                onViewDetails={onViewDetails}
                isActionLoading={actionLoading === alert.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
