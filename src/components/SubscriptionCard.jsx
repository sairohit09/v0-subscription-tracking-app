/**
 * Enhanced subscription card with comprehensive information and quick actions
 * Supports both grid and list layouts
 */

import { useState } from 'react'
import {
  getDaysUntilRenewal,
  formatRenewalDate,
  getRenewalUrgency,
  getUrgencyColor,
  getLastUsedLabel,
  formatCost,
} from '../utils/subscription-helpers'
import { getServiceInfo, getServiceColor } from '../utils/service-logos'
import './SubscriptionCard.css'

export default function SubscriptionCard({
  subscription,
  layout = 'grid', // 'grid' or 'list'
  isSelected = false,
  onSelect = null,
  onMarkUsed = null,
  onPause = null,
  onCancel = null,
  onEdit = null,
}) {
  const [showActions, setShowActions] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const daysUntilRenewal = getDaysUntilRenewal(subscription.renewalDate)
  const urgency = getRenewalUrgency(daysUntilRenewal)
  const urgencyColor = getUrgencyColor(urgency)
  const lastUsedLabel = getLastUsedLabel(subscription.usage.lastUsedDate)
  const serviceInfo = getServiceInfo(subscription.name)
  const serviceColor = getServiceColor(subscription.name)

  // Build usage dots for last 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const usageDots = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(sevenDaysAgo + (i + 1) * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0]
    const dayUsage = subscription.usage.dailyUsage.find((u) => u.date === dateStr)
    return {
      date: dateStr,
      hasUsage: dayUsage && dayUsage.minutes > 0,
      minutes: dayUsage?.minutes || 0,
    }
  })

  const handleAction = async (action, callback) => {
    setIsActionLoading(true)
    try {
      if (callback) {
        await callback()
      }
    } catch (error) {
      console.error('[v0] Error handling subscription action:', error)
    } finally {
      setIsActionLoading(false)
    }
  }

  if (layout === 'list') {
    return (
      <div
        className={`subscription-card subscription-card-list ${
          isSelected ? 'selected' : ''
        }`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Checkbox for selection */}
        {onSelect && (
          <div className="card-checkbox">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.checked)}
              className="selection-checkbox"
            />
          </div>
        )}

        {/* Service Logo and Name */}
        <div className="card-logo-section">
          <div className="service-logo" style={{ backgroundColor: serviceColor }}>
            {serviceInfo.logo}
          </div>
          <div className="service-details">
            <h3 className="service-name">{subscription.name}</h3>
            <div className="service-tags">
              {subscription.tags.map((tag) => (
                <span key={tag} className={`tag tag-${tag}`}>
                  {tag.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Cost and frequency */}
        <div className="card-cost-section">
          <p className="cost-label">Cost</p>
          <p className="cost-value">{formatCost(subscription.cost, subscription.frequency)}</p>
        </div>

        {/* Renewal date */}
        <div className="card-renewal-section">
          <p className="renewal-label">Renews</p>
          <p className="renewal-date" style={{ borderColor: urgencyColor }}>
            {formatRenewalDate(subscription.renewalDate)}
            <span className="renewal-days">({daysUntilRenewal}d)</span>
          </p>
        </div>

        {/* Usage indicator */}
        <div className="card-usage-section">
          <p className="usage-label">Last used</p>
          <p className="usage-text">{lastUsedLabel}</p>
        </div>

        {/* Quick action buttons */}
        <div className={`card-actions ${showActions ? 'visible' : ''}`}>
          <button
            className="action-btn action-use"
            title="Mark as used today"
            onClick={() => handleAction('mark-used', onMarkUsed)}
            disabled={isActionLoading}
          >
            ✓
          </button>
          <button
            className="action-btn action-pause"
            title="Pause subscription"
            onClick={() => handleAction('pause', onPause)}
            disabled={isActionLoading}
          >
            ⏸
          </button>
          <button
            className="action-btn action-edit"
            title="Edit subscription"
            onClick={() => handleAction('edit', onEdit)}
            disabled={isActionLoading}
          >
            ✏️
          </button>
          <button
            className="action-btn action-cancel"
            title="Cancel subscription"
            onClick={() => handleAction('cancel', onCancel)}
            disabled={isActionLoading}
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  // Grid layout
  return (
    <div
      className={`subscription-card subscription-card-grid ${
        isSelected ? 'selected' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Selection checkbox */}
      {onSelect && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.checked)}
          className="card-selection"
        />
      )}

      {/* Renewal urgency indicator */}
      <div className="card-urgency-bar" style={{ backgroundColor: urgencyColor }} />

      <div className="card-header">
        <div className="service-logo" style={{ backgroundColor: serviceColor }}>
          {serviceInfo.logo}
        </div>
        <h3 className="service-name">{subscription.name}</h3>
      </div>

      <div className="card-metadata">
        <p className="category-badge">{subscription.metadata.category}</p>
      </div>

      <div className="card-cost">
        <p className="cost-label">Cost</p>
        <p className="cost-value">{formatCost(subscription.cost, subscription.frequency)}</p>
      </div>

      <div className="card-renewal">
        <p className="renewal-label">Renews {formatRenewalDate(subscription.renewalDate)}</p>
        <p className="renewal-countdown">
          {daysUntilRenewal <= 0 ? 'TODAY' : `${daysUntilRenewal} days`}
        </p>
      </div>

      {/* Usage visualization - 7 day dots */}
      <div className="card-usage-dots">
        {usageDots.map((day, idx) => (
          <div
            key={idx}
            className={`usage-dot ${day.hasUsage ? 'active' : 'inactive'}`}
            title={`${day.date}: ${day.minutes}min`}
          />
        ))}
      </div>

      <div className="card-tags">
        {subscription.tags.map((tag) => (
          <span key={tag} className={`tag tag-${tag}`}>
            {tag.replace(/-/g, ' ')}
          </span>
        ))}
      </div>

      <p className="card-last-used">{lastUsedLabel}</p>

      {/* Quick actions - visible on hover */}
      <div className={`card-quick-actions ${showActions ? 'visible' : 'hidden'}`}>
        <button
          className="quick-action-btn action-use"
          title="Mark as used today"
          onClick={() => handleAction('mark-used', onMarkUsed)}
          disabled={isActionLoading}
        >
          ✓
        </button>
        <button
          className="quick-action-btn action-pause"
          title="Pause subscription"
          onClick={() => handleAction('pause', onPause)}
          disabled={isActionLoading}
        >
          ⏸
        </button>
        <button
          className="quick-action-btn action-edit"
          title="Edit subscription"
          onClick={() => handleAction('edit', onEdit)}
          disabled={isActionLoading}
        >
          ✏️
        </button>
        <button
          className="quick-action-btn action-cancel"
          title="Cancel subscription"
          onClick={() => handleAction('cancel', onCancel)}
          disabled={isActionLoading}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
