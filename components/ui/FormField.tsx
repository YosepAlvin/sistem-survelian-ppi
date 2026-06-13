import * as React from "react"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  helperText?: string
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, required, children, helperText }, ref) => (
    <div ref={ref} className="space-y-2.5 animate-fade-in-up">
      {label && (
        <label className={cn(
          "block text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300",
          required && "after:content-['*'] after:text-red-500 after:ml-1"
        )}>
          {label}
        </label>
      )}
      <div className="relative">
        {children}
      </div>
      {error ? (
        <p className="text-xs text-red-500 dark:text-red-400 font-semibold mt-1.5 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500" />
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5">
          {helperText}
        </p>
      ) : null}
    </div>
  )
)
FormField.displayName = "FormField"

const inputStyles = cn(
  "w-full px-4 py-3 rounded-xl transition-all duration-300 outline-none",
  "border border-slate-200 dark:border-slate-800",
  "bg-white dark:bg-slate-900/50",
  "text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500",
  "focus:ring-4 focus:ring-primary/10 focus:border-primary/50 dark:focus:ring-primary/20",
  "disabled:bg-slate-50 dark:disabled:bg-slate-900/80 disabled:text-slate-400 disabled:cursor-not-allowed"
)

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        inputStyles,
        error && "border-red-500/50 focus:ring-red-500/10 focus:border-red-500",
        className
      )}
      {...props}
    />
  )
)
FormInput.displayName = "FormInput"

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, error, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        inputStyles,
        "appearance-none bg-no-repeat bg-[right_1rem_center]",
        error && "border-red-500/50 focus:ring-red-500/10 focus:border-red-500",
        className
      )}
      {...props}
    />
  )
)
FormSelect.displayName = "FormSelect"

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        inputStyles,
        "resize-none min-h-[120px]",
        error && "border-red-500/50 focus:ring-red-500/10 focus:border-red-500",
        className
      )}
      {...props}
    />
  )
)
FormTextarea.displayName = "FormTextarea"

export { FormField, FormInput, FormSelect, FormTextarea }
