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
    async function routeUser(userId: string) {
      setStatus('Checking consent…')
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

      setStatus('Loading profile…')
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('uid', userId)
        .maybeSingle()

      navigate(defaultRouteForRole((profile?.role as Role | undefined) ?? 'patient'), { replace: true })
    }

    async function handle() {
      // PKCE flow: exchange ?code=xxx for a session
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')

      if (code) {
        setStatus('Exchanging code…')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setStatus(`Error: ${error.message}`)
          setTimeout(() => navigate('/login', { replace: true }), 2500)
          return
        }
        if (data.session?.user) {
          await routeUser(data.session.user.id)
          return
        }
      }

      // Implicit/hash flow fallback — let detectSessionInUrl process the hash
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await routeUser(session.user.id)
        return
      }

      // Wait for SIGNED_IN as a last resort
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
        if (event === 'SIGNED_IN' && s?.user) {
          subscription.unsubscribe()
          await routeUser(s.user.id)
        }
      })

      setTimeout(() => {
        subscription.unsubscribe()
        setStatus('No session — returning to login')
        setTimeout(() => navigate('/login', { replace: true }), 1500)
      }, 5000)
    }

    handle()
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
