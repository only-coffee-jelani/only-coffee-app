import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Auth Guard
 * Allows requests to proceed whether authenticated or not
 * If JWT token is present and valid, user is attached to request
 * If no token or invalid token, request proceeds without user
 * 
 * Use this for endpoints that support both guest and authenticated users
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Override handleRequest to not throw errors
   * Returns user if authenticated, null if not
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // If there's an error or no user, just return null (don't throw)
    if (err || !user) {
      return null;
    }
    
    // User is authenticated
    return user;
  }

  /**
   * Override canActivate to always return true
   * This allows the request to proceed regardless of authentication
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Call parent canActivate but catch any errors
    try {
      await super.canActivate(context);
    } catch (err) {
      // Ignore authentication errors - request can proceed as guest
    }
    
    // Always allow the request to proceed
    return true;
  }
}

