import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface ConsentGuardProps {
  uid: string | undefined
  children: ReactNode
}

export function ConsentGuard({ uid, children }: ConsentGuardProps) {
  const [consented, setConsented] = useState<boolean | null>(null)

  useEffect(() => {
    if (!uid) return
    supabase
      .from('consents')
      .select('consented')
      .eq('uid', uid)
      .eq('consented', true)
      .maybeSingle()
      .then(({ data }) => setConsented(!!data))
  }, [uid])

  if (consented === null) return null
  if (!consented) return <Navigate to="/consent" replace />
  return <>{children}</>
}
