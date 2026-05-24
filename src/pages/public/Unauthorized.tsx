import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Home } from 'lucide-react'
import { GridBackground } from '../../components/ui/effects/grid-bg'
import { Button } from '../../components/ui/primitives/button'
import { Logo } from '../../components/ui/Logo'

export function Unauthorized() {
  return (
    <GridBackground className="flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center"
      >
        <div className="flex justify-center mb-8"><Logo size="md" /></div>

        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Lock className="h-7 w-7 text-red-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">You don't have permission to view this page. If you believe this is an error, contact your administrator.</p>

        <div className="flex gap-3 justify-center">
          <Button asChild variant="glow">
            <Link to="/patient/dashboard"><Home className="mr-1 h-4 w-4" /> Go to dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </motion.div>
    </GridBackground>
  )
}
