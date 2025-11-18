/**
 * Manages alert storage, state, and lifecycle
 */

import { Alert, AlertAction, AlertStatistics, NotificationPreferences, AlertStatus } from '@/src/types/alerts'
import { Subscription } from '@/src/types'

const ALERTS_STORAGE_KEY = 'subsentry_alerts'
const PREFERENCES_STORAGE_KEY = 'subsentry_notification_prefs'

/**
 * Gets all alerts for a user
 */
export function getAlerts(userId: string, status?: AlertStatus): Alert[] {
  try {
    const stored = localStorage.getItem(ALERTS_STORAGE_KEY)
    if (!stored) return []

    const allAlerts: Alert[] = JSON.parse(stored)
    const userAlerts = allAlerts.filter((a) => a.userId === userId)

    if (status) {
      return userAlerts.filter((a) => a.status === status)
    }
    return userAlerts
  } catch (error) {
    console.error('[SubSentry] Error reading alerts:', error)
    return []
  }
}

/**
 * Saves alerts
 */
export function saveAlerts(alerts: Alert[]): boolean {
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts))
    return true
  } catch (error) {
    console.error('[SubSentry] Error saving alerts:', error)
    return false
  }
}

/**
 * Adds a new alert
 */
export function addAlert(alert: Alert): boolean {
  const alerts = getAllAlerts()
  alerts.push(alert)
  return saveAlerts(alerts)
}

/**
 * Updates an alert status
 */
export function updateAlertStatus(alertId: string, status: AlertStatus, snoozeUntil?: number): boolean {
  const alerts = getAllAlerts()
  const alert = alerts.find((a) => a.id === alertId)

  if (!alert) return false

  alert.status = status
  if (status === 'snoozed' && snoozeUntil) {
    alert.snoozeUntil = snoozeUntil
  } else if (status === 'dismissed') {
    alert.dismissedAt = Date.now()
  } else if (status === 'resolved') {
    alert.resolvedAt = Date.now()
  }

  return saveAlerts(alerts)
}

/**
 * Dismisses an alert
 */
export function dismissAlert(alertId: string): boolean {
  return updateAlertStatus(alertId, 'dismissed')
}

/**
 * Snoozes an alert for specified minutes
 */
export function snoozeAlert(alertId: string, minutes: number = 60): boolean {
  const snoozeUntil = Date.now() + minutes * 60 * 1000
  return updateAlertStatus(alertId, 'snoozed', snoozeUntil)
}

/**
 * Records an alert action
 */
export function recordAlertAction(action: AlertAction): boolean {
  try {
    const actions: AlertAction[] = JSON.parse(localStorage.getItem('subsentry_alert_actions') || '[]')
    actions.push(action)
    localStorage.setItem('subsentry_alert_actions', JSON.stringify(actions))
    return true
  } catch (error) {
    console.error('[SubSentry] Error recording alert action:', error)
    return false
  }
}

/**
 * Gets notification preferences for a user
 */
export function getNotificationPreferences(userId: string): NotificationPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY)
    if (!stored) {
      return createDefaultPreferences(userId)
    }

    const allPrefs: Record<string, NotificationPreferences> = JSON.parse(stored)
    return allPrefs[userId] || createDefaultPreferences(userId)
  } catch (error) {
    console.error('[SubSentry] Error reading notification preferences:', error)
    return createDefaultPreferences(userId)
  }
}

/**
 * Saves notification preferences
 */
export function saveNotificationPreferences(preferences: NotificationPreferences): boolean {
  try {
    const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY) || '{}'
    const allPrefs: Record<string, NotificationPreferences> = JSON.parse(stored)
    allPrefs[preferences.userId] = preferences
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(allPrefs))
    return true
  } catch (error) {
    console.error('[SubSentry] Error saving notification preferences:', error)
    return false
  }
}

/**
 * Creates default notification preferences
 */
export function createDefaultPreferences(userId: string): NotificationPreferences {
  return {
    userId,
    enabled: true,
    channels: {
      inApp: true,
      email: true,
      push: false,
    },
    alertPreferences: {
      renewal: {
        enabled: true,
        daysBeforeDueDays: 7,
        frequency: 'once',
      },
      trial: {
        enabled: true,
        daysBefore: 3,
        frequency: 'once',
      },
      spending: {
        enabled: true,
        threshold: 10000, // $100/month
        frequency: 'daily',
      },
      priceIncrease: {
        enabled: true,
        minPercentage: 10,
      },
      unusedServices: {
        enabled: true,
        daysUnused: 30,
        frequency: 'weekly',
      },
    },
    reminderTimes: {
      morning: '09:00',
      afternoon: '14:00',
      evening: '18:00',
    },
    updatedAt: Date.now(),
  }
}

/**
 * Gets all alerts (including snoozed/resolved)
 */
export function getAllAlerts(): Alert[] {
  try {
    const stored = localStorage.getItem(ALERTS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('[SubSentry] Error reading all alerts:', error)
    return []
  }
}

/**
 * Calculates alert statistics
 */
export function calculateAlertStatistics(userId: string): AlertStatistics {
  const alerts = getAlerts(userId)
  const actions: AlertAction[] = JSON.parse(localStorage.getItem('subsentry_alert_actions') || '[]')
  const userActions = actions.filter((a) => a.userId === userId)

  const activeAlerts = alerts.filter((a) => a.status === 'active').length
  const snoozedAlerts = alerts.filter((a) => a.status === 'snoozed').length
  const dismissedToday = alerts.filter((a) => a.status === 'dismissed' && a.dismissedAt && Date.now() - a.dismissedAt < 24 * 60 * 60 * 1000).length

  const totalSavings = alerts.reduce((sum, a) => sum + (a.estimatedSavings || 0), 0)
  const actedAlerts = userActions.filter((a) => a.action !== 'dismiss').length
  const actionRate = alerts.length > 0 ? (actedAlerts / alerts.length) * 100 : 0

  return {
    userId,
    totalAlerts: alerts.length,
    activeAlerts,
    dismissedToday,
    snoozedAlerts,
    totalPotentialSavings: totalSavings,
    alertsActedOn: actedAlerts,
    actionRate,
    lastCheckedAt: Date.now(),
  }
}

/**
 * Cleans up expired snoozed alerts
 */
export function cleanupExpiredSnoozes(): void {
  const alerts = getAllAlerts()
  const now = Date.now()

  const updated = alerts.map((alert) => {
    if (alert.status === 'snoozed' && alert.snoozeUntil && alert.snoozeUntil < now) {
      return { ...alert, status: 'active' as AlertStatus }
    }
    return alert
  })

  saveAlerts(updated)
}
