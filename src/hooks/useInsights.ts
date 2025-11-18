/**
 * React hook for managing insights with reactive state
 */

import { useState, useCallback, useEffect } from 'react'
import { Subscription } from '@/src/types'
import {
  getInsightsState,
  generateAndStoreInsights,
  recordInsightAction,
  getSubscriptionInsights,
} from '@/src/utils/insights-manager'
import { Insight, InsightsState, ActionType } from '@/src/types/insights'

export function useInsights(userId: string, subscriptions: Subscription[]) {
  const [state, setState] = useState<InsightsState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Generate insights when subscriptions change
  useEffect(() => {
    if (!userId || subscriptions.length === 0) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const newState = generateAndStoreInsights(userId, subscriptions)
      setState(newState)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [userId, subscriptions])

  const handleAction = useCallback(
    (insightId: string, insightType: string, action: ActionType | 'dismissed') => {
      try {
        recordInsightAction(userId, insightId, insightType, action, 0)
        const updated = getInsightsState()
        setState(updated)
        return true
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
        return false
      }
    },
    [userId]
  )

  const getInsightsForSubscription = useCallback((subscriptionId: string) => {
    return getSubscriptionInsights(subscriptionId)
  }, [])

  return {
    state,
    insights: state?.insights || [],
    summary: state?.summary || null,
    analytics: state?.analytics || [],
    isLoading,
    error,
    handleAction,
    getInsightsForSubscription,
  }
}
