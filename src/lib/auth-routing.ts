import type { Role } from '../types/database'

/**
 * Returns the default landing route for a given role.
 * - patients land on their dashboard
 * - all admin roles land on the admin dashboard
 */
export function defaultRouteForRole(role: Role | null | undefined): string {
  if (!role) return '/patient/dashboard'
  if (role === 'patient') return '/patient/dashboard'
  return '/admin/dashboard'
}

export function isAdminRole(role: Role | null | undefined): boolean {
  return role === 'research_admin' || role === 'clinician_admin' || role === 'super_admin'
}
