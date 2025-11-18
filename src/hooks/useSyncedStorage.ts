import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import {
  getStorageData,
  getUser,
  getSubscriptions,
  getInsights,
} from '@/src/utils/storage'
import {
  syncUserToSupabase,
  syncSubscriptionToSupabase,
  deleteSubscriptionFromSupabase,
  fetchSubscriptionsFromSupabase,
  syncInsightsToSupabase,
  logSyncAction,
} from '@/src/utils/storage-supabase'
import { Subscription, UserProfile, SmartInsights, StorageSchema } from '@/src/types'

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

export function useSyncedStorage() {
  const { userId, user } = useAuth()
  const [data, setData] = useState<StorageSchema>(() => getStorageData())
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSyncTime, setLastSyncTime] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(!userId)

  // Initial sync when user logs in
  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const performInitialSync = async () => {
      setSyncStatus('syncing')
      try {
        const currentData = getStorageData()

        // Sync user profile first
        if (currentData.user && user?.emailAddresses?.[0]?.emailAddress) {
          const userProfile: UserProfile = {
            ...currentData.user,
            email: user.emailAddresses[0].emailAddress,
            name: user.firstName + ' ' + (user.lastName || '') || 'User',
            avatar: user.imageUrl,
          }
          await syncUserToSupabase(userProfile, userId)
        }

        // Fetch subscriptions from Supabase
        const dbSubscriptions = await fetchSubscriptionsFromSupabase(userId)
        if (dbSubscriptions.length > 0) {
          setData((prev) => ({
            ...prev,
            subscriptions: dbSubscriptions,
          }))
        }

        setLastSyncTime(Date.now())
        setSyncStatus('synced')
      } catch (error) {
        console.error('[SubSentry] Initial sync error:', error)
        setSyncStatus('error')
      } finally {
        setIsLoading(false)
      }
    }

    performInitialSync()
  }, [userId, user])

  // Sync subscription to both local and cloud
  const syncSubscription = useCallback(
    async (subscription: Subscription) => {
      if (!userId) return false

      setSyncStatus('syncing')
      try {
        const success = await syncSubscriptionToSupabase(subscription, userId)
        if (success) {
          setData((prev) => ({
            ...prev,
            subscriptions: prev.subscriptions.some((s) => s.id === subscription.id)
              ? prev.subscriptions.map((s) => (s.id === subscription.id ? subscription : s))
              : [...prev.subscriptions, subscription],
          }))
          await logSyncAction(userId, 'upsert', 'subscription', subscription.id)
          setLastSyncTime(Date.now())
          setSyncStatus('synced')
          return true
        }
        setSyncStatus('error')
        return false
      } catch (error) {
        console.error('[SubSentry] Sync subscription error:', error)
        setSyncStatus('error')
        return false
      }
    },
    [userId]
  )

  // Delete subscription from both local and cloud
  const removeSubscription = useCallback(
    async (subscriptionId: string) => {
      if (!userId) return false

      setSyncStatus('syncing')
      try {
        const success = await deleteSubscriptionFromSupabase(subscriptionId)
        if (success) {
          setData((prev) => ({
            ...prev,
            subscriptions: prev.subscriptions.filter((s) => s.id !== subscriptionId),
          }))
          await logSyncAction(userId, 'delete', 'subscription', subscriptionId)
          setLastSyncTime(Date.now())
          setSyncStatus('synced')
          return true
        }
        setSyncStatus('error')
        return false
      } catch (error) {
        console.error('[SubSentry] Remove subscription error:', error)
        setSyncStatus('error')
        return false
      }
    },
    [userId]
  )

  // Sync insights
  const updateInsights = useCallback(
    async (insights: SmartInsights) => {
      if (!userId) return false

      try {
        const success = await syncInsightsToSupabase(insights, userId)
        if (success) {
          setData((prev) => ({
            ...prev,
            insights,
          }))
          return true
        }
        return false
      } catch (error) {
        console.error('[SubSentry] Update insights error:', error)
        return false
      }
    },
    [userId]
  )

  return {
    data,
    subscriptions: data.subscriptions,
    user: data.user,
    insights: data.insights,
    syncStatus,
    lastSyncTime,
    isLoading,
    syncSubscription,
    removeSubscription,
    updateInsights,
  }
}
