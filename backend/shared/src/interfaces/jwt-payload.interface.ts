import { UserRole } from '../database/entities';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
