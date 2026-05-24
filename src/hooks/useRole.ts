import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Role } from '../types/database'

export function useRole(uid: string | undefined): { role: Role | null; loading: boolean } {
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setRole(null)
      setLoading(false)
      return
    }

    supabase
      .from('profiles')
      .select('role')
      .eq('uid', uid)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setRole(data.role as Role)
        setLoading(false)
      })
  }, [uid])

  return { role, loading }
}

export function hasMinRole(userRole: Role | null, required: Role): boolean {
  const hierarchy: Role[] = ['patient', 'research_admin', 'clinician_admin', 'super_admin']
  if (!userRole) return false
  return hierarchy.indexOf(userRole) >= hierarchy.indexOf(required)
}
