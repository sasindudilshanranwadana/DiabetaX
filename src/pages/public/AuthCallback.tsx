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

    // onAuthStateChange fires reliably after Supabase processes the URL hash tokens
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        routeUser(session.user.id)
      } else if (event === 'INITIAL_SESSION' && !session) {
        // No session and no tokens in hash — go back to login
        if (!handled) {
          handled = true
          navigate('/login', { replace: true })
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <GridBackground className="flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        <Logo size="lg" />
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Signing you in…</span>
        </div>
      </motion.div>
    </GridBackground>
  )
}
