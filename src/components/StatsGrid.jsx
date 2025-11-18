import { useState, useEffect, useMemo } from 'react'
import MetricCard from './MetricCard'
import {
  calculateDashboardStats,
  getTrendData,
} from '../utils/metrics-calculator'
import './StatsGrid.css'

export default function StatsGrid({ subscriptions = [], isLoading = false }) {
  const [stats, setStats] = useState(null)

  // Calculate stats whenever subscriptions change
  useMemo(() => {
    if (subscriptions.length >= 0 && !isLoading) {
      const calculated = calculateDashboardStats(subscriptions)
      setStats(calculated)
    }
  }, [subscriptions, isLoading])

  if (!stats) {
    return (
      <div className="stats-grid">
        {[...Array(4)].map((_, i) => (
          <MetricCard key={i} label="Loading..." isLoading={true} />
        ))}
      </div>
    )
  }

  const metricsData = [
    {
      id: 'subscriptions',
      label: 'Total Subscriptions',
      value: stats.totalSubscriptions,
      unit: '',
      trend: getTrendData(0, true), // No trend for count
      context: `${stats.totalSubscriptions} active service${stats.totalSubscriptions !== 1 ? 's' : ''}`,
    },
    {
      id: 'monthly_cost',
      label: 'Monthly Cost',
      value: stats.monthlyCost,
      unit: '$',
      trend: getTrendData(stats.monthlyTrend, false),
      context:
        stats.potentialSavings > 0
          ? `Save $${stats.potentialSavings.toFixed(2)} with annual plans`
          : 'Optimize your billing',
    },
    {
      id: 'annual_cost',
      label: 'Annual Cost Projection',
      value: stats.annualCost,
      unit: '$',
      trend: getTrendData(stats.annualTrend, false),
      context: `${Math.round(stats.monthlyCost)} per month`,
    },
    {
      id: 'unused_services',
      label: 'Unused Services',
      value: stats.unusedServices,
      unit: '',
      trend: getTrendData(stats.unusedTrend, true), // Lower is better
      context: `Unused for 30+ days`,
    },
  ]

  return (
    <div className="stats-grid">
      {metricsData.map((metric) => (
        <MetricCard key={metric.id} {...metric} isLoading={isLoading} />
      ))}
    </div>
  )
}
