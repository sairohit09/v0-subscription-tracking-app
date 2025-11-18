/**
 * Types for intelligent insights system
 */

export type InsightType = 
  | 'duplicate_services'
  | 'unused_subscription'
  | 'annual_savings'
  | 'price_anomaly'
  | 'free_trial_expiring'

export type InsightPriority = 'high' | 'medium' | 'low'

export type ActionType = 'review' | 'pause' | 'switch' | 'cancel' | 'upgrade'

export interface Insight {
  id: string
  userId: string
  type: InsightType
  priority: InsightPriority
  title: string
  description: string
  estimatedSavings: number // in cents
  relatedSubscriptionIds: string[]
  actionButtons: ActionButton[]
  createdAt: number
  expiresAt: number // When insight is no longer relevant
  metadata: Record<string, unknown>
}

export interface ActionButton {
  type: ActionType
  label: string
  color: 'primary' | 'secondary' | 'danger'
}

export interface InsightAnalytics {
  id: string
  userId: string
  insightId: string
  insightType: InsightType
  action: ActionType | 'dismissed'
  actualSavings: number // Updated after action taken
  timestamp: number
  result: 'completed' | 'pending' | 'cancelled'
}

export interface InsightsSummary {
  totalInsights: number
  criticalCount: number // high priority
  warningCount: number // medium priority
  infoCount: number // low priority
  totalPotentialSavings: number
  actionsCompleted: number
  actualSavingsAchieved: number
}

export interface InsightsState {
  insights: Insight[]
  analytics: InsightAnalytics[]
  summary: InsightsSummary
  lastGeneratedAt: number
}
