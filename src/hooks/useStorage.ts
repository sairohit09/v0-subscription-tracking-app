/**
 * React hook for managing SubSentry storage with reactivity
 */

import { useState, useCallback, useEffect } from 'react'
import {
  getStorageData,
  saveStorageData,
  getUser,
  saveUser,
  getSubscriptions,
  getSubscription,
  saveSubscription,
  deleteSubscription,
  getInsights,
  saveInsights,
  exportData,
  importData,
  clearAllData,
  getStorageStats,
} from '@/src/utils/storage'
import {
  StorageSchema,
  UserProfile,
  Subscription,
  SmartInsights,
} from '@/src/types'

export function useStorage() {
  const [data, setData] = useState<StorageSchema>(defaultSchema)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Initialize storage on mount
  useEffect(() => {
    try {
      const stored = getStorageData()
      setData(stored)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // User management
  const updateUser = useCallback((user: UserProfile) => {
    if (saveUser(user)) {
      setData((prev) => ({ ...prev, user }))
      return true
    }
    return false
  }, [])

  // Subscription management
  const addSubscription = useCallback((subscription: Subscription) => {
    if (saveSubscription(subscription)) {
      setData((prev) => ({
        ...prev,
        subscriptions: [...prev.subscriptions, subscription],
      }))
      return true
    }
    return false
  }, [])

  const updateSubscription = useCallback((subscription: Subscription) => {
    if (saveSubscription(subscription)) {
      setData((prev) => ({
        ...prev,
        subscriptions: prev.subscriptions.map((s) =>
          s.id === subscription.id ? subscription : s
        ),
      }))
      return true
    }
    return false
  }, [])

  const removeSubscription = useCallback((subscriptionId: string) => {
    if (deleteSubscription(subscriptionId)) {
      setData((prev) => ({
        ...prev,
        subscriptions: prev.subscriptions.filter((s) => s.id !== subscriptionId),
      }))
      return true
    }
    return false
  }, [])

  // Insights management
  const updateInsights = useCallback((insights: SmartInsights) => {
    if (saveInsights(insights)) {
      setData((prev) => ({ ...prev, insights }))
      return true
    }
    return false
  }, [])

  // Data operations
  const handleExport = useCallback(() => {
    exportData()
  }, [])

  const handleImport = useCallback((file: File) => {
    return importData(file).then((success) => {
      if (success) {
        const updated = getStorageData()
        setData(updated)
      }
      return success
    })
  }, [])

  const handleClear = useCallback(() => {
    if (clearAllData()) {
      setData(defaultSchema)
      return true
    }
    return false
  }, [])

  return {
    // Data
    data,
    user: data.user,
    subscriptions: data.subscriptions,
    insights: data.insights,
    
    // State
    isLoading,
    error,
    
    // User operations
    updateUser,
    
    // Subscription operations
    addSubscription,
    updateSubscription,
    removeSubscription,
    
    // Insights operations
    updateInsights,
    
    // Data operations
    export: handleExport,
    import: handleImport,
    clear: handleClear,
    
    // Helpers
    getStats: getStorageStats,
  }
}

const defaultSchema: StorageSchema = {
  version: 1,
  lastMigrated: Date.now(),
  user: null,
  subscriptions: [],
  insights: null,
}
