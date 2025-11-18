/**
 * Helper functions to create and manage subscriptions
 * Provides factory methods with sensible defaults
 */

import { Subscription, SubscriptionFrequency, SubscriptionTag, SubscriptionCategory } from '@/src/types'
import { v4 as uuidv4 } from 'crypto'

interface CreateSubscriptionInput {
  userId: string
  name: string
  cost: number // in cents
  frequency: SubscriptionFrequency
  renewalDate: number
  category: SubscriptionCategory
  color?: string
  tags?: SubscriptionTag[]
  notes?: string
  websiteUrl?: string
  isActive?: boolean
}

/**
 * Creates a new subscription with proper defaults
 */
export function createSubscription(input: CreateSubscriptionInput): Subscription {
  const now = Date.now()

  return {
    id: uuidv4(),
    userId: input.userId,
    name: input.name,
    cost: input.cost,
    frequency: input.frequency,
    renewalDate: input.renewalDate,
    createdAt: now,
    updatedAt: now,
    
    usage: {
      lastUsedDate: null,
      dailyUsage: [],
      totalMinutesThisMonth: 0,
    },
    
    tags: input.tags || [],
    notes: input.notes,
    
    metadata: {
      category: input.category,
      color: input.color || '#6366f1',
      websiteUrl: input.websiteUrl,
    },
    
    isActive: input.isActive !== false,
  }
}

/**
 * Records usage for a subscription
 */
export function recordUsage(
  subscription: Subscription,
  minutes: number,
  date: string = new Date().toISOString().split('T')[0]
): Subscription {
  const updated = { ...subscription }
  updated.usage.lastUsedDate = Date.now()

  // Find or create daily usage entry
  const existingIndex = updated.usage.dailyUsage.findIndex((d) => d.date === date)

  if (existingIndex >= 0) {
    updated.usage.dailyUsage[existingIndex].minutes += minutes
  } else {
    updated.usage.dailyUsage.push({ date, minutes })
  }

  // Keep only last 90 days
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const cutoffDate = ninetyDaysAgo.toISOString().split('T')[0]

  updated.usage.dailyUsage = updated.usage.dailyUsage.filter((d) => d.date >= cutoffDate)

  // Calculate monthly total
  const currentDate = new Date()
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

  updated.usage.totalMinutesThisMonth = updated.usage.dailyUsage
    .filter((d) => d.date.startsWith(currentMonth))
    .reduce((sum, d) => sum + d.minutes, 0)

  updated.updatedAt = Date.now()

  return updated
}

/**
 * Marks a subscription as used today
 */
export function markAsUsedToday(subscription: Subscription): Subscription {
  return recordUsage(subscription, 1) // Record 1 minute as "used"
}

/**
 * Adds a tag to a subscription
 */
export function addTag(subscription: Subscription, tag: SubscriptionTag): Subscription {
  const updated = { ...subscription }
  if (!updated.tags.includes(tag)) {
    updated.tags.push(tag)
    updated.updatedAt = Date.now()
  }
  return updated
}

/**
 * Removes a tag from a subscription
 */
export function removeTag(subscription: Subscription, tag: SubscriptionTag): Subscription {
  const updated = { ...subscription }
  updated.tags = updated.tags.filter((t) => t !== tag)
  updated.updatedAt = Date.now()
  return updated
}

/**
 * Cancels a subscription
 */
export function cancelSubscription(subscription: Subscription): Subscription {
  const updated = { ...subscription }
  updated.isActive = false
  updated.cancelledAt = Date.now()
  updated.updatedAt = Date.now()
  return updated
}

/**
 * Converts subscription cost to different frequencies
 */
export function convertCostToFrequency(
  cost: number,
  fromFrequency: SubscriptionFrequency,
  toFrequency: SubscriptionFrequency
): number {
  // Convert to monthly first
  let monthlyValue: number

  switch (fromFrequency) {
    case 'daily':
      monthlyValue = cost * 365 / 12
      break
    case 'weekly':
      monthlyValue = cost * 52 / 12
      break
    case 'monthly':
      monthlyValue = cost
      break
    case 'quarterly':
      monthlyValue = cost / 3
      break
    case 'biannual':
      monthlyValue = cost / 6
      break
    case 'yearly':
      monthlyValue = cost / 12
      break
  }

  // Convert from monthly to target frequency
  switch (toFrequency) {
    case 'daily':
      return monthlyValue / 30.44
    case 'weekly':
      return monthlyValue * 12 / 52
    case 'monthly':
      return monthlyValue
    case 'quarterly':
      return monthlyValue * 3
    case 'biannual':
      return monthlyValue * 6
    case 'yearly':
      return monthlyValue * 12
  }
}
