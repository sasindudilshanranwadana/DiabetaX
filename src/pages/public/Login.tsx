import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { defaultRouteForRole } from '../../lib/auth-routing'
import type { Role } from '../../types/database'
import { GridBackground } from '../../components/ui/effects/grid-bg'
import { GlowingBorder } from '../../components/ui/effects/glowing-border'
import { Button } from '../../components/ui/primitives/button'
import { Input } from '../../components/ui/primitives/input'
import { Label } from '../../components/ui/primitives/label'
import { GoogleButton } from '../../components/ui/GoogleButton'
import { Logo } from '../../components/ui/Logo'
import { toast } from '../../components/ui/primitives/toaster'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // Check consent
    const { data: consent } = await supabase
      .from('consents')
      .select('consented')
      .eq('uid', data.user.id)
      .eq('consented', true)
      .maybeSingle()

    if (!consent) {
      navigate('/consent')
      return
    }

    // Get role and route accordingly
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('uid', data.user.id)
      .maybeSingle()

    navigate(defaultRouteForRole((profile?.role as Role | undefined) ?? 'patient'))
  }

  return (
    <GridBackground className="flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <Logo size="lg" linkTo="/" />
        </div>

        <GlowingBorder>
          <div className="p-8">
            <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
            <p className="text-sm text-muted-foreground mb-6">Sign in to continue your research participation.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-9 h-11"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-9 h-11"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/reset-password" className="text-xs text-primary-400 hover:text-primary transition-colors">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" variant="glow" disabled={loading} className="w-full h-11">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : 'Sign in'}
              </Button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <GoogleButton />

            <p className="text-center text-xs text-muted-foreground mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary transition-colors font-medium">
                Create one
              </Link>
            </p>
          </div>
        </GlowingBorder>
      </motion.div>
    </GridBackground>
  )
}
