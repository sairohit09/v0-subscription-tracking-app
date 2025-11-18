/**
 * Individual insight card component with action buttons
 */

import { useState } from 'react'
import { recordInsightAction } from '../utils/insights-manager'
import './InsightCard.css'

export default function InsightCard({
  insight,
  onAction,
}) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#ef4444' // red
      case 'medium':
        return '#f59e0b' // amber
      case 'low':
        return '#6b7280' // gray
      default:
        return '#9e9e9e'
    }
  }

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return 'Critical'
      case 'medium':
        return 'Important'
      case 'low':
        return 'Suggestion'
      default:
        return 'Info'
    }
  }

  const getInsightIcon = (type) => {
    const icons: Record<string, string> = {
      duplicate_services: '📚',
      unused_subscription: '🔇',
      annual_savings: '💰',
      price_anomaly: '📈',
      free_trial_expiring: '⏰',
    }
    return icons[type] || '💡'
  }

  const handleAction = async (actionType) => {
    setIsLoading(true)
    try {
      recordInsightAction(
        insight.userId,
        insight.id,
        insight.type,
        actionType,
        insight.estimatedSavings
      )

      if (onAction) {
        onAction(insight, actionType)
      }

      if (actionType === 'dismissed') {
        setIsDismissed(true)
      }
    } catch (error) {
      console.error('[v0] Error handling insight action:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isDismissed) {
    return null
  }

  const savingsAmount = insight.estimatedSavings / 100

  return (
    <div
      className="insight-card"
      style={{
        '--priority-color': getPriorityColor(insight.priority),
      }}
    >
      <div className="insight-header">
        <div className="insight-icon">{getInsightIcon(insight.type)}</div>
        <div className="insight-meta">
          <span className="priority-badge">{getPriorityLabel(insight.priority)}</span>
          <span className="insight-age">
            {new Date(insight.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="insight-content">
        <h3 className="insight-title">{insight.title}</h3>
        <p className="insight-description">{insight.description}</p>
      </div>

      {savingsAmount > 0 && (
        <div className="savings-indicator">
          <span className="savings-label">Potential savings:</span>
          <span className="savings-amount">${savingsAmount.toFixed(2)}</span>
        </div>
      )}

      <div className="insight-actions">
        {insight.actionButtons.map((btn) => (
          <button
            key={btn.type}
            className={`action-button action-${btn.color}`}
            onClick={() => handleAction(btn.type)}
            disabled={isLoading}
          >
            {btn.label}
          </button>
        ))}
        <button
          className="action-button action-secondary dismiss-btn"
          onClick={() => handleAction('dismissed')}
          disabled={isLoading}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
