/**
 * Local storage management with validation, migration, and backup/export
 */

import {
  StorageSchema,
  UserProfile,
  Subscription,
  SmartInsights,
  BackupData,
} from '@/src/types'

export type { Subscription }

const STORAGE_KEY = 'subsentry_data'
const CURRENT_VERSION = 1

const defaultSchema: StorageSchema = {
  version: CURRENT_VERSION,
  lastMigrated: Date.now(),
  user: null,
  subscriptions: [],
  insights: null,
}

/**
 * Validates subscription data structure
 */
function validateSubscription(data: unknown): data is Subscription {
  if (!data || typeof data !== 'object') return false

  const sub = data as Record<string, unknown>
  return (
    typeof sub.id === 'string' &&
    typeof sub.userId === 'string' &&
    typeof sub.name === 'string' &&
    typeof sub.cost === 'number' &&
    ['monthly', 'yearly', 'weekly', 'daily', 'quarterly', 'biannual'].includes(
      sub.frequency as string
    ) &&
    typeof sub.renewalDate === 'number' &&
    Array.isArray(sub.tags) &&
    typeof sub.isActive === 'boolean' &&
    sub.metadata !== null &&
    typeof sub.metadata === 'object'
  )
}

/**
 * Validates user profile data
 */
function validateUserProfile(data: unknown): data is UserProfile {
  if (!data || typeof data !== 'object') return false

  const user = data as Record<string, unknown>
  return (
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.name === 'string' &&
    typeof user.createdAt === 'number' &&
    typeof user.updatedAt === 'number' &&
    user.preferences !== null &&
    typeof user.preferences === 'object'
  )
}

/**
 * Validates entire storage schema
 */
function validateStorageSchema(data: unknown): data is StorageSchema {
  if (!data || typeof data !== 'object') return false

  const schema = data as Record<string, unknown>
  return (
    typeof schema.version === 'number' &&
    typeof schema.lastMigrated === 'number' &&
    (schema.user === null || validateUserProfile(schema.user)) &&
    Array.isArray(schema.subscriptions) &&
    schema.subscriptions.every(validateSubscription)
  )
}

/**
 * Handles data migration between versions
 */
function migrateData(data: unknown): StorageSchema {
  if (!validateStorageSchema(data)) {
    console.warn('[SubSentry] Invalid storage data, resetting to default')
    return { ...defaultSchema }
  }

  const schema = data as StorageSchema

  // Migration logic for future versions
  if (schema.version < CURRENT_VERSION) {
    console.log(`[SubSentry] Migrating from version ${schema.version} to ${CURRENT_VERSION}`)
    // Add migration steps here as versions increase
  }

  return {
    ...schema,
    version: CURRENT_VERSION,
    lastMigrated: Date.now(),
  }
}

/**
 * Retrieves all data from storage
 */
export function getStorageData(): StorageSchema {
  try {
    if (typeof window === 'undefined') {
      return { ...defaultSchema }
    }

    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return { ...defaultSchema }
    }

    const parsed = JSON.parse(stored)
    return migrateData(parsed)
  } catch (error) {
    console.error('[SubSentry] Error reading storage:', error)
    return { ...defaultSchema }
  }
}

/**
 * Saves data to storage with validation
 */
export function saveStorageData(data: StorageSchema): boolean {
  try {
    if (typeof window === 'undefined') {
      return false
    }

    if (!validateStorageSchema(data)) {
      console.error('[SubSentry] Invalid data structure, refusing to save')
      return false
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('[SubSentry] Error saving storage:', error)
    return false
  }
}

/**
 * Saves user profile
 */
export function saveUser(user: UserProfile): boolean {
  const data = getStorageData()
  data.user = user
  data.updatedAt = Date.now()
  return saveStorageData(data)
}

/**
 * Gets current user
 */
export function getUser(): UserProfile | null {
  return getStorageData().user
}

/**
 * Adds or updates a subscription
 */
export function saveSubscription(subscription: Subscription): boolean {
  const data = getStorageData()
  const index = data.subscriptions.findIndex((s) => s.id === subscription.id)

  if (index >= 0) {
    data.subscriptions[index] = subscription
  } else {
    data.subscriptions.push(subscription)
  }

  return saveStorageData(data)
}

/**
 * Gets all subscriptions for a user
 */
export function getSubscriptions(userId?: string): Subscription[] {
  const data = getStorageData()
  if (!userId) return data.subscriptions

  return data.subscriptions.filter((s) => s.userId === userId)
}

/**
 * Gets a single subscription
 */
export function getSubscription(subscriptionId: string): Subscription | null {
  const data = getStorageData()
  return data.subscriptions.find((s) => s.id === subscriptionId) || null
}

/**
 * Deletes a subscription
 */
export function deleteSubscription(subscriptionId: string): boolean {
  const data = getStorageData()
  data.subscriptions = data.subscriptions.filter((s) => s.id !== subscriptionId)
  return saveStorageData(data)
}

/**
 * Saves insights data
 */
export function saveInsights(insights: SmartInsights): boolean {
  const data = getStorageData()
  data.insights = insights
  return saveStorageData(data)
}

/**
 * Gets insights data
 */
export function getInsights(userId?: string): SmartInsights | null {
  const data = getStorageData()
  if (!data.insights) return null

  if (userId && data.insights.userId !== userId) {
    return null
  }

  return data.insights
}

/**
 * Exports all data as JSON file
 */
export function exportData(filename = 'subsentry-backup.json'): void {
  try {
    const data = getStorageData()

    const backup: BackupData = {
      version: data.version,
      exportedAt: Date.now(),
      user: data.user,
      subscriptions: data.subscriptions,
    }

    const json = JSON.stringify(backup, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('[SubSentry] Error exporting data:', error)
  }
}

/**
 * Imports data from a backup file
 */
export function importData(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const backup = JSON.parse(content) as BackupData

        if (!backup.version || !Array.isArray(backup.subscriptions)) {
          console.error('[SubSentry] Invalid backup file format')
          resolve(false)
          return
        }

        const data = getStorageData()

        // Merge or replace data (merge strategy: preserve user, add new subscriptions)
        if (backup.user && backup.user.id !== data.user?.id) {
          console.warn('[SubSentry] Different user in backup, skipping user data')
        }

        // Add new subscriptions that don't exist
        const existingIds = new Set(data.subscriptions.map((s) => s.id))
        for (const subscription of backup.subscriptions) {
          if (!existingIds.has(subscription.id)) {
            data.subscriptions.push(subscription)
          }
        }

        const success = saveStorageData(data)
        resolve(success)
      } catch (error) {
        console.error('[SubSentry] Error importing data:', error)
        resolve(false)
      }
    }

    reader.onerror = () => {
      console.error('[SubSentry] Error reading backup file')
      resolve(false)
    }

    reader.readAsText(file)
  })
}

/**
 * Clears all data (dangerous operation)
 */
export function clearAllData(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false
    }

    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('[SubSentry] Error clearing data:', error)
    return false
  }
}

/**
 * Gets storage stats
 */
export function getStorageStats() {
  const data = getStorageData()
  const subscriptions = data.subscriptions

  return {
    totalSubscriptions: subscriptions.length,
    activeSubscriptions: subscriptions.filter((s) => s.isActive).length,
    totalMonthlyCost: subscriptions.reduce((sum, s) => {
      if (s.frequency === 'monthly') return sum + s.cost
      if (s.frequency === 'yearly') return sum + s.cost / 12
      if (s.frequency === 'weekly') return sum + (s.cost * 52) / 12
      if (s.frequency === 'daily') return sum + (s.cost * 365) / 12
      return sum
    }, 0),
    storageSize: new Blob([JSON.stringify(data)]).size,
  }
}
