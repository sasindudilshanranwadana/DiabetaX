import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, User, ClipboardList, BarChart3,
  Download, Brain, Settings, LogOut, Activity, Users, FileText,
  AlertTriangle, Stethoscope,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Role } from '../../types/database'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
  minRole?: Role
}

const patientNav: NavItem[] = [
  { to: '/patient/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/patient/profile', icon: <User size={18} />, label: 'My Profile' },
  { to: '/patient/survey/baseline', icon: <ClipboardList size={18} />, label: 'Baseline Survey' },
  { to: '/patient/submissions', icon: <FileText size={18} />, label: 'My Submissions' },
  { to: '/patient/insights', icon: <Activity size={18} />, label: 'My Insights' },
]

const adminNav: NavItem[] = [
  { to: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/admin/participants', icon: <Users size={18} />, label: 'Participants' },
  { to: '/admin/submissions', icon: <FileText size={18} />, label: 'Submissions' },
  { to: '/admin/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
  { to: '/admin/data-quality', icon: <AlertTriangle size={18} />, label: 'Data Quality' },
  { to: '/admin/exports', icon: <Download size={18} />, label: 'Exports' },
  { to: '/admin/models', icon: <Brain size={18} />, label: 'AI Models' },
  { to: '/admin/cds', icon: <Stethoscope size={18} />, label: 'CDS Module', minRole: 'clinician_admin' },
  { to: '/admin/settings', icon: <Settings size={18} />, label: 'Settings', minRole: 'super_admin' },
]

function NavItemLink({ to, icon, label }: NavItem) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-primary/20 text-primary-400 border border-primary/30'
            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

interface SidebarProps {
  role: Role | null
}

export function Sidebar({ role }: SidebarProps) {
  const navigate = useNavigate()
  const isAdmin = role && ['research_admin', 'clinician_admin', 'super_admin'].includes(role)
  const nav = isAdmin ? adminNav : patientNav

  const roleHierarchy: Role[] = ['patient', 'research_admin', 'clinician_admin', 'super_admin']
  const userRoleIndex = role ? roleHierarchy.indexOf(role) : -1

  const filteredNav = nav.filter(item => {
    if (!item.minRole) return true
    return userRoleIndex >= roleHierarchy.indexOf(item.minRole)
  })

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-surface-100/80 backdrop-blur-sm border-r border-white/5 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Activity size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-wide">DiabetaX</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Research Platform</p>
        </div>
      </div>

      {/* Role badge */}
      {role && (
        <div className="px-5 pt-4 pb-2">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
            {role.replace(/_/g, ' ')}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {filteredNav.map(item => (
          <NavItemLink key={item.to} {...item} />
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
