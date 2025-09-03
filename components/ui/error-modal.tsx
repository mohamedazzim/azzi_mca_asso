"use client";

import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  details?: string;
}

export function ErrorModal({ 
  isOpen, 
  onClose, 
  title = "Operation Failed", 
  message,
  details 
}: ErrorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-red-900">{title}</DialogTitle>
              <DialogDescription className="text-red-700 mt-1">
                {message}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        {details && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800 font-medium mb-1">Technical Details:</p>
            <p className="text-sm text-red-700 break-words">{details}</p>
          </div>
        )}
        
        <div className="flex justify-end mt-6">
          <Button onClick={onClose} variant="default">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}