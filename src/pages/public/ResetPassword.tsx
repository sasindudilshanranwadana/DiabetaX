import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { GridBackground } from '../../components/ui/effects/grid-bg'
import { GlowingBorder } from '../../components/ui/effects/glowing-border'
import { Button } from '../../components/ui/primitives/button'
import { Input } from '../../components/ui/primitives/input'
import { Label } from '../../components/ui/primitives/label'
import { Logo } from '../../components/ui/Logo'
import { toast } from '../../components/ui/primitives/toaster'

export function ResetPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setSent(true)
  }

  return (
    <GridBackground className="flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex justify-center mb-8"><Logo size="lg" /></div>

        <GlowingBorder>
          <div className="p-8">
            <h2 className="text-xl font-semibold text-white mb-1">Reset password</h2>
            <p className="text-sm text-muted-foreground mb-6">We'll send you a link to reset it.</p>

            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
              >
                <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-emerald-400 font-medium text-sm">Check your email</p>
                  <p className="text-xs text-muted-foreground mt-1">We sent a reset link to {email}.</p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="pl-9 h-11" placeholder="you@example.com" />
                  </div>
                </div>

                <Button type="submit" variant="glow" disabled={loading} className="w-full h-11">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : 'Send reset link'}
                </Button>
              </form>
            )}

            <Link to="/login" className="flex items-center justify-center gap-1.5 text-xs text-primary-400 hover:text-primary transition-colors mt-6">
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </Link>
          </div>
        </GlowingBorder>
      </motion.div>
    </GridBackground>
  )
}
