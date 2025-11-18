/**
 * Helper functions for subscription calculations and formatting
 */

import type { Subscription, DailyUsage } from '../types/index'

export function getDaysUntilRenewal(renewalDate: number): number {
  const now = Date.now()
  const daysMs = 24 * 60 * 60 * 1000
  return Math.ceil((renewalDate - now) / daysMs)
}

export function formatRenewalDate(renewalDate: number): string {
  const date = new Date(renewalDate)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getRenewalUrgency(daysUntilRenewal: number): 'high' | 'medium' | 'low' {
  if (daysUntilRenewal <= 0) return 'high'
  if (daysUntilRenewal <= 3) return 'high'
  if (daysUntilRenewal <= 7) return 'medium'
  return 'low'
}

export function getUrgencyColor(urgency: 'high' | 'medium' | 'low'): string {
  switch (urgency) {
    case 'high':
      return '#EF4444' // red
    case 'medium':
      return '#F59E0B' // amber
    case 'low':
      return '#10B981' // green
  }
}

export function getLastUsedLabel(lastUsedDate: number | null): string {
  if (!lastUsedDate) return 'Never used'

  const now = Date.now()
  const diffMs = now - lastUsedDate
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))

  if (diffDays === 0) return 'Used today'
  if (diffDays === 1) return 'Used yesterday'
  if (diffDays < 7) return `Used ${diffDays}d ago`
  if (diffDays < 30) return `Used ${Math.floor(diffDays / 7)}w ago`
  return `Used ${Math.floor(diffDays / 30)}m ago`
}

export function getUsageIndicator(usage: DailyUsage[]): 'active' | 'inactive' | 'unused' {
  if (!usage || usage.length === 0) return 'unused'

  // Get last 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentUsage = usage.filter((u) => new Date(u.date).getTime() > sevenDaysAgo)

  const totalMinutes = recentUsage.reduce((sum, u) => sum + u.minutes, 0)

  if (totalMinutes === 0) return 'inactive'
  if (totalMinutes < 30) return 'inactive'
  return 'active'
}

export function formatCost(cost: number, frequency: string): string {
  const dollars = cost / 100
  const frequencies: Record<string, string> = {
    daily: '/day',
    weekly: '/week',
    monthly: '/month',
    quarterly: '/3mo',
    yearly: '/year',
    annual: '/year',
    biannual: '/2yr',
  }
  return `$${dollars.toFixed(2)}${frequencies[frequency] || ''}`
}
