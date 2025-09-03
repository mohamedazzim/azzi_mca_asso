"use client";

import { toast } from "sonner";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "error" | "success" | "warning" | "info";

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

const iconMap = {
  error: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  error: "text-red-600",
  success: "text-green-600", 
  warning: "text-yellow-600",
  info: "text-blue-600",
};

export function showToast(type: ToastType, message: string, options: ToastOptions = {}) {
  const { title, description, duration = 5000 } = options;
  const Icon = iconMap[type];
  const iconColor = colorMap[type];

  toast(title || message, {
    description: description || (title ? message : undefined),
    duration,
    icon: <Icon className={`h-5 w-5 ${iconColor}`} />,
    className: `border-l-4 ${
      type === "error" ? "border-l-red-500 bg-red-50" :
      type === "success" ? "border-l-green-500 bg-green-50" :
      type === "warning" ? "border-l-yellow-500 bg-yellow-50" :
      "border-l-blue-500 bg-blue-50"
    }`,
  });
}

// Convenience functions
export const errorToast = (message: string, options?: ToastOptions) => 
  showToast("error", message, options);

export const successToast = (message: string, options?: ToastOptions) => 
  showToast("success", message, options);

export const warningToast = (message: string, options?: ToastOptions) => 
  showToast("warning", message, options);

export const infoToast = (message: string, options?: ToastOptions) => 
  showToast("info", message, options);