/**
 * Environment Variable Validation
 * Ensures all required environment variables are properly configured
 */

interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  STORAGE_BASE_PATH: string;
  MAX_FILE_SIZE: number;
  SESSION_SECRET?: string;
  LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
  RATE_LIMIT_ENABLED?: boolean;
  BACKUP_RETENTION_DAYS?: number;
  VIRUSTOTAL_API_KEY?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  config: Partial<EnvConfig>;
}

class EnvironmentValidator {
  private requiredVars: (keyof EnvConfig)[] = [
    'NODE_ENV',
    'STORAGE_BASE_PATH',
    'MAX_FILE_SIZE'
  ];

  private optionalVars: (keyof EnvConfig)[] = [
    'SESSION_SECRET',
    'LOG_LEVEL',
    'RATE_LIMIT_ENABLED',
    'BACKUP_RETENTION_DAYS',
    'VIRUSTOTAL_API_KEY'
  ];

  private defaults: Partial<EnvConfig> = {
    NODE_ENV: 'development',
    STORAGE_BASE_PATH: './storage',
    MAX_FILE_SIZE: 10485760, // 10MB
    LOG_LEVEL: 'info',
    RATE_LIMIT_ENABLED: true,
    BACKUP_RETENTION_DAYS: 30
  };

  public validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const config: Partial<EnvConfig> = {};

    // Validate required variables
    for (const varName of this.requiredVars) {
      const value = process.env[varName];
      
      if (!value) {
        // Use default if available, otherwise error
        if (this.defaults[varName] !== undefined) {
          config[varName] = this.defaults[varName] as any;
          warnings.push(`${varName} not set, using default: ${this.defaults[varName]}`);
        } else {
          errors.push(`Required environment variable ${varName} is not set`);
        }
      } else {
        // Validate and parse the value
        const parsedValue = this.parseValue(varName, value);
        if (parsedValue.valid) {
          config[varName] = parsedValue.value as any;
        } else {
          errors.push(`Invalid value for ${varName}: ${parsedValue.error}`);
        }
      }
    }

    // Validate optional variables
    for (const varName of this.optionalVars) {
      const value = process.env[varName];
      
      if (value) {
        const parsedValue = this.parseValue(varName, value);
        if (parsedValue.valid) {
          config[varName] = parsedValue.value as any;
        } else {
          warnings.push(`Invalid value for optional ${varName}: ${parsedValue.error}, using default`);
          if (this.defaults[varName] !== undefined) {
            config[varName] = this.defaults[varName] as any;
          }
        }
      } else if (this.defaults[varName] !== undefined) {
        config[varName] = this.defaults[varName] as any;
      }
    }

    // Additional validation rules
    this.validateStoragePath(config, errors, warnings);
    this.validateFileSize(config, errors, warnings);
    this.validateSecuritySettings(config, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      config
    };
  }

  private parseValue(varName: keyof EnvConfig, value: string): { valid: boolean; value?: any; error?: string } {
    try {
      switch (varName) {
        case 'NODE_ENV':
          if (!['development', 'production', 'test'].includes(value)) {
            return { valid: false, error: 'Must be development, production, or test' };
          }
          return { valid: true, value: value as EnvConfig['NODE_ENV'] };

        case 'MAX_FILE_SIZE':
          const size = parseInt(value, 10);
          if (isNaN(size) || size <= 0) {
            return { valid: false, error: 'Must be a positive integer' };
          }
          if (size > 100 * 1024 * 1024) { // 100MB max
            return { valid: false, error: 'File size limit too large (max 100MB)' };
          }
          return { valid: true, value: size };

        case 'BACKUP_RETENTION_DAYS':
          const days = parseInt(value, 10);
          if (isNaN(days) || days <= 0) {
            return { valid: false, error: 'Must be a positive integer' };
          }
          return { valid: true, value: days };

        case 'RATE_LIMIT_ENABLED':
          const enabled = value.toLowerCase();
          if (!['true', 'false', '1', '0'].includes(enabled)) {
            return { valid: false, error: 'Must be true, false, 1, or 0' };
          }
          return { valid: true, value: enabled === 'true' || enabled === '1' };

        case 'LOG_LEVEL':
          if (!['debug', 'info', 'warn', 'error'].includes(value)) {
            return { valid: false, error: 'Must be debug, info, warn, or error' };
          }
          return { valid: true, value: value as EnvConfig['LOG_LEVEL'] };

        case 'STORAGE_BASE_PATH':
        case 'SESSION_SECRET':
        case 'VIRUSTOTAL_API_KEY':
          return { valid: true, value };

        default:
          return { valid: true, value };
      }
    } catch (error) {
      return { valid: false, error: `Parse error: ${error}` };
    }
  }

  private validateStoragePath(config: Partial<EnvConfig>, errors: string[], warnings: string[]): void {
    if (config.STORAGE_BASE_PATH) {
      // Check if path is absolute or relative
      const path = config.STORAGE_BASE_PATH;
      if (path.startsWith('/') && process.env.NODE_ENV === 'production') {
        warnings.push('Using absolute storage path in production - ensure proper permissions');
      }
      
      // Check for potentially unsafe paths
      if (path.includes('..') || path.includes('~')) {
        errors.push('Storage path contains potentially unsafe directory references');
      }
    }
  }

  private validateFileSize(config: Partial<EnvConfig>, errors: string[], warnings: string[]): void {
    if (config.MAX_FILE_SIZE) {
      const size = config.MAX_FILE_SIZE;
      
      if (size < 1024 * 1024) { // Less than 1MB
        warnings.push('File size limit is very small (< 1MB) - may limit functionality');
      }
      
      if (size > 50 * 1024 * 1024) { // Greater than 50MB
        warnings.push('File size limit is very large (> 50MB) - may impact performance');
      }
    }
  }

  private validateSecuritySettings(config: Partial<EnvConfig>, errors: string[], warnings: string[]): void {
    if (config.NODE_ENV === 'production') {
      if (!config.SESSION_SECRET) {
        errors.push('SESSION_SECRET is required in production');
      } else if (config.SESSION_SECRET.length < 32) {
        errors.push('SESSION_SECRET must be at least 32 characters in production');
      }
      
      if (!config.RATE_LIMIT_ENABLED) {
        warnings.push('Rate limiting is disabled in production - security risk');
      }
    }
  }

  public getValidatedConfig(): EnvConfig {
    const result = this.validate();
    
    if (!result.valid) {
      throw new Error(`Environment validation failed:\n${result.errors.join('\n')}`);
    }
    
    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        if (typeof console !== 'undefined' && process.env.NODE_ENV === 'development') {
          
        }
      });
    }
    
    return result.config as EnvConfig;
  }
}

// Export singleton instance
export const envValidator = new EnvironmentValidator();

// Validate environment on module load
let validatedConfig: EnvConfig;

try {
  validatedConfig = envValidator.getValidatedConfig();
} catch (error) {
  if (process.env.NODE_ENV !== 'test') {
    
    process.exit(1);
  }
  // In test environment, use defaults
  validatedConfig = envValidator.defaults as EnvConfig;
}

export const ENV = validatedConfig;

// Utility functions
export function isProduction(): boolean {
  return ENV.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return ENV.NODE_ENV === 'development';
}

export function isTest(): boolean {
  return ENV.NODE_ENV === 'test';
}

export function getStoragePath(): string {
  return ENV.STORAGE_BASE_PATH;
}

export function getMaxFileSize(): number {
  return ENV.MAX_FILE_SIZE;
}

export function isRateLimitEnabled(): boolean {
  return ENV.RATE_LIMIT_ENABLED !== false;
}