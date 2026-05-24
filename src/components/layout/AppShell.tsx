import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import type { User } from '@supabase/supabase-js'
import type { Role } from '../../types/database'

const PAGE_TITLES: Record<string, string> = {
  '/patient/dashboard': 'Dashboard',
  '/patient/profile': 'My Profile',
  '/patient/survey/baseline': 'Baseline Survey',
  '/patient/survey/followup-3m': '3-Month Follow-up Survey',
  '/patient/survey/followup-6m': '6-Month Follow-up Survey',
  '/patient/submissions': 'My Submissions',
  '/patient/insights': 'My Insights',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/participants': 'Participants',
  '/admin/submissions': 'Submissions',
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
    <div className="min-h-screen bg-gradient-to-br from-surface-200 via-surface-200 to-surface-300">
      <Sidebar role={role} />
      <Topbar user={user} role={role} title={title} />
      <main className="ml-60 pt-14 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
