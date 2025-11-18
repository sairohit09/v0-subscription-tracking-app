/**
 * Grid wrapper component for subscription cards
 * Handles layout switching and bulk selection
 */

import { useState, useMemo } from 'react'
import SubscriptionCard from './SubscriptionCard'
import './SubscriptionsGrid.css'

export default function SubscriptionsGrid({
  subscriptions = [],
  layout = 'grid', // 'grid' or 'list'
  onSubscriptionAction = null,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [sortBy, setSortBy] = useState('renewal') // 'renewal', 'cost', 'name'

  // Sort subscriptions
  const sortedSubscriptions = useMemo(() => {
    const sorted = [...subscriptions].sort((a, b) => {
      switch (sortBy) {
        case 'cost':
          return b.cost - a.cost
        case 'name':
          return a.name.localeCompare(b.name)
        case 'renewal':
        default:
          return a.renewalDate - b.renewalDate
      }
    })
    return sorted
  }, [subscriptions, sortBy])

  const handleToggleSelection = (subscriptionId, isSelected) => {
    const newSelected = new Set(selectedIds)
    if (isSelected) {
      newSelected.add(subscriptionId)
    } else {
      newSelected.delete(subscriptionId)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === subscriptions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(subscriptions.map((s) => s.id)))
    }
  }

  return (
    <div className="subscriptions-container">
      {/* Grid controls */}
      <div className="grid-controls">
        <div className="control-left">
          {subscriptions.length > 0 && (
            <div className="bulk-select">
              <input
                type="checkbox"
                id="select-all"
                checked={selectedIds.size === subscriptions.length && subscriptions.length > 0}
                onChange={handleSelectAll}
                className="select-all-checkbox"
              />
              <label htmlFor="select-all">
                Select all ({selectedIds.size} selected)
              </label>
            </div>
          )}
        </div>

        <div className="control-right">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="renewal">Sort by renewal date</option>
            <option value="cost">Sort by cost (high to low)</option>
            <option value="name">Sort by name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Subscriptions grid/list */}
      <div className={`subscriptions-${layout}`}>
        {sortedSubscriptions.length === 0 ? (
          <div className="subscriptions-empty">
            <p>No subscriptions to display</p>
          </div>
        ) : (
          sortedSubscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              layout={layout}
              isSelected={selectedIds.has(subscription.id)}
              onSelect={(isSelected) =>
                handleToggleSelection(subscription.id, isSelected)
              }
              onMarkUsed={() =>
                onSubscriptionAction?.('mark-used', subscription.id)
              }
              onPause={() => onSubscriptionAction?.('pause', subscription.id)}
              onEdit={() => onSubscriptionAction?.('edit', subscription.id)}
              onCancel={() => onSubscriptionAction?.('cancel', subscription.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
