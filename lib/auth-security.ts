// Authentication security utilities
import bcrypt from 'bcryptjs';

// Password policy configuration
export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Optional for now
  preventCommonPasswords: true
};

// Session configuration
export const SESSION_CONFIG = {
  timeoutMinutes: 30,
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 15,
  requirePeriodicReauth: true,
  periodicReauthHours: 8
};

// Common weak passwords to prevent
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123',
  'password123', 'admin', 'letmein', 'welcome', 'monkey',
  '1234567890', 'dragon', 'master', 'hello', 'superman'
];

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  // Check minimum length
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long`);
  }

  // Check for uppercase letters
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letters
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for numbers
  if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special characters (optional)
  if (PASSWORD_POLICY.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check against common passwords
  if (PASSWORD_POLICY.preventCommonPasswords && 
      COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a more secure password');
  }

  // Calculate strength
  let strengthScore = 0;
  if (password.length >= 8) strengthScore++;
  if (password.length >= 12) strengthScore++;
  if (/[A-Z]/.test(password)) strengthScore++;
  if (/[a-z]/.test(password)) strengthScore++;
  if (/\d/.test(password)) strengthScore++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strengthScore++;

  if (strengthScore <= 2) strength = 'weak';
  else if (strengthScore <= 4) strength = 'medium';
  else strength = 'strong';

  return {
    valid: errors.length === 0,
    errors,
    strength
  };
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Increased from default 10 for better security
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export interface SessionData {
  userId: string;
  username: string;
  role: string;
  loginTime: number;
  lastActivity: number;
  ipAddress?: string;
  userAgent?: string;
  failedAttempts?: number;
  lockedUntil?: number;
}

export function isSessionValid(session: SessionData): boolean {
  const now = Date.now();
  const sessionAge = now - session.loginTime;
  const inactivityTime = now - session.lastActivity;
  
  // Check session timeout
  if (inactivityTime > SESSION_CONFIG.timeoutMinutes * 60 * 1000) {
    return false;
  }
  
  // Check if account is locked
  if (session.lockedUntil && now < session.lockedUntil) {
    return false;
  }
  
  // Check for periodic reauth requirement
  if (SESSION_CONFIG.requirePeriodicReauth && 
      sessionAge > SESSION_CONFIG.periodicReauthHours * 60 * 60 * 1000) {
    return false;
  }
  
  return true;
}

export function updateSessionActivity(session: SessionData): SessionData {
  return {
    ...session,
    lastActivity: Date.now()
  };
}

export function shouldRequireReauth(session: SessionData): boolean {
  const now = Date.now();
  const sessionAge = now - session.loginTime;
  return sessionAge > SESSION_CONFIG.periodicReauthHours * 60 * 60 * 1000;
}

export function incrementFailedAttempts(session: SessionData): SessionData {
  const failedAttempts = (session.failedAttempts || 0) + 1;
  const lockedUntil = failedAttempts >= SESSION_CONFIG.maxFailedAttempts 
    ? Date.now() + (SESSION_CONFIG.lockoutDurationMinutes * 60 * 1000)
    : undefined;
  
  return {
    ...session,
    failedAttempts,
    lockedUntil
  };
}

export function clearFailedAttempts(session: SessionData): SessionData {
  return {
    ...session,
    failedAttempts: 0,
    lockedUntil: undefined
  };
}

export function generateSecureToken(): string {
  // Generate a secure random token for CSRF protection
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function sanitizeUserInput(input: string): string {
  // Basic input sanitization
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}