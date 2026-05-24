import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { GridBackground } from '../../components/ui/effects/grid-bg'
import { GlowingBorder } from '../../components/ui/effects/glowing-border'
import { Button } from '../../components/ui/primitives/button'
import { Input } from '../../components/ui/primitives/input'
import { Label } from '../../components/ui/primitives/label'
import { GoogleButton } from '../../components/ui/GoogleButton'
import { Logo } from '../../components/ui/Logo'
import { toast } from '../../components/ui/primitives/toaster'

export function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Account created — please review and accept consent.')
    navigate('/consent')
  }

  return (
    <GridBackground className="flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <GlowingBorder>
          <div className="p-8">
            <h2 className="text-xl font-semibold text-white mb-1">Create your account</h2>
            <p className="text-sm text-muted-foreground mb-6">Join the research study in under a minute.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="pl-9 h-11" placeholder="you@example.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="pl-9 h-11" placeholder="Min. 8 characters" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="confirm" type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} className="pl-9 h-11" placeholder="••••••••" />
                </div>
              </div>

              <Button type="submit" variant="glow" disabled={loading} className="w-full h-11">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : 'Create account'}
              </Button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <GoogleButton label="Sign up with Google" />

            <p className="text-center text-xs text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary transition-colors font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </GlowingBorder>

        <p className="text-center text-xs text-muted-foreground/70 mt-4 px-4">
          By creating an account you agree to participate in academic research under informed consent.
        </p>
      </motion.div>
    </GridBackground>
  )
}
