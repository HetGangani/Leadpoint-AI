import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { UserRole } from '@/types';

export const AUTH_COOKIE_NAME = 'leadpoint_session';

export interface AuthSessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyProfileId?: string | null;
}

const getJwtSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET || 'leadpoint-super-secret-jwt-key-change-in-production-2026'
  );

/**
 * Hashes plaintext password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verifies password against hashed string
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Signs a JWT session token with AuthSessionUser payload
 */
export async function signSessionToken(payload: AuthSessionUser, expiresIn = '24h'): Promise<string> {
  return new SignJWT({
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    companyProfileId: payload.companyProfileId || null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecret());
}

/**
 * Verifies JWT token and extracts AuthSessionUser payload
 */
export async function verifySessionToken(token: string): Promise<AuthSessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (!payload || !payload.id || !payload.email || !payload.role) {
      return null;
    }
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as UserRole,
      companyProfileId: (payload.companyProfileId as string) || null,
    };
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies AuthSessionUser from HTTP request headers or cookies
 */
export async function getSessionUser(req: Request): Promise<AuthSessionUser | null> {
  let token: string | null = null;

  // Check Authorization Bearer header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // Fallback to cookie
  if (!token) {
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    const authCookie = cookies.find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
    if (authCookie) {
      token = authCookie.split('=')[1];
    }
  }

  if (!token) return null;

  return verifySessionToken(token);
}

/**
 * Role matching helper
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole | UserRole[]): boolean {
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  return userRole === requiredRole;
}

export function isAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN;
}

export function isClient(userRole: UserRole): boolean {
  return userRole === UserRole.CLIENT || userRole === UserRole.ADMIN;
}

export function isSDR(userRole: UserRole): boolean {
  return userRole === UserRole.SDR || userRole === UserRole.ADMIN;
}

/**
 * Removes sensitive fields (passwordHash, API keys) from user DB record
 */
export function sanitizeUser(user: any) {
  if (!user) return null;
  const { passwordHash, encryptedApiKey, ...sanitized } = user;
  return sanitized;
}

/**
 * Custom error class for authentication and authorization failures
 */
export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

/**
 * Resolves current user from request or server cookies
 */
export async function getCurrentUser(req?: Request): Promise<AuthSessionUser | null> {
  if (req) {
    return getSessionUser(req);
  }

  try {
    const { cookies } = await import('next/headers');
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Requires authenticated session. Throws AuthError(401) if unauthenticated.
 */
export async function requireAuth(req?: Request): Promise<AuthSessionUser> {
  const user = await getCurrentUser(req);
  if (!user) {
    throw new AuthError('Unauthorized', 401);
  }
  return user;
}

/**
 * Requires authenticated session with specified role(s). Throws AuthError(401 or 403).
 */
export async function requireRole(
  requiredRole: UserRole | UserRole[],
  req?: Request
): Promise<AuthSessionUser> {
  const user = await requireAuth(req);
  if (!hasRole(user.role, requiredRole)) {
    throw new AuthError('Forbidden: Insufficient privileges', 403);
  }
  return user;
}

/**
 * Requires authenticated user to have ADMIN role. Throws AuthError(401 or 403).
 */
export async function requireAdmin(req?: Request): Promise<AuthSessionUser> {
  return requireRole(UserRole.ADMIN, req);
}

/**
 * Safely resolves tenant company profile ID for the current session.
 */
export async function resolveTenantProfileId(session: AuthSessionUser): Promise<string | null> {
  if (session.companyProfileId) {
    return session.companyProfileId;
  }

  try {
    const { prisma } = await import('./prisma');
    const profile = await prisma.companyProfile.findUnique({
      where: { userId: session.id },
      select: { id: true },
    });
    return profile?.id || null;
  } catch {
    return null;
  }
}

