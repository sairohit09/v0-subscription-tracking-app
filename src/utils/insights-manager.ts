/**
 * Manages insights generation, storage, and analytics
 */

import { Subscription } from '@/src/types'
import {
  Insight,
  InsightAnalytics,
  InsightsSummary,
  InsightsState,
  ActionType,
} from '@/src/types/insights'
import { generateInsights } from './insight-detector'
import { v4 as uuidv4 } from 'crypto'

const INSIGHTS_STORAGE_KEY = 'subsentry_insights_state'

/**
 * Generates insights and stores them
 */
export function generateAndStoreInsights(
  userId: string,
  subscriptions: Subscription[]
): InsightsState {
  const insights = generateInsights(userId, subscriptions)
  const state = getInsightsState()

  state.insights = insights
  state.lastGeneratedAt = Date.now()

  // Filter expired insights
  state.analytics = state.analytics.filter((a) => {
    const insight = insights.find((i) => i.id === a.insightId)
    return insight && insight.expiresAt > Date.now()
  })

  saveInsightsState(state)
  updateSummary(state)

  return state
}

/**
 * Records when a user acts on an insight
 */
export function recordInsightAction(
  userId: string,
  insightId: string,
  insightType: string,
  action: ActionType | 'dismissed',
  estimatedSavings: number = 0
): InsightAnalytics {
  const state = getInsightsState()

  const analytics: InsightAnalytics = {
    id: uuidv4(),
    userId,
    insightId,
    insightType: insightType as any,
    action,
    actualSavings: action !== 'dismissed' ? estimatedSavings : 0,
    timestamp: Date.now(),
    result: action === 'dismissed' ? 'cancelled' : 'completed',
  }

  state.analytics.push(analytics)
  saveInsightsState(state)
  updateSummary(state)

  return analytics
}

/**
 * Gets current insights state
 */
export function getInsightsState(): InsightsState {
  try {
    if (typeof window === 'undefined') {
      return getDefaultState()
    }

    const stored = localStorage.getItem(INSIGHTS_STORAGE_KEY)
    if (!stored) {
      return getDefaultState()
    }

    return JSON.parse(stored)
  } catch (error) {
    console.error('[SubSentry] Error reading insights state:', error)
    return getDefaultState()
  }
}

/**
 * Saves insights state to storage
 */
export function saveInsightsState(state: InsightsState): boolean {
  try {
    if (typeof window === 'undefined') {
      return false
    }

    localStorage.setItem(INSIGHTS_STORAGE_KEY, JSON.stringify(state))
    return true
  } catch (error) {
    console.error('[SubSentry] Error saving insights state:', error)
    return false
  }
}

/**
 * Updates the summary based on current insights and analytics
 */
export function updateSummary(state: InsightsState): void {
  const activeInsights = state.insights.filter((i) => i.expiresAt > Date.now())

  state.summary = {
    totalInsights: activeInsights.length,
    criticalCount: activeInsights.filter((i) => i.priority === 'high').length,
    warningCount: activeInsights.filter((i) => i.priority === 'medium').length,
    infoCount: activeInsights.filter((i) => i.priority === 'low').length,
    totalPotentialSavings: activeInsights.reduce((sum, i) => sum + i.estimatedSavings, 0),
    actionsCompleted: state.analytics.filter((a) => a.result === 'completed').length,
    actualSavingsAchieved: state.analytics.reduce((sum, a) => sum + a.actualSavings, 0),
  }
}

/**
 * Gets insights for a specific subscription
 */
export function getSubscriptionInsights(subscriptionId: string): Insight[] {
  const state = getInsightsState()
  return state.insights.filter(
    (i) =>
      i.relatedSubscriptionIds.includes(subscriptionId) &&
      i.expiresAt > Date.now()
  )
}

/**
 * Gets analytics for specific insight type
 */
export function getInsightAnalytics(insightType?: string): InsightAnalytics[] {
  const state = getInsightsState()
  if (!insightType) return state.analytics

  return state.analytics.filter((a) => a.insightType === insightType)
}

/**
 * Calculates insight action rate
 */
export function getInsightActionRate(): number {
  const state = getInsightsState()
  if (state.insights.length === 0) return 0

  const totalInsights = state.insights.length
  const actedUpon = state.analytics.filter(
    (a) => a.result === 'completed'
  ).length

  return totalInsights > 0 ? (actedUpon / totalInsights) * 100 : 0
}

function getDefaultState(): InsightsState {
  return {
    insights: [],
    analytics: [],
    summary: {
      totalInsights: 0,
      criticalCount: 0,
      warningCount: 0,
      infoCount: 0,
      totalPotentialSavings: 0,
      actionsCompleted: 0,
      actualSavingsAchieved: 0,
    },
    lastGeneratedAt: 0,
  }
}
