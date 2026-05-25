import { useEffect } from 'react'
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

  useEffect(() => {
    let handled = false

    async function routeUser(userId: string) {
      if (handled) return
      handled = true

      const { data: consent } = await supabase
        .from('consents')
        .select('consented')
        .eq('uid', userId)
        .eq('consented', true)
        .maybeSingle()

      if (!consent) {
        navigate('/consent', { replace: true })
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('uid', userId)
        .maybeSingle()

      navigate(defaultRouteForRole((profile?.role as Role | undefined) ?? 'patient'), { replace: true })
    }

    // Primary: listen for SIGNED_IN event after Supabase processes the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        routeUser(session.user.id)
      }
      // Do NOT redirect to /login on INITIAL_SESSION with no session —
      // the hash tokens may not be parsed yet at that point
    })

    // Fallback: after 2s, check session directly in case onAuthStateChange already fired
    const fallback = setTimeout(async () => {
      if (handled) return
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        routeUser(session.user.id)
      } else {
        // Genuinely no session after 2s — something went wrong
        handled = true
        navigate('/login', { replace: true })
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
      </motion.div>
    </GridBackground>
  )
}
