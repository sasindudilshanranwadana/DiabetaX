import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Role } from '../../types/database'
import { hasMinRole } from '../../hooks/useRole'

interface RoleGuardProps {
  role: Role | null
  required: Role
  children: ReactNode
}

export function RoleGuard({ role, required, children }: RoleGuardProps) {
  if (!role || !hasMinRole(role, required)) {
    return <Navigate to="/unauthorized" replace />
  }
  return <>{children}</>
}
