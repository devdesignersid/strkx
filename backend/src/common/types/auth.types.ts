import { Request } from 'express';
import { User } from '@prisma/client';

/**
 * Express Request with authenticated user attached by JWT strategy.
 * Use this instead of `any` for @Req() parameters in controllers.
 */
export interface AuthenticatedRequest extends Request {
    user: User;
}

/**
 * Represents an authenticated user in the system.
 * This is the shape of the user object attached to requests by the JWT strategy.
 */
export type AuthenticatedUser = User;
