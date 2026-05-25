import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Database, Activity, Sparkles, ClipboardList, LineChart, Users, FlaskConical, Lock, BookOpen } from 'lucide-react'
import { GridBackground } from '../../components/ui/effects/grid-bg'
import { BackgroundBeams } from '../../components/ui/effects/beams'
import { SpotlightCard } from '../../components/ui/effects/spotlight'
import { Button } from '../../components/ui/primitives/button'
import { Badge } from '../../components/ui/primitives/badge'
import { Logo } from '../../components/ui/Logo'

const features = [
  { icon: Database, label: '8+ Drug Classes', desc: 'Metformin, SGLT2, GLP-1, DPP-4, sulfonylureas, TZDs, insulin and more' },
  { icon: Activity, label: '4 Core Outcomes', desc: 'HbA1c reduction, side effects, adherence, quality of life' },
  { icon: Shield, label: 'RLS-secured', desc: 'Row-level security, encrypted at rest, full audit trail' },
]

const studySteps = [
  { icon: ClipboardList, title: 'Sign up & consent', desc: 'Create an account, review the informed consent, and join the study in under 2 minutes.' },
  { icon: FlaskConical, title: 'Baseline survey', desc: '15–20 minute questionnaire about your diabetes, medications, side effects, and lifestyle.' },
  { icon: LineChart, title: 'Follow-ups', desc: 'Short check-ins at 3 and 6 months to track changes in HbA1c, side effects, and treatment satisfaction.' },
  { icon: BookOpen, title: 'Contribute to research', desc: 'Your anonymised data helps fill the gap in South Asian diabetes treatment evidence.' },
]

const trustPoints = [
  { icon: Lock, title: 'Your name is never stored', desc: 'You are identified only by a randomly generated participant code. Researchers see de-identified data only.' },
  { icon: Users, title: 'You stay in control', desc: 'Participation is fully voluntary. You can withdraw at any time without giving a reason.' },
  { icon: Shield, title: 'Not medical advice', desc: 'DiabetaX is a research platform. Always consult your healthcare provider for treatment decisions.' },
]

export function Landing() {
  return (
    <GridBackground>
      <BackgroundBeams />

      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5 backdrop-blur-sm">
        <Logo size="md" linkTo="/" />
        <div className="flex gap-2">
          <Button asChild size="sm" variant="glow">
            <Link to="/login">Sign in <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center px-6 py-20 md:py-28">
        {/* Hero */}
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
            A secure research platform evaluating the effectiveness and long-term side effects of commonly used anti-diabetic medications, with a particular focus on the under-represented South Asian population.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="xl" variant="gradient">
              <Link to="/login">Sign in to continue <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link to="/register">Create an account</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/70 mt-4">New here? Create an account to join the study as a participant.</p>
        </motion.div>

        {/* Quick feature cards */}
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

        {/* About the study */}
        <section className="max-w-4xl w-full mt-32">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">About the study</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why this research matters</h2>
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              South Asian populations face a disproportionate burden of type 2 diabetes, yet most clinical evidence on anti-diabetic drug effectiveness and side effects comes from Western cohorts. DiabetaX collects real-world outcome data — HbA1c response, side-effect patterns, adherence, and quality of life — directly from participants, building an evidence base that better reflects this population.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SpotlightCard className="p-6">
              <h3 className="text-white font-semibold mb-2">Principal Investigator</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="text-white">R M D L Sarathchandra</span> (Student ID 30068)
              </p>
              <p className="text-sm text-muted-foreground mt-1">Supervisor: <span className="text-white">Dr. Damayanthi Dahanayake</span></p>
            </SpotlightCard>

            <SpotlightCard className="p-6">
              <h3 className="text-white font-semibold mb-2">Study scope</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Baseline survey + optional 3-month and 6-month follow-ups. Covers Metformin, Sulfonylureas, TZDs, DPP-4 inhibitors, GLP-1 agonists, SGLT2 inhibitors, Alpha-glucosidase inhibitors, and Insulin.
              </p>
            </SpotlightCard>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-5xl w-full mt-32">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">How it works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Four simple steps</h2>
            <p className="text-muted-foreground">From sign-up to contributing to published research.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {studySteps.map((s, i) => (
              <SpotlightCard key={i} className="p-6 relative">
                <div className="absolute top-4 right-4 text-2xl font-bold text-white/10">{String(i + 1).padStart(2, '0')}</div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-400 mb-4">
                  <s.icon size={18} />
                </div>
                <p className="text-white font-semibold mb-2">{s.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </SpotlightCard>
            ))}
          </div>
        </section>

        {/* Privacy / trust */}
        <section className="max-w-4xl w-full mt-32">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">Privacy & ethics</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Your data is protected</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trustPoints.map((t, i) => (
              <SpotlightCard key={i} className="p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-400 mb-4">
                  <t.icon size={18} />
                </div>
                <p className="text-white font-semibold mb-2">{t.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
              </SpotlightCard>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-3xl w-full mt-32 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to contribute?</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Whether you live with diabetes or are a researcher accessing study data, sign in to continue. New participants can create an account in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="xl" variant="gradient">
              <Link to="/login">Sign in <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link to="/register">Create account</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="relative z-10 px-6 py-8 text-center text-xs text-muted-foreground border-t border-white/5 mt-20 space-y-1">
        <p>DiabetaX — Academic research by R M D L Sarathchandra (ID 30068), supervised by Dr. Damayanthi Dahanayake.</p>
        <p className="text-muted-foreground/70">For research purposes only. Not medical advice.</p>
      </footer>
    </GridBackground>
  )
}
