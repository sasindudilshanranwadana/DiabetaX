import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Trash2, ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { GlassCard } from '../../../components/ui/GlassCard'
import { SurveyWizardStepper } from '../../../components/ui/SurveyWizardStepper'
import { Button } from '../../../components/ui/primitives/button'
import { Progress } from '../../../components/ui/primitives/progress'
import { toast } from '../../../components/ui/primitives/toaster'

type SurveyType = 'baseline' | 'followup_3m' | 'followup_6m'

interface Medication {
  medication_id: string
  medication_name: string
  drug_class: string
  dose_value: string
  dose_unit: string
  frequency: string
  start_date: string
  is_current: boolean
  end_date: string
}

interface SideEffect {
  effect_name: string
  effect_type: string
  severity: string
  onset_time: string
  ongoing: boolean
  caused_med_change: boolean
  reported_to_doctor: boolean
}

interface MedOption {
  id: string
  name: string
  drug_class: string
}

const STEPS = [
  { label: 'Medications' },
  { label: 'Measurements' },
  { label: 'Side Effects' },
  { label: 'Lifestyle' },
  { label: 'Quality of Life' },
  { label: 'Follow-up' },
]

const emptyMed = (): Medication => ({ medication_id: '', medication_name: '', drug_class: '', dose_value: '', dose_unit: 'mg', frequency: '', start_date: '', is_current: true, end_date: '' })
const emptySE = (): SideEffect => ({ effect_name: '', effect_type: 'short_term', severity: 'mild', onset_time: '', ongoing: true, caused_med_change: false, reported_to_doctor: false })

const fieldClass = "w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
const labelClass = "block text-xs text-gray-400 mb-1.5"

interface Props {
  surveyType: SurveyType
}

export function SurveyWizard({ surveyType }: Props) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [surveyId, setSurveyId] = useState<string | null>(null)
  const [uid, setUid] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [medOptions, setMedOptions] = useState<MedOption[]>([])

  // Step 1 — Medications
  const [meds, setMeds] = useState<Medication[]>([emptyMed()])

  // Step 2 — Measurements
  const [hba1c, setHba1c] = useState('')
  const [hba1cDate, setHba1cDate] = useState('')
  const [fastingGlucose, setFastingGlucose] = useState('')
  const [glucoseUnit, setGlucoseUnit] = useState('mmol/L')
  const [prevHba1c, setPrevHba1c] = useState('')

  // Step 3 — Side effects
  const [sideEffects, setSideEffects] = useState<SideEffect[]>([])

  // Step 4 — Lifestyle
  const [adherence, setAdherence] = useState('')
  const [missedDoses, setMissedDoses] = useState('')
  const [reasonMissed, setReasonMissed] = useState('')
  const [diet, setDiet] = useState('')
  const [activity, setActivity] = useState('')
  const [smoking, setSmoking] = useState('')
  const [alcohol, setAlcohol] = useState('')

  // Step 5 — QoL
  const [satisfaction, setSatisfaction] = useState('')
  const [qolChange, setQolChange] = useState('')
  const [dailyImpact, setDailyImpact] = useState('')
  const [doctorFreq, setDoctorFreq] = useState('')
  const [hospitalised, setHospitalised] = useState('')
  const [considerSwitch, setConsiderSwitch] = useState('')

  // Step 6 — Follow-up consent
  const [followUpConsent, setFollowUpConsent] = useState<boolean | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUid(user.id)

      const [{ data: mOpts }, { data: existing }] = await Promise.all([
        supabase.from('medications').select('id, name, drug_class').order('name'),
        supabase.from('surveys').select('id, status').eq('uid', user.id).eq('survey_type', surveyType).maybeSingle(),
      ])

      setMedOptions(mOpts?.map(m => ({ id: m.id, name: m.name, drug_class: m.drug_class })) ?? [])

      if (existing) {
        setSurveyId(existing.id)
        // load saved data
        const [{ data: savedMeds }, { data: meas }, { data: se }, { data: ls }, { data: qol }] = await Promise.all([
          supabase.from('patient_medications').select('*').eq('survey_id', existing.id),
          supabase.from('measurements').select('*').eq('survey_id', existing.id).maybeSingle(),
          supabase.from('side_effects').select('*').eq('survey_id', existing.id),
          supabase.from('lifestyle').select('*').eq('survey_id', existing.id).maybeSingle(),
          supabase.from('quality_of_life').select('*').eq('survey_id', existing.id).maybeSingle(),
        ])

        if (savedMeds?.length) {
          setMeds(savedMeds.map(m => ({
            medication_id: m.medication_id ?? '',
            medication_name: '',
            drug_class: '',
            dose_value: String(m.dose_value ?? ''),
            dose_unit: m.dose_unit ?? 'mg',
            frequency: m.frequency ?? '',
            start_date: m.start_date ?? '',
            is_current: m.is_current ?? true,
            end_date: m.end_date ?? '',
          })))
        }
        if (meas) {
          setHba1c(String(meas.hba1c ?? ''))
          setHba1cDate(meas.hba1c_date ?? '')
          setFastingGlucose(String(meas.fasting_glucose ?? ''))
          setGlucoseUnit(meas.glucose_unit ?? 'mmol/L')
          setPrevHba1c(String(meas.previous_hba1c ?? ''))
        }
        if (se?.length) setSideEffects(se.map(s => ({
          effect_name: s.effect_name ?? '',
          effect_type: s.effect_type ?? 'short_term',
          severity: s.severity ?? 'mild',
          onset_time: s.onset_time ?? '',
          ongoing: s.ongoing ?? true,
          caused_med_change: s.caused_med_change ?? false,
          reported_to_doctor: s.reported_to_doctor ?? false,
        })))
        if (ls) {
          setAdherence(ls.adherence_level ?? '')
          setMissedDoses(ls.missed_doses_30d ?? '')
          setReasonMissed(ls.reason_missed ?? '')
          setDiet(ls.diet_quality ?? '')
          setActivity(ls.physical_activity ?? '')
          setSmoking(ls.smoking ?? '')
          setAlcohol(ls.alcohol ?? '')
        }
        if (qol) {
          setSatisfaction(String(qol.treatment_satisfaction ?? ''))
          setQolChange(qol.qol_change ?? '')
          setDailyImpact(qol.daily_routine_impact ?? '')
          setDoctorFreq(qol.doctor_visit_freq ?? '')
          setHospitalised(qol.hospitalisation_12m == null ? '' : qol.hospitalisation_12m ? 'yes' : 'no')
          setConsiderSwitch(qol.consider_switch ?? '')
        }
      }
    }
    init()
  }, [surveyType])

  async function ensureSurvey(): Promise<string> {
    if (surveyId) return surveyId
    const { data, error } = await supabase.from('surveys').insert({
      uid,
      survey_type: surveyType,
      status: 'draft',
      data_source: 'real',
    }).select('id').single()
    if (error) throw error
    setSurveyId(data.id)
    return data.id
  }

  async function saveCurrent() {
    setSaving(true)
    try {
      const sid = await ensureSurvey()

      if (step === 0) {
        await supabase.from('patient_medications').delete().eq('survey_id', sid)
        const toInsert = meds.filter(m => m.medication_id || m.medication_name).map(m => ({
          uid,
          survey_id: sid,
          medication_id: m.medication_id || null,
          dose_value: parseFloat(m.dose_value) || null,
          dose_unit: m.dose_unit,
          frequency: m.frequency,
          start_date: m.start_date || null,
          is_current: m.is_current,
          end_date: m.end_date || null,
        }))
        if (toInsert.length > 0) await supabase.from('patient_medications').insert(toInsert)
      }

      if (step === 1) {
        await supabase.from('measurements').delete().eq('survey_id', sid)
        await supabase.from('measurements').insert({
          survey_id: sid,
          hba1c: parseFloat(hba1c) || null,
          hba1c_date: hba1cDate || null,
          fasting_glucose: parseFloat(fastingGlucose) || null,
          glucose_unit: glucoseUnit,
          previous_hba1c: parseFloat(prevHba1c) || null,
        })
      }

      if (step === 2) {
        await supabase.from('side_effects').delete().eq('survey_id', sid)
        if (sideEffects.length > 0) {
          await supabase.from('side_effects').insert(sideEffects.map(se => ({ survey_id: sid, ...se })))
        }
      }

      if (step === 3) {
        await supabase.from('lifestyle').delete().eq('survey_id', sid)
        await supabase.from('lifestyle').insert({
          survey_id: sid,
          adherence_level: adherence,
          missed_doses_30d: missedDoses,
          reason_missed: reasonMissed || null,
          diet_quality: diet || null,
          physical_activity: activity || null,
          smoking: smoking || null,
          alcohol: alcohol || null,
        })
      }

      if (step === 4) {
        await supabase.from('quality_of_life').delete().eq('survey_id', sid)
        await supabase.from('quality_of_life').insert({
          survey_id: sid,
          treatment_satisfaction: parseInt(satisfaction),
          qol_change: qolChange,
          daily_routine_impact: dailyImpact,
          doctor_visit_freq: doctorFreq || null,
          hospitalisation_12m: hospitalised === 'yes' ? true : hospitalised === 'no' ? false : null,
          consider_switch: considerSwitch || null,
        })
      }

      if (step === 5 && followUpConsent !== null) {
        await supabase.from('follow_up_consent').upsert({ uid, consented: followUpConsent }, { onConflict: 'uid' })
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleNext() {
    await saveCurrent()
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
      toast.success('Progress saved')
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await saveCurrent()
      const sid = surveyId ?? await ensureSurvey()
      await supabase.from('surveys').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', sid)
      toast.success('Survey submitted — thank you!')
      navigate('/patient/submissions')
    } catch (e) {
      toast.error('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function updateMed(i: number, field: keyof Medication, value: string | boolean) {
    setMeds(prev => prev.map((m, idx) => {
      if (idx !== i) return m
      if (field === 'medication_id' && typeof value === 'string') {
        const opt = medOptions.find(o => o.id === value)
        return { ...m, medication_id: value, medication_name: opt?.name ?? '', drug_class: opt?.drug_class ?? '' }
      }
      return { ...m, [field]: value }
    }))
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
          {surveyType === 'baseline' ? 'Baseline Survey' : surveyType === 'followup_3m' ? '3-Month Follow-up' : '6-Month Follow-up'}
        </h2>
        <p className="text-muted-foreground text-sm">Your progress is automatically saved as you go.</p>
      </div>

      <div className="space-y-3">
        <SurveyWizardStepper steps={STEPS} currentStep={step} />
        <Progress value={progress} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
      {/* Step 0: Medications */}
      {step === 0 && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-4">Current Medications</h3>
          <div className="space-y-6">
            {meds.map((med, i) => (
              <div key={i} className="space-y-3 p-4 bg-white/3 rounded-lg border border-white/5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-400">Medication {i + 1}</p>
                  {meds.length > 1 && (
                    <button type="button" onClick={() => setMeds(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelClass}>Medication name</label>
                    <select value={med.medication_id} onChange={e => updateMed(i, 'medication_id', e.target.value)} className={fieldClass}>
                      <option value="">Select medication…</option>
                      {medOptions.map(o => <option key={o.id} value={o.id}>{o.name} ({o.drug_class})</option>)}
                      <option value="other">Other (specify below)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Dose</label>
                    <input type="number" min="0" step="any" value={med.dose_value} onChange={e => updateMed(i, 'dose_value', e.target.value)} className={fieldClass} placeholder="e.g. 500" />
                  </div>
                  <div>
                    <label className={labelClass}>Unit</label>
                    <select value={med.dose_unit} onChange={e => updateMed(i, 'dose_unit', e.target.value)} className={fieldClass}>
                      {['mg', 'mcg', 'IU', 'mg/mL', 'units'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Frequency</label>
                    <select value={med.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)} className={fieldClass}>
                      <option value="">Select…</option>
                      {['Once daily', 'Twice daily', 'Three times daily', 'Weekly', 'As needed'].map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Start date</label>
                    <input type="date" value={med.start_date} onChange={e => updateMed(i, 'start_date', e.target.value)} className={fieldClass} />
                  </div>
                  <div className="col-span-2 flex items-center gap-3">
                    <input type="checkbox" id={`is_current_${i}`} checked={med.is_current} onChange={e => updateMed(i, 'is_current', e.target.checked)} className="accent-primary" />
                    <label htmlFor={`is_current_${i}`} className="text-xs text-gray-400">Currently taking this medication</label>
                  </div>
                  {!med.is_current && (
                    <div>
                      <label className={labelClass}>End date</label>
                      <input type="date" value={med.end_date} onChange={e => updateMed(i, 'end_date', e.target.value)} className={fieldClass} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setMeds(prev => [...prev, emptyMed()])} className="flex items-center gap-2 text-xs text-primary-400 hover:text-primary transition-colors">
              <Plus size={14} /> Add another medication
            </button>
          </div>
        </GlassCard>
      )}

      {/* Step 1: Measurements */}
      {step === 1 && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-4">Blood Sugar Measurements</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>HbA1c (%)</label>
              <input type="number" min="3.5" max="20" step="0.1" required value={hba1c} onChange={e => setHba1c(e.target.value)} className={fieldClass} placeholder="e.g. 7.2" />
            </div>
            <div>
              <label className={labelClass}>HbA1c test date</label>
              <input type="date" required value={hba1cDate} onChange={e => setHba1cDate(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Fasting glucose</label>
              <input type="number" min="0" step="0.1" value={fastingGlucose} onChange={e => setFastingGlucose(e.target.value)} className={fieldClass} placeholder="e.g. 6.1" />
            </div>
            <div>
              <label className={labelClass}>Glucose unit</label>
              <select value={glucoseUnit} onChange={e => setGlucoseUnit(e.target.value)} className={fieldClass}>
                <option>mmol/L</option>
                <option>mg/dL</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Previous HbA1c (%) — optional</label>
              <input type="number" min="3.5" max="20" step="0.1" value={prevHba1c} onChange={e => setPrevHba1c(e.target.value)} className={fieldClass} placeholder="Last recorded value" />
            </div>
          </div>
        </GlassCard>
      )}

      {/* Step 2: Side Effects */}
      {step === 2 && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-4">Side Effects</h3>
          <p className="text-xs text-gray-500 mb-4">Report any side effects experienced since starting or changing your medications. Leave empty if none.</p>
          <div className="space-y-4">
            {sideEffects.map((se, i) => (
              <div key={i} className="p-4 bg-white/3 rounded-lg border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-400">Side effect {i + 1}</p>
                  <button type="button" onClick={() => setSideEffects(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelClass}>Effect name / description</label>
                    <input type="text" value={se.effect_name} onChange={e => setSideEffects(prev => prev.map((s, idx) => idx === i ? { ...s, effect_name: e.target.value } : s))} className={fieldClass} placeholder="e.g. Nausea, hypoglycaemia" />
                  </div>
                  <div>
                    <label className={labelClass}>Type</label>
                    <select value={se.effect_type} onChange={e => setSideEffects(prev => prev.map((s, idx) => idx === i ? { ...s, effect_type: e.target.value } : s))} className={fieldClass}>
                      <option value="short_term">Short-term</option>
                      <option value="long_term">Long-term</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Severity</label>
                    <select value={se.severity} onChange={e => setSideEffects(prev => prev.map((s, idx) => idx === i ? { ...s, severity: e.target.value } : s))} className={fieldClass}>
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>When did it start?</label>
                    <input type="text" value={se.onset_time} onChange={e => setSideEffects(prev => prev.map((s, idx) => idx === i ? { ...s, onset_time: e.target.value } : s))} className={fieldClass} placeholder="e.g. 2 weeks after starting" />
                  </div>
                  <div className="space-y-2">
                    {[
                      { key: 'ongoing', label: 'Still ongoing' },
                      { key: 'caused_med_change', label: 'Led to medication change' },
                      { key: 'reported_to_doctor', label: 'Reported to doctor' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                        <input type="checkbox" checked={se[key as keyof SideEffect] as boolean} onChange={e => setSideEffects(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: e.target.checked } : s))} className="accent-primary" />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setSideEffects(prev => [...prev, emptySE()])} className="flex items-center gap-2 text-xs text-primary-400 hover:text-primary transition-colors">
              <Plus size={14} /> Add side effect
            </button>
          </div>
        </GlassCard>
      )}

      {/* Step 3: Lifestyle */}
      {step === 3 && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-4">Lifestyle & Adherence</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Medication adherence</label>
              <select required value={adherence} onChange={e => setAdherence(e.target.value)} className={fieldClass}>
                <option value="">Select…</option>
                <option value="excellent">Excellent — never miss a dose</option>
                <option value="good">Good — rarely miss</option>
                <option value="fair">Fair — sometimes miss</option>
                <option value="poor">Poor — often miss</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Missed doses in last 30 days</label>
              <select required value={missedDoses} onChange={e => setMissedDoses(e.target.value)} className={fieldClass}>
                <option value="">Select…</option>
                <option value="0">None</option>
                <option value="1-3">1–3 doses</option>
                <option value="4-7">4–7 doses</option>
                <option value="8+">8 or more doses</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Reason for missed doses (if any)</label>
              <input type="text" value={reasonMissed} onChange={e => setReasonMissed(e.target.value)} className={fieldClass} placeholder="e.g. forgot, side effects, cost" />
            </div>
            <div>
              <label className={labelClass}>Diet quality</label>
              <select value={diet} onChange={e => setDiet(e.target.value)} className={fieldClass}>
                <option value="">Not specified</option>
                <option value="healthy">Healthy / diabetic diet</option>
                <option value="moderate">Moderate / sometimes healthy</option>
                <option value="poor">Poor / high sugar/fat</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Physical activity</label>
              <select value={activity} onChange={e => setActivity(e.target.value)} className={fieldClass}>
                <option value="">Not specified</option>
                <option value="active">Active (≥150 min/week)</option>
                <option value="moderate">Moderate (60–149 min/week)</option>
                <option value="sedentary">Mostly sedentary</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Smoking status</label>
              <select value={smoking} onChange={e => setSmoking(e.target.value)} className={fieldClass}>
                <option value="">Not specified</option>
                <option value="never">Never smoked</option>
                <option value="former">Former smoker</option>
                <option value="current">Current smoker</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Alcohol consumption</label>
              <select value={alcohol} onChange={e => setAlcohol(e.target.value)} className={fieldClass}>
                <option value="">Not specified</option>
                <option value="none">None</option>
                <option value="light">Light (&lt;2 drinks/week)</option>
                <option value="moderate">Moderate (2–7 drinks/week)</option>
                <option value="heavy">Heavy (&gt;7 drinks/week)</option>
              </select>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Step 4: Quality of Life */}
      {step === 4 && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-4">Quality of Life</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Overall treatment satisfaction (1–5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSatisfaction(String(n))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      satisfaction === String(n)
                        ? 'bg-primary/20 border-primary/40 text-primary-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-1">1 = Very dissatisfied, 5 = Very satisfied</p>
            </div>
            <div>
              <label className={labelClass}>Change in quality of life since starting treatment</label>
              <select required value={qolChange} onChange={e => setQolChange(e.target.value)} className={fieldClass}>
                <option value="">Select…</option>
                <option value="much_better">Much better</option>
                <option value="better">Somewhat better</option>
                <option value="same">No change</option>
                <option value="worse">Somewhat worse</option>
                <option value="much_worse">Much worse</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Impact on daily routine</label>
              <select required value={dailyImpact} onChange={e => setDailyImpact(e.target.value)} className={fieldClass}>
                <option value="">Select…</option>
                <option value="none">No impact</option>
                <option value="minor">Minor inconvenience</option>
                <option value="moderate">Moderate disruption</option>
                <option value="significant">Significant disruption</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Doctor visit frequency (past 6 months)</label>
              <select value={doctorFreq} onChange={e => setDoctorFreq(e.target.value)} className={fieldClass}>
                <option value="">Not specified</option>
                <option value="never">No visits</option>
                <option value="once">Once</option>
                <option value="2-3">2–3 times</option>
                <option value="4+">4 or more times</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Hospitalised in the past 12 months?</label>
              <select value={hospitalised} onChange={e => setHospitalised(e.target.value)} className={fieldClass}>
                <option value="">Not specified</option>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Would you consider switching treatment?</label>
              <select value={considerSwitch} onChange={e => setConsiderSwitch(e.target.value)} className={fieldClass}>
                <option value="">Not specified</option>
                <option value="no">No, satisfied with current treatment</option>
                <option value="maybe">Maybe, if a better option exists</option>
                <option value="yes">Yes, would like to switch</option>
              </select>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Step 5: Follow-up consent */}
      {step === 5 && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-4">Follow-up Participation</h3>
          <p className="text-sm text-gray-400 mb-6">
            Would you be willing to complete follow-up surveys at 3 months and 6 months? This is completely optional and you can change your preference at any time.
          </p>
          <div className="space-y-3">
            {[
              { value: true, label: "Yes — I'd like to participate in follow-up surveys" },
              { value: false, label: 'No — baseline survey only' },
            ].map(opt => (
              <label key={String(opt.value)} className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                <input
                  type="radio"
                  name="followup"
                  checked={followUpConsent === opt.value}
                  onChange={() => setFollowUpConsent(opt.value)}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-sm text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </GlassCard>
      )}

        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between sticky bottom-4 z-10">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button type="button" variant="glow" onClick={handleNext} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <>Save & Continue <ArrowRight className="h-4 w-4" /></>}
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-500 text-white">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <><Check className="h-4 w-4" /> Submit Survey</>}
          </Button>
        )}
      </div>
    </div>
  )
}
