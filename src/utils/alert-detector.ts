/**
 * Alert detection algorithms that analyze subscriptions and generate alerts
 */

import { Subscription, SubscriptionFrequency } from '@/src/types'
import { Alert, AlertType, AlertPriority } from '@/src/types/alerts'
import { getDaysUntilRenewal } from './subscription-helpers'

/**
 * Converts subscription frequency to number of days
 */
function frequencyToDays(frequency: SubscriptionFrequency): number {
  const map: Record<SubscriptionFrequency, number> = {
    daily: 1,
    weekly: 7,
    monthly: 30,
    quarterly: 90,
    biannual: 180,
    yearly: 365,
  }
  return map[frequency]
}

/**
 * Detects renewal reminders (customizable days before)
 */
export function detectRenewalAlerts(
  subscriptions: Subscription[],
  daysBeforeDue: number = 7
): Alert[] {
  return subscriptions
    .filter((sub) => sub.isActive)
    .map((sub) => {
      const daysUntil = getDaysUntilRenewal(sub.renewalDate)

      if (daysUntil > 0 && daysUntil <= daysBeforeDue) {
        return {
          id: `renewal-${sub.id}-${Date.now()}`,
          userId: sub.userId,
          type: 'renewal_reminder' as AlertType,
          priority: daysUntil <= 3 ? ('high' as AlertPriority) : ('medium' as AlertPriority),
          status: 'active' as const,
          title: `${sub.name} renews in ${daysUntil} days`,
          description: `Your ${sub.name} subscription will renew on ${new Date(sub.renewalDate).toLocaleDateString()}`,
          message: `Time to review your ${sub.name} subscription. Renews in ${daysUntil} days for $${(sub.cost / 100).toFixed(2)}.`,
          relatedSubscriptionIds: [sub.id],
          affectedAmount: sub.cost,
          createdAt: Date.now(),
          dueDate: sub.renewalDate,
          metadata: {
            subscriptionName: sub.name,
            frequency: sub.frequency,
          },
        }
      }

      return null
    })
    .filter((alert): alert is Alert => alert !== null)
}

/**
 * Detects unused subscriptions (no usage in X days)
 */
export function detectUnusedAlerts(
  subscriptions: Subscription[],
  daysUnused: number = 30
): Alert[] {
  const now = Date.now()
  const threshold = now - daysUnused * 24 * 60 * 60 * 1000

  return subscriptions
    .filter((sub) => sub.isActive && (!sub.usage.lastUsedDate || sub.usage.lastUsedDate < threshold))
    .map((sub) => {
      const daysSinceUsed = sub.usage.lastUsedDate
        ? Math.floor((now - sub.usage.lastUsedDate) / (24 * 60 * 60 * 1000))
        : daysUnused

      // Calculate monthly cost for savings calculation
      const monthlyEquivalent = 
        sub.frequency === 'yearly' ? sub.cost / 12 :
        sub.frequency === 'weekly' ? (sub.cost * 52) / 12 :
        sub.frequency === 'daily' ? (sub.cost * 365) / 12 :
        sub.cost

      return {
        id: `unused-${sub.id}-${Date.now()}`,
        userId: sub.userId,
        type: 'unused_service' as AlertType,
        priority: daysSinceUsed > 60 ? ('high' as AlertPriority) : ('medium' as AlertPriority),
        status: 'active' as const,
        title: `${sub.name} hasn't been used in ${daysSinceUsed} days`,
        description: `You haven't used ${sub.name} since ${sub.usage.lastUsedDate ? new Date(sub.usage.lastUsedDate).toLocaleDateString() : 'never'}`,
        message: `Consider pausing or cancelling ${sub.name} to save $${(monthlyEquivalent / 100).toFixed(2)}/month.`,
        relatedSubscriptionIds: [sub.id],
        estimatedSavings: monthlyEquivalent,
        createdAt: Date.now(),
        metadata: {
          subscriptionName: sub.name,
          daysSinceUsed,
        },
      }
    })
}

/**
 * Detects free trials ending soon
 */
export function detectTrialExpiringAlerts(
  subscriptions: Subscription[],
  daysBefore: number = 3
): Alert[] {
  return subscriptions
    .filter((sub) => sub.tags.includes('trial'))
    .map((sub) => {
      const daysUntil = getDaysUntilRenewal(sub.renewalDate)

      if (daysUntil > 0 && daysUntil <= daysBefore) {
        return {
          id: `trial-${sub.id}-${Date.now()}`,
          userId: sub.userId,
          type: 'trial_expiring' as AlertType,
          priority: 'high' as AlertPriority,
          status: 'active' as const,
          title: `${sub.name} trial ends in ${daysUntil} days`,
          description: `Your free trial for ${sub.name} expires on ${new Date(sub.renewalDate).toLocaleDateString()}`,
          message: `Your ${sub.name} trial ends soon. It will charge $${(sub.cost / 100).toFixed(2)} after trial ends.`,
          relatedSubscriptionIds: [sub.id],
          affectedAmount: sub.cost,
          createdAt: Date.now(),
          dueDate: sub.renewalDate,
          metadata: {
            subscriptionName: sub.name,
          },
        }
      }

      return null
    })
    .filter((alert): alert is Alert => alert !== null)
}

/**
 * Detects renewal today
 */
export function detectRenewalTodayAlerts(subscriptions: Subscription[]): Alert[] {
  return subscriptions
    .filter((sub) => {
      const daysUntil = getDaysUntilRenewal(sub.renewalDate)
      return daysUntil === 0
    })
    .map((sub) => ({
      id: `renewal-today-${sub.id}-${Date.now()}`,
      userId: sub.userId,
      type: 'renewal_today' as AlertType,
      priority: 'critical' as AlertPriority,
      status: 'active' as const,
      title: `${sub.name} renews TODAY`,
      description: `Your ${sub.name} subscription renews today`,
      message: `${sub.name} will charge $${(sub.cost / 100).toFixed(2)} today. Review or cancel now if needed.`,
      relatedSubscriptionIds: [sub.id],
      affectedAmount: sub.cost,
      createdAt: Date.now(),
      dueDate: sub.renewalDate,
      metadata: {
        subscriptionName: sub.name,
        frequency: sub.frequency,
      },
    }))
}

/**
 * Detects duplicate services in same category (potential consolidation)
 */
export function detectDuplicateServiceAlerts(subscriptions: Subscription[]): Alert[] {
  const categorized = new Map<string, Subscription[]>()

  subscriptions
    .filter((sub) => sub.isActive)
    .forEach((sub) => {
      const cat = sub.metadata.category
      if (!categorized.has(cat)) {
        categorized.set(cat, [])
      }
      categorized.get(cat)!.push(sub)
    })

  const alerts: Alert[] = []

  categorized.forEach((subs, category) => {
    if (subs.length > 1) {
      const totalCost = subs.reduce((sum, s) => {
        const monthlyEquivalent = 
          s.frequency === 'yearly' ? s.cost / 12 :
          s.frequency === 'weekly' ? (s.cost * 52) / 12 :
          s.frequency === 'daily' ? (s.cost * 365) / 12 :
          s.cost
        return sum + monthlyEquivalent
      }, 0)

      // Assume keeping cheapest, cancel others
      const sorted = [...subs].sort((a, b) => a.cost - b.cost)
      const cheapest = sorted[0]
      const savingsOpportunity = totalCost - (
        cheapest.frequency === 'yearly' ? cheapest.cost / 12 :
        cheapest.frequency === 'weekly' ? (cheapest.cost * 52) / 12 :
        cheapest.frequency === 'daily' ? (cheapest.cost * 365) / 12 :
        cheapest.cost
      )

      alerts.push({
        id: `duplicate-${category}-${Date.now()}`,
        userId: subs[0].userId,
        type: 'price_increase' as AlertType, // Using this for consolidation
        priority: 'medium' as AlertPriority,
        status: 'active' as const,
        title: `You have ${subs.length} ${category} subscriptions`,
        description: `Consider consolidating your ${category} services to save money`,
        message: `You're subscribed to ${subs.map((s) => s.name).join(', ')}. Keep ${cheapest.name} and cancel the others to save $${(savingsOpportunity / 100).toFixed(2)}/month.`,
        relatedSubscriptionIds: subs.map((s) => s.id),
        estimatedSavings: savingsOpportunity,
        createdAt: Date.now(),
        metadata: {
          category,
          duplicateCount: subs.length,
        },
      })
    }
  })

  return alerts
}

/**
 * Detects unusual spending patterns
 */
export function detectSpendingAnomalies(
  subscriptions: Subscription[],
  spendingThreshold: number = 10000 // $100/month in cents
): Alert[] {
  const monthlyTotal = subscriptions
    .filter((sub) => sub.isActive)
    .reduce((sum, sub) => {
      const monthlyEquivalent =
        sub.frequency === 'yearly' ? sub.cost / 12 :
        sub.frequency === 'weekly' ? (sub.cost * 52) / 12 :
        sub.frequency === 'daily' ? (sub.cost * 365) / 12 :
        sub.cost
      return sum + monthlyEquivalent
    }, 0)

  if (monthlyTotal > spendingThreshold) {
    return [
      {
        id: `spending-${Date.now()}`,
        userId: subscriptions[0]?.userId || '',
        type: 'unusual_spending' as AlertType,
        priority: monthlyTotal > spendingThreshold * 1.5 ? ('high' as AlertPriority) : ('medium' as AlertPriority),
        status: 'active' as const,
        title: 'High monthly spending detected',
        description: `Your total monthly subscriptions cost $${(monthlyTotal / 100).toFixed(2)}`,
        message: `You're spending $${(monthlyTotal / 100).toFixed(2)}/month on subscriptions. Consider reviewing unused services.`,
        relatedSubscriptionIds: subscriptions.map((s) => s.id),
        affectedAmount: monthlyTotal,
        createdAt: Date.now(),
        metadata: {
          totalMonthly: monthlyTotal,
        },
      },
    ]
  }

  return []
}

/**
 * Generates all relevant alerts for subscriptions
 */
export function generateAllAlerts(
  subscriptions: Subscription[],
  preferences?: {
    renewalDaysBefore?: number
    trialDaysBefore?: number
    unusedDays?: number
    spendingThreshold?: number
  }
): Alert[] {
  if (!subscriptions || subscriptions.length === 0) {
    return []
  }

  const defaults = {
    renewalDaysBefore: 7,
    trialDaysBefore: 3,
    unusedDays: 30,
    spendingThreshold: 10000,
    ...preferences,
  }

  return [
    ...detectRenewalTodayAlerts(subscriptions),
    ...detectRenewalAlerts(subscriptions, defaults.renewalDaysBefore),
    ...detectTrialExpiringAlerts(subscriptions, defaults.trialDaysBefore),
    ...detectUnusedAlerts(subscriptions, defaults.unusedDays),
    ...detectDuplicateServiceAlerts(subscriptions),
    ...detectSpendingAnomalies(subscriptions, defaults.spendingThreshold),
  ]
}
