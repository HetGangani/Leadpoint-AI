import { UserRole } from '@/types';

export interface AuthSessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

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
