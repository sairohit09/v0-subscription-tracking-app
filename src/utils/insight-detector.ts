/**
 * Algorithms to detect various insight opportunities from subscription data
 */

import { Subscription } from '@/src/types'
import { Insight, InsightType, InsightPriority } from '@/src/types/insights'
import { v4 as uuidv4 } from 'crypto'
import { calculateMonthlyCost } from './metrics-calculator'

interface InsightRaw {
  type: InsightType
  priority: InsightPriority
  title: string
  description: string
  estimatedSavings: number
  relatedSubscriptionIds: string[]
  metadata: Record<string, unknown>
}

/**
 * Detects duplicate services in the same category
 * e.g., Netflix + Amazon Prime (both streaming)
 */
export function detectDuplicateServices(subscriptions: Subscription[]): InsightRaw[] {
  const insights: InsightRaw[] = []
  const categoryGroups: Record<string, Subscription[]> = {}

  // Group subscriptions by category
  subscriptions.forEach((sub) => {
    if (!sub.isActive) return
    const category = sub.metadata.category
    if (!categoryGroups[category]) {
      categoryGroups[category] = []
    }
    categoryGroups[category].push(sub)
  })

  // Find categories with multiple subscriptions
  Object.entries(categoryGroups).forEach(([category, subs]) => {
    if (subs.length >= 2) {
      // Sort by usage to identify most and least used
      const sorted = [...subs].sort((a, b) => {
        const aUsage = a.usage.totalMinutesThisMonth
        const bUsage = b.usage.totalMinutesThisMonth
        return bUsage - aUsage
      })

      const mostUsed = sorted[0]
      const others = sorted.slice(1)

      const totalSavings = others.reduce((sum, sub) => {
        return sum + calculateMonthlyCost(sub.cost, sub.frequency) * 100 // Convert to cents
      }, 0)

      insights.push({
        type: 'duplicate_services',
        priority: 'high',
        title: `Consolidate ${category} services`,
        description: `You have ${subs.length} ${category} subscriptions: ${subs.map((s) => s.name).join(', ')}. Consider keeping only the most-used one (${mostUsed.name}).`,
        estimatedSavings: Math.round(totalSavings),
        relatedSubscriptionIds: others.map((s) => s.id),
        metadata: {
          category,
          mostUsedService: mostUsed.name,
          duplicateCount: subs.length,
        },
      })
    }
  })

  return insights
}

/**
 * Detects unused subscriptions (no activity in 30+ days)
 */
export function detectUnusedSubscriptions(subscriptions: Subscription[]): InsightRaw[] {
  const insights: InsightRaw[] = []
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000

  subscriptions.forEach((sub) => {
    if (!sub.isActive) return

    const lastUsed = sub.usage.lastUsedDate
    if (!lastUsed || lastUsed < thirtyDaysAgo) {
      const monthlyCost = calculateMonthlyCost(sub.cost, sub.frequency) * 100 // cents
      const daysUnused = lastUsed ? Math.floor((Date.now() - lastUsed) / (24 * 60 * 60 * 1000)) : null

      insights.push({
        type: 'unused_subscription',
        priority: 'high',
        title: `${sub.name} appears unused`,
        description: daysUnused
          ? `No activity for ${daysUnused} days. Consider cancelling to save ${(monthlyCost / 100).toFixed(2)}/month.`
          : `No usage data recorded. Consider reviewing or cancelling this subscription.`,
        estimatedSavings: Math.round(monthlyCost),
        relatedSubscriptionIds: [sub.id],
        metadata: {
          daysUnused,
          lastUsedDate: lastUsed,
        },
      })
    }
  })

  return insights
}

/**
 * Detects annual vs monthly savings opportunities
 */
export function detectAnnualSavings(subscriptions: Subscription[]): InsightRaw[] {
  const insights: InsightRaw[] = []
  const monthlyBilled = subscriptions.filter(
    (s) => s.isActive && s.frequency === 'monthly'
  )

  if (monthlyBilled.length === 0) return insights

  const savingsBySwitch = monthlyBilled.reduce((sum, sub) => {
    const monthlyPrice = sub.cost
    // Assume ~20% discount if annual (typical industry standard)
    const annualDiscount = Math.round(monthlyPrice * 12 * 0.2)
    return sum + annualDiscount
  }, 0)

  if (savingsBySwitch > 0) {
    insights.push({
      type: 'annual_savings',
      priority: 'medium',
      title: 'Switch to annual billing to save',
      description: `You have ${monthlyBilled.length} services on monthly billing. Switching to annual could save approximately $${(savingsBySwitch / 100).toFixed(2)}/year (20% typical discount).`,
      estimatedSavings: savingsBySwitch,
      relatedSubscriptionIds: monthlyBilled.map((s) => s.id),
      metadata: {
        monthlyBilledCount: monthlyBilled.length,
        potentialAnnualSavings: savingsBySwitch,
      },
    })
  }

  return insights
}

/**
 * Detects price anomalies (sudden cost increases)
 */
export function detectPriceAnomalies(subscriptions: Subscription[]): InsightRaw[] {
  const insights: InsightRaw[] = []

  // In a real app, you'd track price history. For now, we'll detect:
  // 1. Subscriptions with very high costs
  // 2. Subscriptions approaching renewal (price might increase)

  subscriptions.forEach((sub) => {
    if (!sub.isActive) return

    const monthlyCost = calculateMonthlyCost(sub.cost, sub.frequency)

    // Detect unusually high costs (e.g., over $50/month)
    if (monthlyCost > 5000) { // 5000 cents = $50
      const daysUntilRenewal = Math.ceil((sub.renewalDate - Date.now()) / (24 * 60 * 60 * 1000))

      insights.push({
        type: 'price_anomaly',
        priority: daysUntilRenewal < 7 ? 'high' : 'medium',
        title: `High-cost subscription: ${sub.name}`,
        description: `This subscription costs $${(monthlyCost / 100).toFixed(2)}/month and renews in ${daysUntilRenewal} days. Review if the value justifies the cost.`,
        estimatedSavings: 0, // Not a direct saving, but review opportunity
        relatedSubscriptionIds: [sub.id],
        metadata: {
          monthlyPrice: monthlyCost,
          daysUntilRenewal,
        },
      })
    }
  })

  return insights
}

/**
 * Detects free trials expiring soon
 */
export function detectTrialsExpiring(subscriptions: Subscription[]): InsightRaw[] {
  const insights: InsightRaw[] = []
  const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000

  subscriptions.forEach((sub) => {
    if (!sub.isActive || !sub.tags.includes('trial')) return

    // If trial tag is set and renewal is approaching, alert
    if (sub.renewalDate < sevenDaysFromNow && sub.renewalDate > Date.now()) {
      const daysRemaining = Math.ceil((sub.renewalDate - Date.now()) / (24 * 60 * 60 * 1000))
      const monthlyCost = calculateMonthlyCost(sub.cost, sub.frequency) * 100 // cents

      insights.push({
        type: 'free_trial_expiring',
        priority: daysRemaining <= 1 ? 'high' : 'medium',
        title: `${sub.name} trial expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
        description: `Your free trial ends ${new Date(sub.renewalDate).toLocaleDateString()}. You'll be charged $${(monthlyCost / 100).toFixed(2)} if not cancelled.`,
        estimatedSavings: monthlyCost,
        relatedSubscriptionIds: [sub.id],
        metadata: {
          daysRemaining,
          expiryDate: sub.renewalDate,
        },
      })
    }
  })

  return insights
}

/**
 * Main insight generator - runs all detectors
 */
export function generateInsights(
  userId: string,
  subscriptions: Subscription[]
): Insight[] {
  const allRawInsights: InsightRaw[] = [
    ...detectDuplicateServices(subscriptions),
    ...detectUnusedSubscriptions(subscriptions),
    ...detectAnnualSavings(subscriptions),
    ...detectPriceAnomalies(subscriptions),
    ...detectTrialsExpiring(subscriptions),
  ]

  // Convert to full Insight objects
  return allRawInsights.map((raw) => ({
    id: uuidv4(),
    userId,
    type: raw.type,
    priority: raw.priority,
    title: raw.title,
    description: raw.description,
    estimatedSavings: raw.estimatedSavings,
    relatedSubscriptionIds: raw.relatedSubscriptionIds,
    actionButtons: getActionButtonsForType(raw.type),
    createdAt: Date.now(),
    expiresAt: getExpiryDate(raw.type),
    metadata: raw.metadata,
  }))
}

/**
 * Returns appropriate action buttons for each insight type
 */
function getActionButtonsForType(type: InsightType) {
  const actionMap: Record<InsightType, any[]> = {
    duplicate_services: [
      { type: 'review', label: 'Review', color: 'secondary' },
      { type: 'switch', label: 'Switch to best', color: 'primary' },
    ],
    unused_subscription: [
      { type: 'pause', label: 'Pause', color: 'secondary' },
      { type: 'cancel', label: 'Cancel', color: 'danger' },
    ],
    annual_savings: [
      { type: 'upgrade', label: 'Switch to annual', color: 'primary' },
    ],
    price_anomaly: [
      { type: 'review', label: 'Review', color: 'secondary' },
      { type: 'cancel', label: 'Cancel', color: 'danger' },
    ],
    free_trial_expiring: [
      { type: 'review', label: 'Review', color: 'secondary' },
      { type: 'cancel', label: 'Cancel free', color: 'danger' },
    ],
  }

  return actionMap[type] || []
}

/**
 * Determines when an insight expires
 */
function getExpiryDate(type: InsightType): number {
  const expiryDays: Record<InsightType, number> = {
    duplicate_services: 30,
    unused_subscription: 14,
    annual_savings: 60,
    price_anomaly: 30,
    free_trial_expiring: 1,
  }

  const days = expiryDays[type] || 30
  return Date.now() + days * 24 * 60 * 60 * 1000
}
