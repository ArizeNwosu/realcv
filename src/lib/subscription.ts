export interface Subscription {
  id: string
  userId: string
  status: 'active' | 'inactive' | 'trial'
  plan: 'free' | 'pro'
  startDate: number
  endDate?: number
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}

const SUBSCRIPTION_KEY = 'realcv_subscription'
const USER_KEY = 'realcv_user_id'

export class SubscriptionManager {
  static generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9)
  }

  static getCurrentUserId(): string {
    if (typeof window === 'undefined') {
      // Return a temporary ID during SSR
      return 'temp_user_ssr'
    }
    
    let userId = localStorage.getItem(USER_KEY)
    if (!userId) {
      userId = this.generateUserId()
      localStorage.setItem(USER_KEY, userId)
    }
    return userId
  }

  static getSubscription(): Subscription {
    if (typeof window === 'undefined') {
      // Return default subscription during SSR
      return {
        id: 'sub_ssr_temp',
        userId: 'temp_user_ssr',
        status: 'inactive',
        plan: 'free',
        startDate: Date.now()
      }
    }

    try {
      const stored = localStorage.getItem(SUBSCRIPTION_KEY)
      if (stored) {
        const subscription = JSON.parse(stored) as Subscription
        return subscription
      }
    } catch (error) {
      console.error('Failed to load subscription:', error)
    }

    // Return default free subscription
    const userId = this.getCurrentUserId()
    return {
      id: 'sub_' + Math.random().toString(36).substr(2, 9),
      userId,
      status: 'inactive',
      plan: 'free',
      startDate: Date.now()
    }
  }

  static updateSubscription(subscription: Partial<Subscription>): void {
    if (typeof window === 'undefined') {
      return // Can't update during SSR
    }
    
    const current = this.getSubscription()
    const updated = { ...current, ...subscription }
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(updated))
  }

  static isSubscriptionActive(): boolean {
    const subscription = this.getSubscription()
    
    if (subscription.plan === 'free') {
      return false
    }

    if (subscription.status !== 'active') {
      return false
    }

    // Check if subscription hasn't expired
    if (subscription.endDate && subscription.endDate < Date.now()) {
      return false
    }

    return true
  }

  static canExportPDF(): boolean {
    return this.isSubscriptionActive()
  }

  static canPublishResume(): boolean {
    return this.isSubscriptionActive()
  }

  static activateSubscription(stripeCustomerId?: string, stripeSubscriptionId?: string): void {
    this.updateSubscription({
      status: 'active',
      plan: 'pro',
      startDate: Date.now(),
      endDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
      stripeCustomerId,
      stripeSubscriptionId
    })
  }

  static cancelSubscription(): void {
    this.updateSubscription({
      status: 'inactive',
      plan: 'free',
      endDate: Date.now()
    })
  }

  static getSubscriptionStatus(): {
    isActive: boolean
    plan: string
    daysRemaining?: number
    status: string
  } {
    const subscription = this.getSubscription()
    const isActive = this.isSubscriptionActive()
    
    let daysRemaining: number | undefined
    if (subscription.endDate) {
      const timeRemaining = subscription.endDate - Date.now()
      daysRemaining = Math.max(0, Math.ceil(timeRemaining / (24 * 60 * 60 * 1000)))
    }

    return {
      isActive,
      plan: subscription.plan,
      daysRemaining,
      status: subscription.status
    }
  }
}