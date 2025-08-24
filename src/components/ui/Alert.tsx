import React from "react";
import { cn } from "../../utils/cn";

export interface AlertProps {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const alertVariants = {
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-800",
    icon: "💡",
    closeButton: "text-blue-600 hover:text-blue-800",
  },
  success: {
    container: "bg-green-50 border-green-200 text-green-800",
    icon: "✅",
    closeButton: "text-green-600 hover:text-green-800",
  },
  warning: {
    container: "bg-yellow-50 border-yellow-200 text-yellow-800",
    icon: "⚠️",
    closeButton: "text-yellow-600 hover:text-yellow-800",
  },
  error: {
    container: "bg-red-50 border-red-200 text-red-800",
    icon: "❌",
    closeButton: "text-red-600 hover:text-red-800",
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant = "info",
  title,
  children,
  onClose,
  className,
}) => {
  const variantStyles = alertVariants[variant];

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        variantStyles.container,
        className
      )}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-xl">{variantStyles.icon}</span>
        </div>
        <div className="ml-3 flex-1">
          {title && <h3 className="text-sm font-medium mb-1">{title}</h3>}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              className={cn(
                "inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2",
                variantStyles.closeButton
              )}
              onClick={onClose}
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
