'use client'

import { useEffect, useState } from 'react'
import { Check, X, AlertTriangle } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning'
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor = {
    success: 'bg-[var(--status-ready)]',
    error: 'bg-destructive',
    warning: 'bg-[var(--status-pending)]',
  }[type]

  const textColor = {
    success: 'text-[var(--status-ready-fg)]',
    error: 'text-destructive-foreground',
    warning: 'text-[var(--status-pending-fg)]',
  }[type]

  const Icon = {
    success: Check,
    error: X,
    warning: AlertTriangle,
  }[type]

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 border-2 border-foreground
        flex items-center gap-3 shadow-[4px_4px_0_0_var(--foreground)]
        transition-all duration-300
        ${bgColor} ${textColor}
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
      `}
    >
      <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={3} />
      <span className="font-bold text-sm uppercase tracking-wide">{message}</span>
    </div>
  )
}

// Toast context for global usage
import { createContext, useContext, useCallback } from 'react'

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' | 'warning' }>>([])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center gap-2 pt-4 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
