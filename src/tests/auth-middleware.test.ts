import { hasRole, isAdmin, isClient, isSDR } from '../lib/auth';
import { UserRole } from '../types';

export async function runAuthMiddlewareTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  const assert = (condition: boolean, message: string) => {
    if (!condition) {
      throw new Error(`Assertion Failed: ${message}`);
    }
  };

  // Test 1: Role Hierarchy & Single/Array Role Matching
  try {
    assert(hasRole(UserRole.ADMIN, UserRole.ADMIN) === true, 'ADMIN user should match ADMIN requirement');
    assert(hasRole(UserRole.CLIENT, UserRole.ADMIN) === false, 'CLIENT user should not match ADMIN requirement');
    assert(hasRole(UserRole.CLIENT, [UserRole.CLIENT, UserRole.ADMIN]) === true, 'CLIENT user should match array requirement containing CLIENT');
    assert(hasRole(UserRole.SDR, [UserRole.CLIENT, UserRole.ADMIN]) === false, 'SDR user should not match array requirement containing only CLIENT and ADMIN');
    results.push({ name: 'Auth Middleware - Role Matching (hasRole)', passed: true });
  } catch (err: any) {
    results.push({ name: 'Auth Middleware - Role Matching (hasRole)', passed: false, error: err.message });
  }

  // Test 2: Helper Guards (isAdmin, isClient, isSDR)
  try {
    // Admin Guard
    assert(isAdmin(UserRole.ADMIN) === true, 'isAdmin should return true for ADMIN');
    assert(isAdmin(UserRole.CLIENT) === false, 'isAdmin should return false for CLIENT');
    assert(isAdmin(UserRole.SDR) === false, 'isAdmin should return false for SDR');

    // Client Guard (Allows CLIENT and ADMIN)
    assert(isClient(UserRole.CLIENT) === true, 'isClient should return true for CLIENT');
    assert(isClient(UserRole.ADMIN) === true, 'isClient should return true for ADMIN');
    assert(isClient(UserRole.SDR) === false, 'isClient should return false for SDR');

    // SDR Guard (Allows SDR and ADMIN)
    assert(isSDR(UserRole.SDR) === true, 'isSDR should return true for SDR');
    assert(isSDR(UserRole.ADMIN) === true, 'isSDR should return true for ADMIN');
    assert(isSDR(UserRole.CLIENT) === false, 'isSDR should return false for CLIENT');

    results.push({ name: 'Auth Middleware - Guard Helpers (isAdmin, isClient, isSDR)', passed: true });
  } catch (err: any) {
    results.push({ name: 'Auth Middleware - Guard Helpers (isAdmin, isClient, isSDR)', passed: false, error: err.message });
  }

  // Test 3: Simulated Route Middleware Authorization Logic
  try {
    const routeAccessMatrix = [
      { path: '/admin/settings', role: UserRole.ADMIN, allowed: true },
      { path: '/admin/settings', role: UserRole.CLIENT, allowed: false },
      { path: '/admin/settings', role: UserRole.SDR, allowed: false },
      { path: '/leads', role: UserRole.CLIENT, allowed: true },
      { path: '/leads', role: UserRole.ADMIN, allowed: true },
      { path: '/leads', role: UserRole.SDR, allowed: false },
      { path: '/voice/agent', role: UserRole.SDR, allowed: true },
      { path: '/voice/agent', role: UserRole.ADMIN, allowed: true },
    ];

    const evaluateRouteProtection = (path: string, userRole: UserRole): boolean => {
      if (path.startsWith('/admin')) {
        return isAdmin(userRole);
      }
      if (path.startsWith('/leads')) {
        return isClient(userRole);
      }
      if (path.startsWith('/voice')) {
        return isSDR(userRole);
      }
      return false;
    };

    for (const testCase of routeAccessMatrix) {
      const isAllowed = evaluateRouteProtection(testCase.path, testCase.role);
      assert(
        isAllowed === testCase.allowed,
        `Route ${testCase.path} for role ${testCase.role} expected allowed=${testCase.allowed}, got ${isAllowed}`
      );
    }

    results.push({ name: 'Auth Middleware - Route Protection Matrix Simulation', passed: true });
  } catch (err: any) {
    results.push({ name: 'Auth Middleware - Route Protection Matrix Simulation', passed: false, error: err.message });
  }

  return results;
}
