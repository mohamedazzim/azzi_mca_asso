/**
 * Rate Limiting Implementation
 * Protects against brute force attacks and API abuse
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAttempt: number;
}

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxAttempts: number;  // Max attempts per window
  blockDurationMs?: number;  // How long to block after exceeding limit
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,
    blockDurationMs: 30 * 60 * 1000 // 30 minutes block
  };

  private getKey(identifier: string, endpoint: string): string {
    return `${identifier}:${endpoint}`;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  public async checkRateLimit(
    identifier: string,
    endpoint: string,
    config?: Partial<RateLimitConfig>
  ): Promise<{ allowed: boolean; resetTime?: number; attemptsLeft?: number }> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const key = this.getKey(identifier, endpoint);
    const now = Date.now();

    // Cleanup expired entries periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup
      this.cleanupExpiredEntries();
    }

    let entry = this.store.get(key);

    // If no entry exists or window has expired, create/reset
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + finalConfig.windowMs,
        lastAttempt: now
      };
      this.store.set(key, entry);
      
      return {
        allowed: true,
        resetTime: entry.resetTime,
        attemptsLeft: finalConfig.maxAttempts - 1
      };
    }

    // Check if currently blocked
    const isBlocked = entry.count >= finalConfig.maxAttempts;
    const blockUntil = entry.lastAttempt + (finalConfig.blockDurationMs || finalConfig.windowMs);
    
    if (isBlocked && now < blockUntil) {
      return {
        allowed: false,
        resetTime: blockUntil,
        attemptsLeft: 0
      };
    }

    // Reset if block period has expired
    if (isBlocked && now >= blockUntil) {
      entry.count = 1;
      entry.resetTime = now + finalConfig.windowMs;
      entry.lastAttempt = now;
      this.store.set(key, entry);
      
      return {
        allowed: true,
        resetTime: entry.resetTime,
        attemptsLeft: finalConfig.maxAttempts - 1
      };
    }

    // Increment counter
    entry.count++;
    entry.lastAttempt = now;
    this.store.set(key, entry);

    const allowed = entry.count <= finalConfig.maxAttempts;
    
    return {
      allowed,
      resetTime: allowed ? entry.resetTime : (now + (finalConfig.blockDurationMs || finalConfig.windowMs)),
      attemptsLeft: Math.max(0, finalConfig.maxAttempts - entry.count)
    };
  }

  public async recordSuccessfulAuth(identifier: string, endpoint: string): Promise<void> {
    const key = this.getKey(identifier, endpoint);
    // Reset the counter on successful authentication
    this.store.delete(key);
  }

  public getStats(): { totalEntries: number; blockedIdentifiers: number } {
    const now = Date.now();
    let blockedCount = 0;
    
    for (const entry of this.store.values()) {
      if (entry.count >= this.defaultConfig.maxAttempts && now < (entry.lastAttempt + (this.defaultConfig.blockDurationMs || this.defaultConfig.windowMs))) {
        blockedCount++;
      }
    }
    
    return {
      totalEntries: this.store.size,
      blockedIdentifiers: blockedCount
    };
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Rate limiting configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,
    blockDurationMs: 30 * 60 * 1000 // 30 minutes
  },
  passwordChange: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3,
    blockDurationMs: 60 * 60 * 1000 // 1 hour
  },
  fileUpload: {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 10,
    blockDurationMs: 5 * 60 * 1000 // 5 minutes
  },
  apiGeneral: {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 60,
    blockDurationMs: 60 * 1000 // 1 minute
  }
};

// Helper function to get client identifier
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (for proxy environments like Replit)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  return forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
}

// Express-style middleware for Next.js
export async function withRateLimit(
  request: Request,
  endpoint: string,
  config?: Partial<RateLimitConfig>
) {
  const identifier = getClientIdentifier(request);
  const result = await rateLimiter.checkRateLimit(identifier, endpoint, config);
  
  if (!result.allowed) {
    const resetTime = new Date(result.resetTime || Date.now()).toISOString();
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        resetTime,
        attemptsLeft: result.attemptsLeft
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((result.resetTime || Date.now() - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': config?.maxAttempts?.toString() || '5',
          'X-RateLimit-Remaining': result.attemptsLeft?.toString() || '0',
          'X-RateLimit-Reset': result.resetTime?.toString() || ''
        }
      }
    );
  }
  
  return null; // No rate limit violation
}