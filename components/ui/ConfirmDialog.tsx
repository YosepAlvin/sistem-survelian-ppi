import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  isLoading?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

const ConfirmDialog = React.forwardRef<HTMLDivElement, ConfirmDialogProps>(
  ({
    open,
    title,
    description,
    confirmText = "Konfirmasi",
    cancelText = "Batal",
    isDestructive = false,
    isLoading = false,
    onConfirm,
    onCancel
  }, ref) => {
    if (!open) return null

    return (
      <div
        ref={ref}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      >
        <div
          className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-slide-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              {title}
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {description && (
              <p className="text-slate-600 text-sm">
                {description}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
            <Button
            variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant={isDestructive ? "destructive" : "default"}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : confirmText}
            </Button>
          </div>
        </div>
      </div>
    )
  }
)
ConfirmDialog.displayName = "ConfirmDialog"

export { ConfirmDialog }
