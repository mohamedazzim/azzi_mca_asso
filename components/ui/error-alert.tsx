"use client";

import { AlertCircle, X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ErrorAlertProps {
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export function ErrorAlert({ 
  title = "Error", 
  message, 
  onClose, 
  className 
}: ErrorAlertProps) {
  return (
    <div className={cn(
      "bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3",
      className
    )}>
      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-red-800">{title}</h3>
        <p className="mt-1 text-sm text-red-700 break-words">{message}</p>
      </div>
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-red-600 hover:text-red-800 hover:bg-red-100 h-auto p-1"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}