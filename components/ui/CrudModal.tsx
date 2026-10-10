import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { X } from "lucide-react"

interface CrudModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  loading?: boolean
  onSubmit?: (e: React.FormEvent) => void | Promise<void>
  submitLabel?: string
  cancelLabel?: string
  showCancelButton?: boolean
  showSubmitButton?: boolean
  className?: string
}

const CrudModal = React.forwardRef<HTMLDivElement, CrudModalProps>(
  ({
    isOpen,
    onClose,
    title,
    children,
    loading = false,
    onSubmit,
    submitLabel = "Simpan",
    cancelLabel = "Batal",
    showCancelButton = true,
    showSubmitButton = true,
    className,
  }, ref) => {
    React.useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen) {
          onClose()
        }
      }
      if (isOpen) {
        window.addEventListener("keydown", handleEsc)
      }
      return () => window.removeEventListener("keydown", handleEsc)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
      <div
        ref={ref}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      >
        <div
          className={cn(
            "bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-slide-in",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {children}
          </div>

          {/* Footer */}
          {(showCancelButton || showSubmitButton) && (
            <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
              {showCancelButton && (
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  {cancelLabel}
                </Button>
              )}
              {showSubmitButton && (
                <Button
                  variant="default"
                  onClick={onSubmit}
                  disabled={loading}
                  type="submit"
                >
                  {loading ? "Loading..." : submitLabel}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
)
CrudModal.displayName = "CrudModal"

export { CrudModal }

