import { getSupabaseClient } from '@/src/lib/supabase'
import {
  Subscription,
  UserProfile,
  SmartInsights,
  StorageSchema,
  BackupData,
} from '@/src/types'
import {
  getStorageData,
  saveStorageData,
  getUser,
  saveUser as saveUserLocal,
  getSubscriptions as getSubscriptionsLocal,
  saveSubscription as saveSubscriptionLocal,
  deleteSubscription as deleteSubscriptionLocal,
  getInsights as getInsightsLocal,
  saveInsights as saveInsightsLocal,
} from '@/src/utils/storage'

export type { Subscription }

/**
 * Syncs user profile to Supabase
 */
export async function syncUserToSupabase(user: UserProfile, clerkId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('users')
      .upsert(
        {
          clerk_id: clerkId,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          currency: user.preferences.currency,
          theme: user.preferences.theme,
          notifications_enabled: user.preferences.notifications,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'clerk_id' }
      )

    if (error) {
      console.error('[SubSentry] Error syncing user:', error)
      return false
    }

    // Save locally too
    saveUserLocal(user)
    return true
  } catch (error) {
    console.error('[SubSentry] Exception syncing user:', error)
    return false
  }
}

/**
 * Syncs subscription to Supabase
 */
export async function syncSubscriptionToSupabase(
  subscription: Subscription,
  userId: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase.from('subscriptions').upsert(
      {
        id: subscription.id,
        user_id: userId,
        name: subscription.name,
        cost: subscription.cost,
        frequency: subscription.frequency,
        renewal_date: subscription.renewalDate,
        category: subscription.metadata.category,
        color: subscription.metadata.color,
        logo_url: subscription.metadata.logo,
        website_url: subscription.metadata.websiteUrl,
        description: subscription.metadata.description,
        tags: subscription.tags,
        notes: subscription.notes,
        is_active: subscription.isActive,
        cancelled_at: subscription.cancelledAt || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    if (error) {
      console.error('[SubSentry] Error syncing subscription:', error)
      return false
    }

    // Sync usage data
    if (subscription.usage.dailyUsage.length > 0) {
      const usageRecords = subscription.usage.dailyUsage.map((usage) => ({
        subscription_id: subscription.id,
        date: usage.date,
        minutes: usage.minutes,
      }))

      const { error: usageError } = await supabase
        .from('usage_tracking')
        .upsert(usageRecords, { onConflict: 'subscription_id,date' })

      if (usageError) {
        console.warn('[SubSentry] Warning syncing usage:', usageError)
      }
    }

    // Save locally too
    saveSubscriptionLocal(subscription)
    return true
  } catch (error) {
    console.error('[SubSentry] Exception syncing subscription:', error)
    return false
  }
}

/**
 * Deletes subscription from Supabase
 */
export async function deleteSubscriptionFromSupabase(subscriptionId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', subscriptionId)

    if (error) {
      console.error('[SubSentry] Error deleting subscription:', error)
      return false
    }

    // Delete locally too
    deleteSubscriptionLocal(subscriptionId)
    return true
  } catch (error) {
    console.error('[SubSentry] Exception deleting subscription:', error)
    return false
  }
}

/**
 * Fetches all subscriptions from Supabase for a user
 */
export async function fetchSubscriptionsFromSupabase(userId: string): Promise<Subscription[]> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        usage_tracking (date, minutes)
      `
      )
      .eq('user_id', userId)

    if (error) {
      console.error('[SubSentry] Error fetching subscriptions:', error)
      return getSubscriptionsLocal(userId)
    }

    // Transform Supabase records to Subscription type
    const subscriptions: Subscription[] = (data || []).map((record: any) => ({
      id: record.id,
      userId: userId,
      name: record.name,
      cost: record.cost,
      frequency: record.frequency,
      renewalDate: record.renewal_date,
      createdAt: new Date(record.created_at).getTime(),
      updatedAt: new Date(record.updated_at).getTime(),
      usage: {
        lastUsedDate: null,
        dailyUsage: (record.usage_tracking || []).map((u: any) => ({
          date: u.date,
          minutes: u.minutes,
        })),
        totalMinutesThisMonth: 0,
      },
      tags: record.tags || [],
      notes: record.notes,
      metadata: {
        category: record.category,
        color: record.color,
        logo: record.logo_url,
        websiteUrl: record.website_url,
        description: record.description,
      },
      isActive: record.is_active,
      cancelledAt: record.cancelled_at,
    }))

    return subscriptions
  } catch (error) {
    console.error('[SubSentry] Exception fetching subscriptions:', error)
    return getSubscriptionsLocal(userId)
  }
}

/**
 * Syncs insights to Supabase
 */
export async function syncInsightsToSupabase(
  insights: SmartInsights,
  userId: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase.from('insights').upsert(
      {
        id: insights.id,
        user_id: userId,
        total_monthly_cost: insights.totalMonthlyCost,
        total_yearly_cost: insights.totalYearlyCost,
        cost_trend: insights.costTrend,
        potential_savings: insights.potentialSavings,
        generated_at: insights.generatedAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    if (error) {
      console.error('[SubSentry] Error syncing insights:', error)
      return false
    }

    saveInsightsLocal(insights)
    return true
  } catch (error) {
    console.error('[SubSentry] Exception syncing insights:', error)
    return false
  }
}

/**
 * Logs sync action for audit trail
 */
export async function logSyncAction(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string
): Promise<void> {
  try {
    const supabase = getSupabaseClient()

    await supabase.from('sync_history').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      status: 'synced',
    })
  } catch (error) {
    console.warn('[SubSentry] Error logging sync action:', error)
  }
}
