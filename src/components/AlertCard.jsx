/**
 * Individual alert card component with action buttons
 */

import './AlertCard.css'

export default function AlertCard({
  alert,
  onDismiss,
  onSnooze,
  onViewDetails,
  isDismissing,
  isActionLoading,
}) {
  const getPriorityColor = (priority) => {
    const colors = {
      critical: '#ff3b30',
      high: '#ff9500',
      medium: '#ffb800',
      low: '#34c759',
    }
    return colors[priority] || '#999'
  }

  const getPriorityLabel = (priority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  const getAlertTypeLabel = (type) => {
    const labels = {
      renewal_reminder: 'Renewal',
      renewal_today: 'Renews Today',
      trial_expiring: 'Trial Ending',
      price_increase: 'Price Change',
      unusual_spending: 'Spending Alert',
      unused_service: 'Unused Service',
    }
    return labels[type] || type
  }

  const formatAmount = (cents) => {
    if (!cents) return null
    return `$${(cents / 100).toFixed(2)}`
  }

  const renderQuickStats = () => {
    const stats = []

    if (alert.affectedAmount) {
      stats.push(
        <div key="affected" className="alert-stat">
          <span className="stat-label">Cost:</span>
          <span className="stat-value">{formatAmount(alert.affectedAmount)}</span>
        </div>
      )
    }

    if (alert.estimatedSavings) {
      stats.push(
        <div key="savings" className="alert-stat highlight">
          <span className="stat-label">Potential Savings:</span>
          <span className="stat-value">{formatAmount(alert.estimatedSavings)}</span>
        </div>
      )
    }

    return stats.length > 0 ? <div className="alert-stats">{stats}</div> : null
  }

  return (
    <div className="alert-card" style={{ borderLeftColor: getPriorityColor(alert.priority) }}>
      <div className="alert-header">
        <div className="alert-type-badge" style={{ backgroundColor: getPriorityColor(alert.priority) }}>
          {getAlertTypeLabel(alert.type)}
        </div>
        <div className="alert-priority">{getPriorityLabel(alert.priority)}</div>
      </div>

      <h3 className="alert-title">{alert.title}</h3>

      <p className="alert-message">{alert.message}</p>

      {alert.metadata?.subscriptionName && (
        <div className="alert-metadata">
          <span className="metadata-label">{alert.metadata.subscriptionName}</span>
        </div>
      )}

      {renderQuickStats()}

      <div className="alert-actions">
        <button
          className="alert-action-btn action-snooze"
          onClick={() => onSnooze?.(alert.id, 60)}
          disabled={isActionLoading}
          title="Snooze for 1 hour"
        >
          ⏰ 1h
        </button>
        <button
          className="alert-action-btn action-snooze"
          onClick={() => onSnooze?.(alert.id, 1440)}
          disabled={isActionLoading}
          title="Snooze for 1 day"
        >
          ⏰ 1d
        </button>
        <button
          className="alert-action-btn action-view"
          onClick={() => onViewDetails?.(alert.id)}
          disabled={isActionLoading}
        >
          View
        </button>
        <button
          className="alert-action-btn action-dismiss"
          onClick={() => onDismiss?.(alert.id)}
          disabled={isDismissing || isActionLoading}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
