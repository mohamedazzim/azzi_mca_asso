import { NextRequest, NextResponse } from 'next/server';
import { validatePassword, hashPassword, verifyPassword } from '@/lib/auth-security';
import { auditLogger, logAuth } from '@/lib/audit-logger';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter';

// POST - Change password with security validation
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, 'password-change', RATE_LIMIT_CONFIGS.passwordChange);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { currentPassword, newPassword, userId, username } = await request.json();

    if (!currentPassword || !newPassword || !userId || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate new password against security policy
    const passwordValidation = validatePassword(newPassword);
    
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet security requirements',
          details: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    // Here you would verify current password against stored hash
    // For now, we'll simulate this check
    const isCurrentPasswordValid = true; // Replace with actual verification

    if (!isCurrentPasswordValid) {
      // Log failed attempt
      await auditLogger.log(
        userId,
        username,
        'password_changed',
        'authentication',
        {
          success: false,
          error: 'Invalid current password',
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        }
      );

      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Here you would update the password in your user storage
    // For now, we'll just log the successful change
    await logAuth.passwordChanged(userId, username);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
      passwordStrength: passwordValidation.strength
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}

// GET - Get password policy information
export async function GET() {
  try {
    return NextResponse.json({
      policy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false
      },
      sessionConfig: {
        timeoutMinutes: 30,
        maxFailedAttempts: 5,
        lockoutDurationMinutes: 15
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get security policy' },
      { status: 500 }
    );
  }
}