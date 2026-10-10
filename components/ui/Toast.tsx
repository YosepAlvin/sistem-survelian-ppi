import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle2, AlertCircle, XCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { id, ...toast }
    setToasts(prev => [...prev, newToast])

    const duration = toast.duration || 5000
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={20} className="text-emerald-600" />
      case 'error':
        return <XCircle size={20} className="text-red-600" />
      case 'warning':
        return <AlertCircle size={20} className="text-amber-600" />
      case 'info':
      default:
        return <AlertCircle size={20} className="text-blue-600" />
    }
  }

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-200'
      case 'error':
        return 'border-red-200'
      case 'warning':
        return 'border-amber-200'
      case 'info':
      default:
        return 'border-blue-200'
    }
  }

  return (
    <div className={cn(
      'bg-white border rounded-2xl p-4 shadow-2xl shadow-slate-200/50 flex items-start gap-3 min-w-[320px] animate-fade-in-up',
      getBorderColor()
    )}>
      {getIcon()}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 text-sm">{toast.title}</p>
        {toast.message && <p className="text-slate-600 text-xs mt-1">{toast.message}</p>}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-slate-500 hover:text-slate-700 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}
