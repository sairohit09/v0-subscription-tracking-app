/**
 * React hook for managing alerts and notification preferences
 */

import { useState, useCallback, useEffect } from 'react'
import {
  getAlerts,
  getNotificationPreferences,
  saveNotificationPreferences,
  dismissAlert,
  snoozeAlert,
  recordAlertAction,
  calculateAlertStatistics,
  cleanupExpiredSnoozes,
} from '@/src/utils/alerts-manager'
import { generateAllAlerts } from '@/src/utils/alert-detector'
import { Alert, AlertStatus, NotificationPreferences, AlertStatistics } from '@/src/types/alerts'
import { Subscription } from '@/src/types'

export function useAlerts(userId: string | null, subscriptions: Subscription[]) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [statistics, setStatistics] = useState<AlertStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize alerts on mount or when subscriptions change
  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      // Generate new alerts from subscriptions
      const detected = generateAllAlerts(subscriptions, {
        renewalDaysBefore: preferences?.alertPreferences.renewal.daysBeforeDueDays || 7,
        trialDaysBefore: preferences?.alertPreferences.trial.daysBefore || 3,
        unusedDays: preferences?.alertPreferences.unusedServices.daysUnused || 30,
        spendingThreshold: preferences?.alertPreferences.spending.threshold || 10000,
      })

      setAlerts(detected)

      // Load preferences
      const prefs = getNotificationPreferences(userId)
      setPreferences(prefs)

      // Calculate stats
      const stats = calculateAlertStatistics(userId)
      setStatistics(stats)

      // Clean up expired snoozes
      cleanupExpiredSnoozes()
    } finally {
      setIsLoading(false)
    }
  }, [userId, subscriptions])

  const handleDismissAlert = useCallback(
    (alertId: string) => {
      if (dismissAlert(alertId)) {
        recordAlertAction({
          alertId,
          userId: userId || '',
          action: 'dismiss',
          timestamp: Date.now(),
          channel: 'in_app',
        })
        setAlerts((prev) => prev.filter((a) => a.id !== alertId))
      }
    },
    [userId]
  )

  const handleSnoozeAlert = useCallback(
    (alertId: string, minutes: number = 60) => {
      if (snoozeAlert(alertId, minutes)) {
        recordAlertAction({
          alertId,
          userId: userId || '',
          action: 'snooze',
          timestamp: Date.now(),
          channel: 'in_app',
        })
        setAlerts((prev) => prev.filter((a) => a.id !== alertId))
      }
    },
    [userId]
  )

  const handleUpdatePreferences = useCallback(
    (newPreferences: NotificationPreferences) => {
      if (saveNotificationPreferences(newPreferences)) {
        setPreferences(newPreferences)
      }
    },
    []
  )

  const getActiveAlerts = useCallback((): Alert[] => {
    return alerts.filter((a) => a.status === 'active' && (!a.snoozeUntil || a.snoozeUntil < Date.now()))
  }, [alerts])

  const getCriticalAlerts = useCallback((): Alert[] => {
    return getActiveAlerts().filter((a) => a.priority === 'critical')
  }, [getActiveAlerts])

  return {
    alerts,
    activeAlerts: getActiveAlerts(),
    criticalAlerts: getCriticalAlerts(),
    preferences,
    statistics,
    isLoading,
    dismissAlert: handleDismissAlert,
    snoozeAlert: handleSnoozeAlert,
    updatePreferences: handleUpdatePreferences,
  }
}
