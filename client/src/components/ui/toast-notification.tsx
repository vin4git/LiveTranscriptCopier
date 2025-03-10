import { X } from "lucide-react";
import { forwardRef, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const toastVariants = cva(
  "bg-white rounded-lg shadow-lg border px-4 py-3 flex items-start mb-2 transform transition-transform",
  {
    variants: {
      variant: {
        default: "border-neutral-200",
        success: "border-secondary/30",
        error: "border-danger/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface ToastNotificationProps extends VariantProps<typeof toastVariants> {
  title: string;
  description?: string;
  icon?: ReactNode;
  onClose?: () => void;
}

const ToastNotification = forwardRef<HTMLDivElement, ToastNotificationProps>(
  ({ variant, title, description, icon, onClose, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant }))}
        {...props}
      >
        {icon && <div className="flex-shrink-0 mr-3 mt-0.5">{icon}</div>}
        <div className="flex-1">
          <h4 className="font-medium text-sm text-neutral-700">{title}</h4>
          {description && (
            <p className="text-xs text-neutral-500 mt-1">{description}</p>
          )}
        </div>
        {onClose && (
          <button
            className="ml-2 text-neutral-400 hover:text-neutral-600"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

ToastNotification.displayName = "ToastNotification";

export { ToastNotification };
