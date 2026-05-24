import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfile(uid: string | undefined): { profile: Profile | null; loading: boolean; refetch: () => void } {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!uid) {
      setProfile(null)
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from('profiles')
      .select('*')
      .eq('uid', uid)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setProfile(data)
        setLoading(false)
      })
  }, [uid, tick])

  return { profile, loading, refetch: () => setTick(t => t + 1) }
}
