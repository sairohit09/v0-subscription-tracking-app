/**
 * Core TypeScript interfaces for SubSentry
 * Defines all data models for users, subscriptions, usage, and insights
 */

export type SubscriptionFrequency = 'monthly' | 'yearly' | 'weekly' | 'daily' | 'quarterly' | 'biannual'
export type SubscriptionTag = 'essential' | 'unused' | 'family-shared' | 'trial'
export type SubscriptionCategory = 
  | 'streaming' 
  | 'productivity' 
  | 'cloud-storage' 
  | 'entertainment' 
  | 'fitness' 
  | 'education' 
  | 'finance' 
  | 'other'

export interface UserProfile {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: number
  updatedAt: number
  preferences: {
    currency: string
    theme: 'light' | 'dark' | 'auto'
    notifications: boolean
  }
}

export interface DailyUsage {
  date: string // ISO date format YYYY-MM-DD
  minutes: number
}

export interface UsageTracking {
  lastUsedDate: number | null // timestamp
  dailyUsage: DailyUsage[] // last 90 days
  totalMinutesThisMonth: number
}

export interface ServiceMetadata {
  category: SubscriptionCategory
  color: string // hex color code
  logo?: string // URL to logo
  websiteUrl?: string
  description?: string
}

export interface Subscription {
  id: string
  userId: string
  name: string
  cost: number // in cents for precision
  frequency: SubscriptionFrequency
  renewalDate: number // timestamp
  createdAt: number
  updatedAt: number
  
  // Usage & engagement
  usage: UsageTracking
  
  // Organization & tagging
  tags: SubscriptionTag[]
  notes?: string
  
  // Service info
  metadata: ServiceMetadata
  
  // Status tracking
  isActive: boolean
  cancelledAt?: number
}

export interface SmartInsights {
  id: string
  userId: string
  generatedAt: number
  
  // Spending analysis
  totalMonthlyCost: number
  totalYearlyCost: number
  costTrend: 'increasing' | 'decreasing' | 'stable'
  
  // Usage patterns
  mostUsedServices: string[] // subscription IDs
  unusedServices: string[]
  potentialSavings: number // estimated savings from cancelling unused
  
  // Recommendations
  recommendations: Recommendation[]
}

export interface Recommendation {
  type: 'cancel' | 'consolidate' | 'explore-alternative' | 'shared-plan'
  subscriptionId: string
  title: string
  description: string
  estimatedSavings: number
  priority: 'high' | 'medium' | 'low'
}

export interface StorageSchema {
  version: number
  lastMigrated: number
  user: UserProfile | null
  subscriptions: Subscription[]
  insights: SmartInsights | null
}

export interface BackupData {
  version: number
  exportedAt: number
  user: UserProfile | null
  subscriptions: Subscription[]
}
