/**
 * API Security Middleware
 * Comprehensive input validation, CORS, and security headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Security headers configuration
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

// CORS configuration
const CORS_CONFIG = {
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://*.replit.dev',
    'https://*.repl.co'
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name'
  ],
  maxAge: 86400 // 24 hours
};

// Common validation schemas
export const ValidationSchemas = {
  student: z.object({
    name: z.string().min(2).max(100),
    rollNumber: z.string().min(1).max(20),
    email: z.string().email().optional(),
    phone: z.string().min(10).max(15).optional(),
    section: z.string().min(1).max(10),
    batchYear: z.number().int().min(2020).max(2030),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    bloodGroup: z.string().max(10).optional(),
    address: z.string().max(500).optional(),
    hostellerStatus: z.enum(['Hosteller', 'Day Scholar']).optional()
  }),

  event: z.object({
    title: z.string().min(2).max(200),
    eventDate: z.string(),
    location: z.string().min(2).max(200),
    chiefGuest: z.string().max(200).optional(),
    fundSpent: z.number().min(0).max(1000000).optional(),
    eventType: z.string().min(2).max(50),
    description: z.string().max(2000).optional()
  }),

  user: z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(8).max(128),
    role: z.enum(['admin', 'staff']),
    fullName: z.string().min(2).max(100).optional()
  }),

  login: z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(1).max(128)
  }),

  passwordChange: z.object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(8).max(128),
    userId: z.string().min(1).max(50),
    username: z.string().min(3).max(50)
  }),

  fileUpload: z.object({
    filename: z.string().min(1).max(255),
    size: z.number().int().min(1).max(50 * 1024 * 1024), // 50MB max
    type: z.string().min(1).max(100)
  }),

  pagination: z.object({
    page: z.number().int().min(1).max(1000).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    search: z.string().max(200).optional(),
    sort: z.string().max(50).optional(),
    order: z.enum(['asc', 'desc']).optional()
  })
};

// Request sanitization
export class RequestSanitizer {
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length
  }

  static sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeString(key);
      
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      } else {
        sanitized[sanitizedKey] = value;
      }
    }
    
    return sanitized;
  }

  static sanitizeFormData(formData: FormData): FormData {
    const sanitized = new FormData();
    
    formData.forEach((value, key) => {
      if (typeof value === 'string') {
        sanitized.append(this.sanitizeString(key), this.sanitizeString(value));
      } else {
        sanitized.append(this.sanitizeString(key), value);
      }
    });
    
    return sanitized;
  }
}

// Security middleware
export class SecurityMiddleware {
  static applyCORS(request: NextRequest, response: NextResponse): NextResponse {
    const origin = request.headers.get('origin');
    
    // Check if origin is allowed
    const isAllowedOrigin = !origin || 
      CORS_CONFIG.allowedOrigins.some(allowedOrigin => {
        if (allowedOrigin.includes('*')) {
          const pattern = allowedOrigin.replace(/\*/g, '.*');
          return new RegExp(pattern).test(origin);
        }
        return allowedOrigin === origin;
      });

    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
    }

    response.headers.set('Access-Control-Allow-Methods', CORS_CONFIG.allowedMethods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', CORS_CONFIG.allowedHeaders.join(', '));
    response.headers.set('Access-Control-Max-Age', CORS_CONFIG.maxAge.toString());
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
  }

  static applySecurityHeaders(response: NextResponse): NextResponse {
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  static handlePreflight(request: NextRequest): NextResponse | null {
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });
      return this.applyCORS(request, this.applySecurityHeaders(response));
    }
    return null;
  }
}

// Input validation wrapper
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: any,
  sanitize: boolean = true
): { success: boolean; data?: T; errors?: string[] } {
  try {
    const processedData = sanitize ? RequestSanitizer.sanitizeObject(data) : data;
    const validated = schema.parse(processedData);
    
    return {
      success: true,
      data: validated
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    
    return {
      success: false,
      errors: ['Validation failed']
    };
  }
}

// API route wrapper with security
export function withApiSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    allowedMethods?: string[];
    validateInput?: z.ZodSchema<any>;
    rateLimit?: boolean;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Handle preflight requests
      const preflightResponse = SecurityMiddleware.handlePreflight(request);
      if (preflightResponse) {
        return preflightResponse;
      }

      // Check allowed methods
      if (options.allowedMethods && !options.allowedMethods.includes(request.method)) {
        const response = NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
        return SecurityMiddleware.applySecurityHeaders(
          SecurityMiddleware.applyCORS(request, response)
        );
      }

      // Validate input if schema provided
      if (options.validateInput && request.method !== 'GET') {
        try {
          const body = await request.clone().json();
          const validation = validateInput(options.validateInput, body);
          
          if (!validation.success) {
            const response = NextResponse.json(
              { 
                error: 'Invalid input',
                details: validation.errors
              },
              { status: 400 }
            );
            return SecurityMiddleware.applySecurityHeaders(
              SecurityMiddleware.applyCORS(request, response)
            );
          }
        } catch (error) {
          // If JSON parsing fails, let the handler deal with it
        }
      }

      // Call the actual handler
      const response = await handler(request);

      // Apply security headers and CORS
      return SecurityMiddleware.applySecurityHeaders(
        SecurityMiddleware.applyCORS(request, response)
      );

    } catch (error) {
      const response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      return SecurityMiddleware.applySecurityHeaders(
        SecurityMiddleware.applyCORS(request, response)
      );
    }
  };
}

// File upload security
export function validateFileUpload(file: File): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // File size validation (50MB max)
  if (file.size > 50 * 1024 * 1024) {
    errors.push('File size exceeds 50MB limit');
  }
  
  // File type validation
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/json'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }
  
  // Filename validation
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.js', '.vbs'];
  if (dangerousExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
    errors.push('Dangerous file extension detected');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}