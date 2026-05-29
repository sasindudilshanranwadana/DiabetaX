import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { GlassCard } from '../../components/ui/GlassCard'

const CONDITIONS = ['Hypertension', 'Dyslipidemia', 'Chronic Kidney Disease', 'Heart Disease', 'Obesity', 'Thyroid Disorder', 'PCOS', 'Neuropathy', 'Retinopathy']

export function Profile() {
  const [uid, setUid] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [diabetesType, setDiabetesType] = useState('')
  const [duration, setDuration] = useState('')
  const [kidney, setKidney] = useState('')
  const [pregnancy, setPregnancy] = useState('')
  const [conditions, setConditions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUid(user.id)

      const [{ data: patient }, { data: conds }] = await Promise.all([
        supabase.from('patients').select('*').eq('uid', user.id).maybeSingle(),
        supabase.from('patient_conditions').select('condition').eq('uid', user.id),
      ])

      if (patient) {
        setAge(String(patient.age ?? ''))
        setSex(patient.sex ?? '')
        setHeight(String(patient.height_cm ?? ''))
        setWeight(String(patient.weight_kg ?? ''))
        setDiabetesType(patient.diabetes_type ?? '')
        setDuration(String(patient.diabetes_duration_years ?? ''))
        setKidney(patient.kidney_function ?? '')
        setPregnancy(patient.pregnancy_status ?? '')
      }
      setConditions(conds?.map(c => c.condition) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error: pe } = await supabase.from('patients').upsert({
      uid,
      age: parseInt(age),
      sex,
      height_cm: parseFloat(height),
      weight_kg: parseFloat(weight),
      diabetes_type: diabetesType,
      diabetes_duration_years: parseFloat(duration),
      kidney_function: kidney || null,
      pregnancy_status: pregnancy || null,
    }, { onConflict: 'uid' })

    if (pe) { setError(pe.message); setSaving(false); return }

    await supabase.from('patient_conditions').delete().eq('uid', uid)
    if (conditions.length > 0) {
      await supabase.from('patient_conditions').insert(conditions.map(c => ({ uid, condition: c })))
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function toggleCondition(c: string) {
    setConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  const fieldClass = "w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
  const labelClass = "block text-xs text-gray-400 mb-1.5"

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">My Profile</h2>
        <p className="text-gray-400 text-sm">This information helps contextualise your survey responses. All data is de-identified.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Age</label>
              <input type="number" min="18" max="100" required value={age} onChange={e => setAge(e.target.value)} className={fieldClass} placeholder="e.g. 45" />
            </div>
            <div>
              <label className={labelClass}>Sex</label>
              <select required value={sex} onChange={e => setSex(e.target.value)} className={fieldClass}>
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / prefer not to say</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Height (cm)</label>
              <input type="number" min="100" max="250" step="0.1" required value={height} onChange={e => setHeight(e.target.value)} className={fieldClass} placeholder="e.g. 165" />
            </div>
            <div>
              <label className={labelClass}>Weight (kg)</label>
              <input type="number" min="30" max="300" step="0.1" required value={weight} onChange={e => setWeight(e.target.value)} className={fieldClass} placeholder="e.g. 72" />
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-4">Diabetes Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Diabetes Type</label>
              <select required value={diabetesType} onChange={e => setDiabetesType(e.target.value)} className={fieldClass}>
                <option value="">Select…</option>
                <option value="type_1">Type 1</option>
                <option value="type_2">Type 2</option>
                <option value="gestational">Gestational</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Duration (years)</label>
              <input type="number" min="0" max="60" step="0.5" required value={duration} onChange={e => setDuration(e.target.value)} className={fieldClass} placeholder="e.g. 5" />
            </div>
            <div>
              <label className={labelClass}>Kidney Function</label>
              <select value={kidney} onChange={e => setKidney(e.target.value)} className={fieldClass}>
                <option value="">Unknown / not tested</option>
                <option value="normal">Normal (eGFR ≥ 90)</option>
                <option value="mild">Mildly reduced (eGFR 60–89)</option>
                <option value="moderate">Moderately reduced (eGFR 30–59)</option>
                <option value="severe">Severely reduced (eGFR &lt; 30)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Pregnancy Status</label>
              <select value={pregnancy} onChange={e => setPregnancy(e.target.value)} className={fieldClass}>
                <option value="">Not applicable</option>
                <option value="pregnant">Currently pregnant</option>
                <option value="planning">Planning pregnancy</option>
                <option value="postpartum">Postpartum</option>
              </select>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-4">Other Conditions</h3>
          <p className="text-xs text-gray-500 mb-3">Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCondition(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  conditions.includes(c)
                    ? 'bg-primary/20 border-primary/40 text-primary-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </GlassCard>

        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}
