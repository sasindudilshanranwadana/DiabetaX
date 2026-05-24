import { useNavigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import type { Role } from '../../types/database'
import { LogOut, ShieldAlert, User as UserIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/primitives/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/primitives/dropdown'

interface TopbarProps {
  user: User | null
  role: Role | null
  title: string
}

export function Topbar({ user, role, title }: TopbarProps) {
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <header className="fixed top-0 left-60 right-0 h-14 bg-[#070D1A]/80 backdrop-blur-md border-b border-white/5 px-6 flex items-center justify-between z-20">
      <h1 className="text-sm font-semibold text-foreground tracking-tight">{title}</h1>

      <div className="flex items-center gap-3">
        {role === 'clinician_admin' && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-medium">
            <ShieldAlert size={11} />
            Clinician Access
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent text-white text-xs font-semibold flex items-center justify-center">
                {initials}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-foreground text-sm truncate">{user?.email}</p>
              <p className="text-muted-foreground text-xs mt-0.5 capitalize">{role?.replace('_', ' ')}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {role === 'patient' && (
              <DropdownMenuItem onSelect={() => navigate('/patient/profile')}>
                <UserIcon size={14} />
                My Profile
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={handleSignOut} className="text-red-400 focus:text-red-400 focus:bg-red-500/10">
              <LogOut size={14} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
