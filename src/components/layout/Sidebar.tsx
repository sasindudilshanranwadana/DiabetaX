import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, User, ClipboardList, BarChart3, Download, Brain, Settings,
  LogOut, Activity, Users, FileText, AlertTriangle, Stethoscope, TrendingUp,
} from 'lucide-react'
import type { Role } from '../../types/database'
import { supabase } from '../../lib/supabase'
import { hasMinRole } from '../../hooks/useRole'
import { isAdminRole } from '../../lib/auth-routing'
import { Logo } from '../ui/Logo'
import { Badge } from '../ui/primitives/badge'
import { cn } from '../../lib/utils'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
  minRole?: Role
}

const PATIENT_NAV: NavItem[] = [
  { to: '/patient/dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
  { to: '/patient/profile', icon: <User size={17} />, label: 'My Profile' },
  { to: '/patient/survey/baseline', icon: <ClipboardList size={17} />, label: 'Baseline Survey' },
  { to: '/patient/submissions', icon: <FileText size={17} />, label: 'My Submissions' },
  { to: '/patient/insights', icon: <TrendingUp size={17} />, label: 'My Insights' },
]

const ADMIN_NAV: NavItem[] = [
  { to: '/admin/dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
  { to: '/admin/participants', icon: <Users size={17} />, label: 'Participants' },
  { to: '/admin/submissions', icon: <FileText size={17} />, label: 'Submissions' },
  { to: '/admin/analytics', icon: <BarChart3 size={17} />, label: 'Analytics' },
  { to: '/admin/data-quality', icon: <AlertTriangle size={17} />, label: 'Data Quality' },
  { to: '/admin/exports', icon: <Download size={17} />, label: 'Exports' },
  { to: '/admin/models', icon: <Brain size={17} />, label: 'AI Models' },
  { to: '/admin/cds', icon: <Stethoscope size={17} />, label: 'CDS Module', minRole: 'clinician_admin' },
  { to: '/admin/settings', icon: <Settings size={17} />, label: 'Settings', minRole: 'super_admin' },
]

const ROLE_LABEL: Record<Role, string> = {
  patient: 'Patient',
  research_admin: 'Researcher',
  clinician_admin: 'Clinician',
  super_admin: 'Super Admin',
}

const ROLE_BADGE: Record<Role, 'default' | 'success' | 'info' | 'warning'> = {
  patient: 'default',
  research_admin: 'success',
  clinician_admin: 'warning',
  super_admin: 'info',
}

interface SidebarProps {
  role: Role | null
}

export function Sidebar({ role }: SidebarProps) {
  const navigate = useNavigate()
  const isAdmin = isAdminRole(role)
  const nav = isAdmin ? ADMIN_NAV : PATIENT_NAV
  const visibleNav = nav.filter(item => !item.minRole || hasMinRole(role, item.minRole))

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#070D1A] border-r border-white/5 flex flex-col z-30">
      <div className="px-5 py-5 border-b border-white/5">
        <Logo size="md" />
      </div>

      {role && (
        <div className="px-5 py-3 border-b border-white/5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Signed in as</p>
          <Badge variant={ROLE_BADGE[role]}>{ROLE_LABEL[role]}</Badge>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <p className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground/70">
          {isAdmin ? 'Administration' : 'Research Participation'}
        </p>
        {visibleNav.map((item, i) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
          >
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary-400 font-medium'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-primary rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  {item.icon}
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
        <div className="flex items-center gap-1.5 mt-3 px-3 text-[10px] text-muted-foreground/50">
          <Activity size={10} />
          <span>DiabetaX v0.1</span>
        </div>
      </div>
    </aside>
  )
}
