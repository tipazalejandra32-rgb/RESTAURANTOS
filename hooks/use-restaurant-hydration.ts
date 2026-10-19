'use client'

import { useEffect, useState } from 'react'
import { useRestaurantStore } from '@/lib/store'

export function useRestaurantHydration(): { ready: boolean; error: string | null } {
  const [ready, setReady] = useState(() => useRestaurantStore.getState().hasHydrated)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (useRestaurantStore.getState().hasHydrated) {
      setReady(true)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        await useRestaurantStore.getState().fetchAndHydrate()
        if (!cancelled) setReady(true)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { ready, error }
}
