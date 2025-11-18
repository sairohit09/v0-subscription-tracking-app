import { useEffect, useState } from 'react'

export interface PWAState {
  isInstalled: boolean
  canInstall: boolean
  isOnline: boolean
  isUpdating: boolean
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    canInstall: false,
    isOnline: navigator.onLine,
    isUpdating: false,
  })

  useEffect(() => {
    // Check if app is already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true
    
    setState((prev) => ({ ...prev, isInstalled }))

    // Listen for online/offline changes
    const handleOnline = () => setState((prev) => ({ ...prev, isOnline: true }))
    const handleOffline = () => setState((prev) => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const installApp = async () => {
    const deferredPrompt = (window as any).deferredPrompt
    if (!deferredPrompt) return

    try {
      setState((prev) => ({ ...prev, isUpdating: true }))
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`[PWA] User response: ${outcome}`)
      ;(window as any).deferredPrompt = null
    } catch (error) {
      console.error('[PWA] Installation failed:', error)
    } finally {
      setState((prev) => ({ ...prev, isUpdating: false }))
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('[PWA] Notifications not supported')
      return false
    }

    try {
      if (Notification.permission === 'granted') {
        return true
      }

      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
      }
    } catch (error) {
      console.error('[PWA] Notification permission request failed:', error)
    }

    return false
  }

  const subscribeToPushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[PWA] Push notifications not supported')
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY,
      })
      return subscription
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error)
      return null
    }
  }

  const sendNotification = async (title: string, options?: NotificationOptions) => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(title, options)
    }
  }

  const triggerBackgroundSync = async () => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        await (registration as any).sync.register('sync-subscriptions')
        console.log('[PWA] Background sync registered')
      } catch (error) {
        console.error('[PWA] Background sync registration failed:', error)
      }
    }
  }

  return {
    ...state,
    installApp,
    requestNotificationPermission,
    subscribeToPushNotifications,
    sendNotification,
    triggerBackgroundSync,
  }
}
