import { Bell, ShieldAlert } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { Role } from '../../types/database'

interface TopbarProps {
  user: User | null
  role: Role | null
  title?: string
}

const ROLE_LABELS: Record<string, string> = {
  patient: 'Patient',
  research_admin: 'Research Admin',
  clinician_admin: 'Clinician Admin',
  super_admin: 'Super Admin',
}

export function Topbar({ user, role, title }: TopbarProps) {
  return (
    <header className="fixed top-0 left-60 right-0 h-14 bg-surface-100/80 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-6 z-30">
      <h1 className="text-sm font-semibold text-gray-200 truncate">{title ?? 'DiabetaX'}</h1>

      <div className="flex items-center gap-4">
        {role === 'clinician_admin' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <ShieldAlert size={12} className="text-amber-400" />
            <span className="text-[11px] text-amber-400 font-medium">Clinician Access</span>
          </div>
        )}

        <button className="text-gray-500 hover:text-gray-300 transition-colors">
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary-400">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-gray-300 truncate max-w-[140px]">{user?.email}</p>
            <p className="text-[10px] text-gray-500">{role ? ROLE_LABELS[role] : ''}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
