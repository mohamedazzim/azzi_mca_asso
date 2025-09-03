import { errorToast } from "@/components/ui/error-toast";

export interface ErrorDetails {
  operation: string;
  context?: string;
  originalError?: any;
  userMessage?: string;
}

export class AppError extends Error {
  public readonly operation: string;
  public readonly context?: string;
  public readonly originalError?: any;
  public readonly userMessage: string;

  constructor({ operation, context, originalError, userMessage }: ErrorDetails) {
    const message = userMessage || `Failed to ${operation}`;
    super(message);
    this.name = 'AppError';
    this.operation = operation;
    this.context = context;
    this.originalError = originalError;
    this.userMessage = message;
  }
}

export function handleError(error: ErrorDetails | AppError | Error, showToast = true) {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new AppError({
      operation: "unknown operation",
      originalError: error,
      userMessage: error.message
    });
  } else {
    appError = new AppError(error);
  }

  // Log detailed error for debugging
  console.error(`[${appError.operation}] Error:`, {
    message: appError.userMessage,
    context: appError.context,
    originalError: appError.originalError,
    stack: appError.stack
  });

  // Show user-friendly error message
  if (showToast) {
    const detailedMessage = appError.context 
      ? `${appError.userMessage} (${appError.context})`
      : appError.userMessage;
    
    errorToast(detailedMessage, {
      title: "Operation Failed",
      duration: 7000
    });
  }

  return appError;
}

export function createErrorHandler(operation: string, context?: string) {
  return (error: any, showToast = true) => {
    return handleError({
      operation,
      context,
      originalError: error,
      userMessage: getErrorMessage(error, operation)
    }, showToast);
  };
}

function getErrorMessage(error: any, operation: string): string {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  // Default error messages based on operation type
  const operationDefaults: Record<string, string> = {
    login: "Invalid username or password. Please check your credentials and try again.",
    logout: "Failed to log out properly. Please refresh the page and try again.",
    save: "Unable to save data. Please check your input and try again.",
    delete: "Unable to delete the item. It may be in use or protected.",
    upload: "File upload failed. Please check the file format and size.",
    load: "Unable to load data. Please refresh the page and try again.",
    update: "Unable to update the information. Please try again.",
    create: "Unable to create new item. Please check all required fields.",
  };
  
  const defaultMessage = operationDefaults[operation.toLowerCase()] || 
    `Failed to ${operation}. Please try again or contact support.`;
  
  return defaultMessage;
}