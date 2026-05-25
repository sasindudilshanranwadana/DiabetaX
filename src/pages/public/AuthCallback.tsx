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
    let cancelled = false

    async function routeUser(userId: string) {
      if (cancelled) return
      const { data: consent } = await supabase
        .from('consents').select('consented').eq('uid', userId).eq('consented', true).maybeSingle()
      if (cancelled) return
      if (!consent) { navigate('/consent', { replace: true }); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('uid', userId).maybeSingle()
      if (cancelled) return
      navigate(defaultRouteForRole((profile?.role as Role | undefined) ?? 'patient'), { replace: true })
    }

    async function handle() {
      const { data: { session: existing } } = await supabase.auth.getSession()
      if (existing?.user) return routeUser(existing.user.id)

      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      if (code) {
        const { data } = await supabase.auth.exchangeCodeForSession(code)
        if (data.session?.user) return routeUser(data.session.user.id)
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
        if (cancelled) return
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && s?.user) {
          subscription.unsubscribe()
          await routeUser(s.user.id)
        }
      })

      setTimeout(() => {
        if (cancelled) return
        subscription.unsubscribe()
        navigate('/login', { replace: true })
      }, 5000)
    }

    handle()
    return () => { cancelled = true }
  }, [navigate])

  return (
    <GridBackground className="flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center gap-6">
        <Logo size="lg" linkTo="/" />
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Signing you in…</span>
        </div>
      </motion.div>
    </GridBackground>
  )
}
