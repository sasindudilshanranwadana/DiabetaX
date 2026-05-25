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
  const [status, setStatus] = useState('Completing sign-in…')

  useEffect(() => {
    let cancelled = false

    async function routeUser(userId: string) {
      if (cancelled) return
      setStatus('Checking consent…')
      const { data: consent } = await supabase
        .from('consents')
        .select('consented')
        .eq('uid', userId)
        .eq('consented', true)
        .maybeSingle()

      if (cancelled) return
      if (!consent) {
        navigate('/consent', { replace: true })
        return
      }

      setStatus('Loading profile…')
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('uid', userId)
        .maybeSingle()

      if (cancelled) return
      navigate(defaultRouteForRole((profile?.role as Role | undefined) ?? 'patient'), { replace: true })
    }

    async function handle() {
      // 1) Check if session already exists (detectSessionInUrl may have auto-exchanged)
      const { data: { session: existing } } = await supabase.auth.getSession()
      if (existing?.user) {
        await routeUser(existing.user.id)
        return
      }

      // 2) Try manual PKCE code exchange
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      const errorParam = url.searchParams.get('error_description') || url.searchParams.get('error')

      if (errorParam) {
        setStatus(`Google error: ${errorParam}`)
        setTimeout(() => navigate('/login', { replace: true }), 2500)
        return
      }

      if (code) {
        setStatus('Exchanging code…')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && data.session?.user) {
          await routeUser(data.session.user.id)
          return
        }
        // Code may already be used — fall through to wait for SIGNED_IN
      }

      // 3) Wait for auth state to fire (handles race conditions)
      setStatus('Waiting for session…')
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
        if (cancelled) return
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && s?.user) {
          subscription.unsubscribe()
          await routeUser(s.user.id)
        }
      })

      // Final timeout
      setTimeout(() => {
        if (cancelled) return
        subscription.unsubscribe()
        supabase.auth.getSession().then(({ data: { session: s } }) => {
          if (cancelled) return
          if (s?.user) {
            routeUser(s.user.id)
          } else {
            setStatus('Sign-in did not complete. Please try again.')
            setTimeout(() => navigate('/login', { replace: true }), 2000)
          }
        })
      }, 4000)
    }

    handle()
    return () => { cancelled = true }
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
          <span className="text-sm">{status}</span>
        </div>
      </motion.div>
    </GridBackground>
  )
}
