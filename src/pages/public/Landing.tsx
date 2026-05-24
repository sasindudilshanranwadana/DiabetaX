import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Database, Activity, Sparkles } from 'lucide-react'
import { GridBackground } from '../../components/ui/effects/grid-bg'
import { BackgroundBeams } from '../../components/ui/effects/beams'
import { SpotlightCard } from '../../components/ui/effects/spotlight'
import { Button } from '../../components/ui/primitives/button'
import { Badge } from '../../components/ui/primitives/badge'
import { Logo } from '../../components/ui/Logo'

const features = [
  { icon: Database, label: '8+ Drug Classes', desc: 'Metformin, SGLT2, GLP-1, insulin and more' },
  { icon: Activity, label: '4 Core Outcomes', desc: 'HbA1c, side effects, adherence, quality of life' },
  { icon: Shield, label: 'RLS-secured', desc: 'Row-level security & full audit trail' },
]

export function Landing() {
  return (
    <GridBackground>
      <BackgroundBeams />

      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5 backdrop-blur-sm">
        <Logo size="md" />
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" variant="glow">
            <Link to="/register">Get started <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center px-6 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl text-center"
        >
          <Badge variant="default" className="mb-6 gap-1.5">
            <Sparkles className="h-3 w-3" />
            Academic Research Platform
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
            Diabetes Treatment
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-purple-400 bg-clip-text text-transparent">
              Outcomes & Safety
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            A secure research platform studying the effectiveness and long-term side effects of anti-diabetic medications, with a focus on South Asian patient data.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="xl" variant="gradient">
              <Link to="/register">Participate in Research <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link to="/login">Researcher sign in</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 max-w-4xl w-full"
        >
          {features.map((f, i) => (
            <SpotlightCard key={i} className="p-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-400 mb-4">
                <f.icon size={18} />
              </div>
              <p className="text-white font-semibold mb-1">{f.label}</p>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </SpotlightCard>
          ))}
        </motion.div>
      </main>

      <footer className="relative z-10 px-6 py-8 text-center text-xs text-muted-foreground border-t border-white/5 mt-20">
        DiabetaX — Academic research by R M D L Sarathchandra (ID 30068), supervised by Dr. Damayanthi Dahanayake. Not medical advice.
      </footer>
    </GridBackground>
  )
}
