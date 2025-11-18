/**
 * Types for the smart alert and notification system
 */

export type AlertType = 
  | 'renewal_reminder'
  | 'trial_expiring'
  | 'price_increase'
  | 'unusual_spending'
  | 'unused_service'
  | 'renewal_today'

export type AlertPriority = 'critical' | 'high' | 'medium' | 'low'
export type AlertStatus = 'active' | 'snoozed' | 'dismissed' | 'resolved'
export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms'

export interface NotificationPreferences {
  userId: string
  enabled: boolean
  channels: {
    inApp: boolean
    email: boolean
    push: boolean
  }
  // Alert type specific preferences
  alertPreferences: {
    renewal: {
      enabled: boolean
      daysBeforeDueDays: number // e.g., 7 days before renewal
      frequency: 'once' | 'daily' | 'weekly'
    }
    trial: {
      enabled: boolean
      daysBefore: number // e.g., 3 days before expiry
      frequency: 'once' | 'daily'
    }
    spending: {
      enabled: boolean
      threshold: number // Alert if monthly spending exceeds this
      frequency: 'once' | 'daily'
    }
    priceIncrease: {
      enabled: boolean
      minPercentage: number // Alert if price increases by more than this %
    }
    unusedServices: {
      enabled: boolean
      daysUnused: number // e.g., 30 days
      frequency: 'once' | 'weekly'
    }
  }
  // Custom reminder times
  reminderTimes: {
    morning: string // e.g., '09:00'
    afternoon: string // e.g., '14:00'
    evening: string // e.g., '18:00'
  }
  updatedAt: number
}

export interface Alert {
  id: string
  userId: string
  type: AlertType
  priority: AlertPriority
  status: AlertStatus
  title: string
  description: string
  message: string
  relatedSubscriptionIds: string[]
  
  // Financial impact
  affectedAmount?: number // in cents
  estimatedSavings?: number // in cents
  
  // Timing
  createdAt: number
  dueDate?: number // When the alert applies (renewal date, trial expiry, etc.)
  snoozeUntil?: number // Timestamp until which alert is snoozed
  dismissedAt?: number
  resolvedAt?: number
  
  // Metadata
  actionUrl?: string
  metadata: {
    subscriptionName?: string
    frequency?: string
    priceIncrease?: number
    lastPrice?: number
    newPrice?: number
    daysSinceUsed?: number
  }
}

export interface AlertAction {
  alertId: string
  userId: string
  action: 'dismiss' | 'snooze' | 'resolve' | 'view_details'
  snoozeUntil?: number // For snooze action
  timestamp: number
  channel: NotificationChannel // Where the action was taken from
}

export interface AlertStatistics {
  userId: string
  totalAlerts: number
  activeAlerts: number
  dismissedToday: number
  snoozedAlerts: number
  totalPotentialSavings: number
  alertsActedOn: number
  actionRate: number // percentage of alerts user acts on
  lastCheckedAt: number
}
