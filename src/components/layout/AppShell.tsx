import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import type { User } from '@supabase/supabase-js'
import type { Role } from '../../types/database'

const PAGE_TITLES: Record<string, string> = {
  '/patient/dashboard': 'Dashboard',
  '/patient/profile': 'My Profile',
  '/patient/survey/baseline': 'Baseline Survey',
  '/patient/survey/followup-3m': '3-Month Follow-up',
  '/patient/survey/followup-6m': '6-Month Follow-up',
  '/patient/submissions': 'My Submissions',
  '/patient/insights': 'My Insights',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/participants': 'Participants',
  '/admin/submissions': 'All Submissions',
  '/admin/analytics': 'Analytics',
  '/admin/data-quality': 'Data Quality',
  '/admin/exports': 'Exports',
  '/admin/models': 'AI Models',
  '/admin/cds': 'Clinician Decision Support',
  '/admin/settings': 'Settings',
}

interface AppShellProps {
  user: User | null
  role: Role | null
}

export function AppShell({ user, role }: AppShellProps) {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'DiabetaX'

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />

      <Sidebar role={role} />
      <Topbar user={user} role={role} title={title} />

      <main className="ml-60 pt-14 min-h-screen relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="p-6 md:p-8"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
