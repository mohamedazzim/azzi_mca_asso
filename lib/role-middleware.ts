import { NextRequest, NextResponse } from 'next/server';

// Role-based permission definitions
const ROLE_PERMISSIONS = {
  admin: {
    // Full CRUD access to everything
    students: ['create', 'read', 'update', 'delete', 'bulk'],
    events: ['create', 'read', 'update', 'delete', 'manage'],
    analytics: ['read', 'export'],
    users: ['create', 'read', 'update', 'delete'],
    system: ['backup', 'restore', 'settings'],
    reports: ['generate', 'export']
  },
  staff: {
    // Read-only access with limited functionality
    students: ['read'],
    events: ['read'],
    analytics: ['read'],
    users: [],
    system: [],
    reports: ['generate']
  }
};

// API endpoints that require admin access
const ADMIN_ONLY_ROUTES = [
  '/api/students',  // POST, PUT, DELETE
  '/api/events',    // POST, PUT, DELETE
  '/api/students/bulk-operations',
  '/api/students/upload-photo',
  '/api/events/.*/attendance',  // POST
  '/api/events/.*/winners',     // POST, DELETE
  '/api/events/.*/gallery',     // POST
];

// API endpoints that allow staff access (read-only)
const STAFF_ALLOWED_ROUTES = [
  '/api/students',     // GET only
  '/api/events',       // GET only
  '/api/analytics',    // GET only
  '/api/students/reports', // GET only
];

export function checkRolePermission(
  userRole: string,
  resource: string,
  action: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
  if (!permissions) return false;
  
  const resourcePermissions = permissions[resource as keyof typeof permissions] as string[];
  if (!resourcePermissions) return false;
  
  return resourcePermissions.includes(action);
}

export function enforceAdminRole(request: NextRequest): NextResponse | null {
  const role = request.headers.get("x-user-role");
  
  if (role !== "admin") {
    return NextResponse.json(
      { 
        error: "Forbidden", 
        message: "Admin access required for this operation",
        code: "INSUFFICIENT_PERMISSIONS"
      }, 
      { status: 403 }
    );
  }
  
  return null; // Allow request to continue
}

export function enforceRoleForRoute(
  request: NextRequest,
  allowedRoles: string[]
): NextResponse | null {
  const role = request.headers.get("x-user-role");
  
  if (!role || !allowedRoles.includes(role)) {
    return NextResponse.json(
      { 
        error: "Forbidden", 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        code: "INSUFFICIENT_PERMISSIONS"
      }, 
      { status: 403 }
    );
  }
  
  return null; // Allow request to continue
}

export function enforceMethodPermissions(
  request: NextRequest,
  userRole: string
): NextResponse | null {
  const method = request.method;
  const pathname = request.nextUrl.pathname;
  
  // Admin has access to all methods
  if (userRole === 'admin') {
    return null;
  }
  
  // Staff only has read access (GET methods)
  if (userRole === 'staff') {
    if (method !== 'GET') {
      return NextResponse.json(
        { 
          error: "Forbidden", 
          message: "Staff users have read-only access",
          code: "READ_ONLY_ACCESS"
        }, 
        { status: 403 }
      );
    }
    
    // Check if the route is in staff-allowed routes
    const isAllowed = STAFF_ALLOWED_ROUTES.some(route => {
      if (route.includes('.*')) {
        const regex = new RegExp(route.replace('.*', '.*'));
        return regex.test(pathname);
      }
      return pathname.startsWith(route);
    });
    
    if (!isAllowed) {
      return NextResponse.json(
        { 
          error: "Forbidden", 
          message: "Access denied to this resource",
          code: "RESOURCE_ACCESS_DENIED"
        }, 
        { status: 403 }
      );
    }
  }
  
  return null; // Allow request to continue
}

// Wrapper function for API route handlers
export function withRoleProtection(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: {
    requiredRole?: 'admin' | 'staff' | 'any';
    allowedRoles?: string[];
    resource?: string;
    action?: string;
  } = {}
) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      const userRole = request.headers.get("x-user-role");
      
      // Check authentication
      if (!userRole) {
        return NextResponse.json(
          { 
            error: "Unauthorized", 
            message: "Authentication required",
            code: "AUTHENTICATION_REQUIRED"
          }, 
          { status: 401 }
        );
      }
      
      // Check role requirements
      if (options.requiredRole && userRole !== options.requiredRole) {
        return NextResponse.json(
          { 
            error: "Forbidden", 
            message: `${options.requiredRole} role required`,
            code: "INSUFFICIENT_ROLE"
          }, 
          { status: 403 }
        );
      }
      
      if (options.allowedRoles && !options.allowedRoles.includes(userRole)) {
        return NextResponse.json(
          { 
            error: "Forbidden", 
            message: `Access denied. Allowed roles: ${options.allowedRoles.join(', ')}`,
            code: "ROLE_NOT_ALLOWED"
          }, 
          { status: 403 }
        );
      }
      
      // Check resource-specific permissions
      if (options.resource && options.action) {
        const hasPermission = checkRolePermission(userRole, options.resource, options.action);
        if (!hasPermission) {
          return NextResponse.json(
            { 
              error: "Forbidden", 
              message: `Insufficient permissions for ${options.action} on ${options.resource}`,
              code: "PERMISSION_DENIED"
            }, 
            { status: 403 }
          );
        }
      }
      
      // Check method-based permissions
      const methodCheck = enforceMethodPermissions(request, userRole);
      if (methodCheck) {
        return methodCheck;
      }
      
      // All checks passed, execute the handler
      return await handler(request, ...args);
      
    } catch (error) {
      console.error('Role protection error:', error);
      return NextResponse.json(
        { 
          error: "Internal Server Error", 
          message: "Authorization check failed",
          code: "AUTHORIZATION_ERROR"
        }, 
        { status: 500 }
      );
    }
  };
}

// Helper to get user role from request
export function getUserRole(request: NextRequest): string | null {
  return request.headers.get("x-user-role");
}

// Helper to check if user is admin
export function isAdmin(request: NextRequest): boolean {
  return getUserRole(request) === 'admin';
}

// Helper to check if user is staff
export function isStaff(request: NextRequest): boolean {
  return getUserRole(request) === 'staff';
}