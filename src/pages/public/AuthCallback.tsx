import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { defaultRouteForRole } from '../../lib/auth-routing'
import type { Role } from '../../types/database'
import { GridBackground } from '../../components/ui/effects/grid-bg'
import { Logo } from '../../components/ui/Logo'

export function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Waiting for Google…')

  useEffect(() => {
    let handled = false

    async function routeUser(userId: string) {
      if (handled) return
      handled = true
      setStatus('Checking consent…')

      const { data: consent, error: ce } = await supabase
        .from('consents')
        .select('consented')
        .eq('uid', userId)
        .eq('consented', true)
        .maybeSingle()

      setStatus(`Consent: ${consent ? 'yes' : 'no'} ${ce ? '| err:' + ce.message : ''}`)

      if (!consent) {
        navigate('/consent', { replace: true })
        return
      }

      const { data: profile, error: pe } = await supabase
        .from('profiles')
        .select('role')
        .eq('uid', userId)
        .maybeSingle()

      setStatus(`Role: ${profile?.role ?? 'none'} ${pe ? '| err:' + pe.message : ''}`)

      navigate(defaultRouteForRole((profile?.role as Role | undefined) ?? 'patient'), { replace: true })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setStatus(`Event: ${event} | user: ${session?.user?.id?.slice(0, 8) ?? 'null'}`)
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        routeUser(session.user.id)
      }
    })

    const fallback = setTimeout(async () => {
      if (handled) return
      setStatus('Fallback: checking session…')
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        routeUser(session.user.id)
      } else {
        setStatus('No session found — redirecting to login')
        handled = true
        setTimeout(() => navigate('/login', { replace: true }), 2000)
      }
    }, 2000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(fallback)
    }
  }, [navigate])

  return (
    <GridBackground className="flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        <Logo size="lg" linkTo="/" />
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Signing you in…</span>
        </div>
        <div className="text-xs text-yellow-400 font-mono px-4 text-center max-w-sm">{status}</div>
      </motion.div>
    </GridBackground>
  )
}
