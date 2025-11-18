import { Subscription } from './storage'

export interface BillingFrequencyMap {
  weekly: number
  monthly: number
  quarterly: number
  annual: number
}

// Convert different billing frequencies to monthly cost
const FREQUENCY_MULTIPLIERS: BillingFrequencyMap = {
  weekly: 4.33, // Average weeks per month
  monthly: 1,
  quarterly: 0.33, // 1/3 of a month
  annual: 1 / 12,
}

/**
 * Calculate monthly cost from subscription cost and frequency
 */
export function calculateMonthlyCost(
  cost: number,
  frequency: keyof BillingFrequencyMap,
): number {
  const multiplier = FREQUENCY_MULTIPLIERS[frequency] || 1
  return cost * multiplier
}

/**
 * Calculate annual cost from monthly cost
 */
export function calculateAnnualCost(monthlyCost: number): number {
  return monthlyCost * 12
}

/**
 * Calculate potential savings from switching to annual plans
 */
export function calculatePotentialSavings(
  subscriptions: Subscription[],
): number {
  const monthlyBilling = subscriptions.filter(
    (s) => s.billingFrequency === 'monthly',
  )

  const savingsPerSubscription = monthlyBilling.reduce((total, sub) => {
    const monthlyCost = calculateMonthlyCost(sub.cost, 'monthly')
    const annualIfMonthly = monthlyCost * 12
    const annualIfAnnual = calculateMonthlyCost(sub.cost, 'annual')
    return total + (annualIfMonthly - annualIfAnnual)
  }, 0)

  return savingsPerSubscription
}

/**
 * Count subscriptions unused for more than 30 days
 */
export function countUnusedServices(subscriptions: Subscription[]): number {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000

  return subscriptions.filter((sub) => {
    if (!sub.usageTracking.lastUsedDate) return true
    return new Date(sub.usageTracking.lastUsedDate).getTime() < thirtyDaysAgo
  }).length
}

/**
 * Calculate percentage trend (previous month vs current month)
 */
export function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

/**
 * Generate trend data with direction and color
 */
export function getTrendData(
  trendPercentage: number,
  isPositiveGood: boolean = false,
): {
  direction: 'up' | 'down' | 'neutral'
  percentage: number
  color: 'success' | 'error' | 'neutral'
} {
  const direction = trendPercentage > 0 ? 'up' : trendPercentage < 0 ? 'down' : 'neutral'
  const isGood = isPositiveGood ? trendPercentage <= 0 : trendPercentage >= 0

  return {
    direction,
    percentage: Math.abs(trendPercentage),
    color: direction === 'neutral' ? 'neutral' : isGood ? 'success' : 'error',
  }
}

/**
 * Calculate all dashboard statistics
 */
export function calculateDashboardStats(subscriptions: Subscription[]) {
  const activeSubscriptions = subscriptions.filter((s) => !s.isActive === false)

  // Monthly cost calculation
  const monthlyCost = activeSubscriptions.reduce((total, sub) => {
    return total + calculateMonthlyCost(sub.cost, sub.billingFrequency)
  }, 0)

  // Annual cost calculation
  const annualCost = calculateAnnualCost(monthlyCost)

  // Unused services
  const unusedServices = countUnusedServices(activeSubscriptions)

  // Potential savings
  const potentialSavings = calculatePotentialSavings(activeSubscriptions)

  // Trends (for demo, we'll simulate month-over-month)
  // In a real app, you'd compare with previous month's data
  const monthlyTrend = calculateTrend(monthlyCost, monthlyCost * 0.95) // Assume 5% increase
  const annualTrend = calculateTrend(annualCost, annualCost * 0.95)
  const unusedTrend = calculateTrend(unusedServices, Math.max(1, unusedServices - 1))

  return {
    totalSubscriptions: activeSubscriptions.length,
    monthlyCost,
    monthlyTrend,
    annualCost,
    annualTrend,
    unusedServices,
    unusedTrend,
    potentialSavings,
  }
}
