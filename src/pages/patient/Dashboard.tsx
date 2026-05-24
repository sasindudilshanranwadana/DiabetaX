import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Clock, AlertCircle, ClipboardList, User, BarChart2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { GlassCard } from '../../components/ui/GlassCard'

interface SurveyStatus {
  baseline: 'not_started' | 'draft' | 'submitted'
  followup_3m: 'not_started' | 'draft' | 'submitted'
  followup_6m: 'not_started' | 'draft' | 'submitted'
}

interface ProfileStatus {
  complete: boolean
}

export function PatientDashboard() {
  const [survey, setSurvey] = useState<SurveyStatus>({ baseline: 'not_started', followup_3m: 'not_started', followup_6m: 'not_started' })
  const [profile, setProfile] = useState<ProfileStatus>({ complete: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: surveys }, { data: patient }] = await Promise.all([
        supabase.from('surveys').select('survey_type, status').eq('uid', user.id),
        supabase.from('patients').select('uid').eq('uid', user.id).maybeSingle(),
      ])

      const statusMap: SurveyStatus = { baseline: 'not_started', followup_3m: 'not_started', followup_6m: 'not_started' }
      for (const s of surveys ?? []) {
        const key = s.survey_type as keyof SurveyStatus
        if (key in statusMap) {
          statusMap[key] = s.status === 'submitted' ? 'submitted' : 'draft'
        }
      }
      setSurvey(statusMap)
      setProfile({ complete: !!patient })
      setLoading(false)
    }
    load()
  }, [])

  function StatusBadge({ status }: { status: 'not_started' | 'draft' | 'submitted' }) {
    if (status === 'submitted') return <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle size={12} /> Submitted</span>
    if (status === 'draft') return <span className="flex items-center gap-1 text-xs text-amber-400"><Clock size={12} /> In progress</span>
    return <span className="flex items-center gap-1 text-xs text-gray-500"><AlertCircle size={12} /> Not started</span>
  }

  const surveyLinks = [
    { key: 'baseline' as const, label: 'Baseline Survey', href: '/patient/survey/baseline', desc: 'Initial medication and health data' },
    { key: 'followup_3m' as const, label: '3-Month Follow-up', href: '/patient/survey/followup-3m', desc: 'Progress check at 3 months' },
    { key: 'followup_6m' as const, label: '6-Month Follow-up', href: '/patient/survey/followup-6m', desc: 'Progress check at 6 months' },
  ]

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
        <p className="text-gray-400 text-sm">Track your research participation progress below.</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        <Link to="/patient/profile">
          <GlassCard className="hover:border-white/20 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary-400">
                <User size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Profile</p>
                <p className="text-sm font-medium text-white mt-0.5">{profile.complete ? 'Complete' : 'Set up profile'}</p>
              </div>
              {profile.complete && <CheckCircle size={14} className="ml-auto text-emerald-400" />}
            </div>
          </GlassCard>
        </Link>
        <Link to="/patient/submissions">
          <GlassCard className="hover:border-white/20 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                <ClipboardList size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Submissions</p>
                <p className="text-sm font-medium text-white mt-0.5">View history</p>
              </div>
            </div>
          </GlassCard>
        </Link>
        <Link to="/patient/insights">
          <GlassCard className="hover:border-white/20 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <BarChart2 size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Insights</p>
                <p className="text-sm font-medium text-white mt-0.5">My trends</p>
              </div>
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* Survey cards */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Surveys</h3>
        <div className="space-y-3">
          {surveyLinks.map(({ key, label, href, desc }) => (
            <GlassCard key={key} className="hover:border-white/20 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium text-sm">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={survey[key]} />
                  {survey[key] !== 'submitted' && (
                    <Link
                      to={href}
                      className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary-400 text-xs font-medium rounded-lg transition-colors"
                    >
                      {survey[key] === 'draft' ? 'Continue' : 'Start'}
                    </Link>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-400 text-xs">
        This platform is for research purposes only. No information here constitutes medical advice. Consult your doctor for any health decisions.
      </div>
    </div>
  )
}
