// TypeScript interfaces for statistics dashboard
export interface MetricCard {
  id: 'subscriptions' | 'monthly_cost' | 'annual_cost' | 'unused_services'
  label: string
  value: number
  unit: string
  trend: TrendData
  context: string
}

export interface TrendData {
  direction: 'up' | 'down' | 'neutral'
  percentage: number
  color: 'success' | 'error' | 'neutral'
}

export interface DashboardStats {
  totalSubscriptions: number
  monthlyCost: number
  monthlyTrend: number
  annualCost: number
  annualTrend: number
  unusedServices: number
  unusedTrend: number
  potentialSavings: number
}
