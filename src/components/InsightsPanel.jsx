/**
 * Panel displaying all insights with filtering and analytics
 */

import { useState, useEffect, useMemo } from 'react'
import InsightCard from './InsightCard'
import {
  getInsightsState,
  generateAndStoreInsights,
  getInsightActionRate,
} from '../utils/insights-manager'
import './InsightsPanel.css'

export default function InsightsPanel({
  subscriptions = [],
  userId = '',
  onInsightAction,
}) {
  const [state, setState] = useState(null)
  const [filterPriority, setFilterPriority] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  // Generate insights when subscriptions change
  useEffect(() => {
    if (subscriptions.length > 0 && userId) {
      setIsLoading(true)
      try {
        const newState = generateAndStoreInsights(userId, subscriptions)
        setState(newState)
      } finally {
        setIsLoading(false)
      }
    } else {
      const current = getInsightsState()
      setState(current)
      setIsLoading(false)
    }
  }, [subscriptions, userId])

  const filteredInsights = useMemo(() => {
    if (!state?.insights) return []
    
    let filtered = state.insights.filter((i) => i.expiresAt > Date.now())

    if (filterPriority !== 'all') {
      filtered = filtered.filter((i) => i.priority === filterPriority)
    }

    return filtered.sort((a, b) => {
      // Sort by priority: high > medium > low
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [state, filterPriority])

  const actionRate = useMemo(
    () => (state ? getInsightActionRate() : 0),
    [state]
  )

  if (!state) {
    return <div className="insights-panel loading">Loading insights...</div>
  }

  return (
    <div className="insights-panel">
      <div className="insights-header">
        <div className="header-info">
          <h2>Smart Insights</h2>
          <p className="subtitle">
            Recommendations to optimize your subscriptions
          </p>
        </div>

        <div className="insights-stats">
          <div className="stat">
            <span className="stat-value">{state.summary.totalInsights}</span>
            <span className="stat-label">Active Insights</span>
          </div>
          <div className="stat">
            <span className="stat-value">${(state.summary.totalPotentialSavings / 100).toFixed(0)}</span>
            <span className="stat-label">Potential Savings</span>
          </div>
          <div className="stat">
            <span className="stat-value">{Math.round(actionRate)}%</span>
            <span className="stat-label">Action Rate</span>
          </div>
        </div>
      </div>

      <div className="insights-controls">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterPriority === 'all' ? 'active' : ''}`}
            onClick={() => setFilterPriority('all')}
          >
            All ({state.summary.totalInsights})
          </button>
          <button
            className={`filter-btn priority-high ${filterPriority === 'high' ? 'active' : ''}`}
            onClick={() => setFilterPriority('high')}
          >
            Critical ({state.summary.criticalCount})
          </button>
          <button
            className={`filter-btn priority-medium ${filterPriority === 'medium' ? 'active' : ''}`}
            onClick={() => setFilterPriority('medium')}
          >
            Important ({state.summary.warningCount})
          </button>
          <button
            className={`filter-btn priority-low ${filterPriority === 'low' ? 'active' : ''}`}
            onClick={() => setFilterPriority('low')}
          >
            Info ({state.summary.infoCount})
          </button>
        </div>
      </div>

      <div className="insights-list">
        {isLoading && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Analyzing your subscriptions...</p>
          </div>
        )}

        {!isLoading && filteredInsights.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✨</div>
            <h3>No insights for this filter</h3>
            <p>
              {filterPriority === 'all'
                ? "You're all set! We'll alert you when we find optimization opportunities."
                : `No ${filterPriority} priority insights at the moment.`}
            </p>
          </div>
        ) : (
          filteredInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onAction={onInsightAction}
            />
          ))
        )}
      </div>

      {state.summary.actualSavingsAchieved > 0 && (
        <div className="savings-achieved">
          <div className="achievement-icon">🎉</div>
          <div className="achievement-text">
            <strong>${(state.summary.actualSavingsAchieved / 100).toFixed(2)}</strong> in
            savings achieved from your actions!
          </div>
        </div>
      )}
    </div>
  )
}
