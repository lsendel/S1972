import * as React from "react"
import { cn } from "@/lib/utils"

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'error' | 'warning'
  onClose?: () => void
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = 'default', onClose, children, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-white border-gray-200',
      success: 'bg-green-50 border-green-200',
      error: 'bg-red-50 border-red-200',
      warning: 'bg-yellow-50 border-yellow-200',
    }

    const iconStyles = {
      default: 'text-gray-600',
      success: 'text-green-600',
      error: 'text-red-600',
      warning: 'text-yellow-600',
    }

    return (
      <div
        ref={ref}
        className={cn(
          "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg",
          "flex items-center gap-3 p-4",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {variant === 'success' && (
          <svg className={cn("h-5 w-5 flex-shrink-0", iconStyles[variant])} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {variant === 'error' && (
          <svg className={cn("h-5 w-5 flex-shrink-0", iconStyles[variant])} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {variant === 'warning' && (
          <svg className={cn("h-5 w-5 flex-shrink-0", iconStyles[variant])} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
        
        <div className="flex-1 text-sm">{children}</div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-md p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    )
  }
)
Toast.displayName = "Toast"

export { Toast }
