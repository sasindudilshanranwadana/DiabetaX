import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { GlassCard } from '../../components/ui/GlassCard'
import { DataTable } from '../../components/ui/DataTable'
import type { Role } from '../../types/database'

interface UserRow {
  uid: string
  participant_code: string
  role: Role
  created_at: string
}

const ROLES: Role[] = ['patient', 'research_admin', 'clinician_admin', 'super_admin']

export function Settings() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('uid, participant_code, role, created_at').order('created_at', { ascending: false })
    setUsers((data ?? []) as UserRow[])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  async function updateRole(uid: string, role: Role) {
    setUpdating(uid)
    await supabase.from('profiles').update({ role }).eq('uid', uid)
    setUpdating(null)
    loadUsers()
  }

  const columns = [
    { key: 'participant_code', header: 'Participant Code' },
    {
      key: 'role',
      header: 'Role',
      render: (r: UserRow) => (
        <select
          value={r.role}
          onChange={e => updateRole(r.uid, e.target.value as Role)}
          disabled={updating === r.uid}
          className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300 focus:outline-none focus:border-primary/50 disabled:opacity-50"
        >
          {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
        </select>
      ),
    },
    { key: 'created_at', header: 'Registered', render: (r: UserRow) => new Date(r.created_at).toLocaleDateString() },
  ]

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Settings</h2>
        <p className="text-gray-400 text-sm">Super admin controls: role management and platform configuration.</p>
      </div>

      <GlassCard>
        <h3 className="text-sm font-semibold text-white mb-4">Role Management</h3>
        <p className="text-xs text-gray-500 mb-4">
          Assign roles to users. Changes take effect immediately. Role hierarchy: patient &lt; research_admin &lt; clinician_admin &lt; super_admin.
        </p>
        <DataTable columns={columns} data={users} searchable searchKeys={['participant_code']} emptyMessage="No users found." />
      </GlassCard>
    </div>
  )
}
