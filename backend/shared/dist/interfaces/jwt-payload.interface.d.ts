import { UserRole } from '../enums/user-role.enum';
export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}
export interface AuthenticatedRequest extends Request {
    user: JwtPayload;
}
