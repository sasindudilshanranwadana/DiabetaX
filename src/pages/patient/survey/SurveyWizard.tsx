import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2, Check, Upload } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { GlassCard } from '../../../components/ui/GlassCard'
import { SurveyWizardStepper } from '../../../components/ui/SurveyWizardStepper'
import { Button } from '../../../components/ui/primitives/button'
import { Progress } from '../../../components/ui/primitives/progress'
import { toast } from '../../../components/ui/primitives/toaster'
import {
  DIABETES_TYPES, HEALTH_CONDITIONS, MEDICATION_OPTIONS, DOSE_OPTIONS, MED_DURATION,
  SHORT_TERM_EFFECTS, LONG_TERM_EFFECTS, SEVERITY_OPTIONS, REPORTED_OPTIONS,
  ADHERENCE_OPTIONS, EXERCISE_FREQ, EXERCISE_DURATION, SMOKE_OPTIONS, ALCOHOL_OPTIONS,
  DOCTOR_VISIT_FREQ, QOL_CHANGE, DAILY_IMPACT, CONSIDER_SWITCH, INSULIN_OPTIONS,
} from './surveyOptions'

type SurveyType = 'baseline' | 'followup_3m' | 'followup_6m'

const STEPS = [
  { label: 'Background' },
  { label: 'Treatments' },
  { label: 'Side Effects' },
  { label: 'Lifestyle & QoL' },
]

const field = "w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
const lbl = "block text-sm text-gray-300 mb-1.5 font-medium"
const sectionTitle = "text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4"

// ── Small reusable controls that mirror Google Form widgets ───────────────────
function QLabel({ n, children, required }: { n: number; children: React.ReactNode; required?: boolean }) {
  return (
    <label className={lbl}>
      <span className="text-gray-500 mr-1">{n}.</span>{children}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  )
}

function RadioGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      {options.map(o => (
        <label key={o} className="flex items-center gap-3 cursor-pointer rounded-lg border border-white/10 px-3 py-2 hover:border-white/20 transition-colors">
          <input type="radio" checked={value === o} onChange={() => onChange(o)} className="accent-primary" />
          <span className="text-sm text-gray-300">{o}</span>
        </label>
      ))}
    </div>
  )
}

function CheckGroup({ options, values, onToggle, columns = 2 }: { options: string[]; values: string[]; onToggle: (v: string) => void; columns?: number }) {
  return (
    <div className={`grid grid-cols-1 ${columns === 2 ? 'sm:grid-cols-2' : ''} gap-2`}>
      {options.map(o => (
        <label key={o} className="flex items-center gap-2.5 cursor-pointer rounded-lg border border-white/10 px-3 py-2 hover:border-white/20 transition-colors">
          <input type="checkbox" checked={values.includes(o)} onChange={() => onToggle(o)} className="accent-primary" />
          <span className="text-sm text-gray-300">{o}</span>
        </label>
      ))}
    </div>
  )
}

interface Props { surveyType: SurveyType }

export function SurveyWizard({ surveyType }: Props) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [surveyId, setSurveyId] = useState<string | null>(null)
  const [uid, setUid] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [medMap, setMedMap] = useState<Record<string, string>>({}) // name -> medication id

  // ── Section 1: Patient Background ──────────────────────────────────────────
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [duration, setDuration] = useState('')
  const [diabetesType, setDiabetesType] = useState('')
  const [diabetesTypeOther, setDiabetesTypeOther] = useState('')
  const [conditions, setConditions] = useState<string[]>([])
  const [conditionOther, setConditionOther] = useState('')

  // ── Section 2: Current Treatments ──────────────────────────────────────────
  const [medications, setMedications] = useState<string[]>([])
  const [medicationOther, setMedicationOther] = useState('')
  const [dose, setDose] = useState('')
  const [medDuration, setMedDuration] = useState('')
  const [medChanged, setMedChanged] = useState('')
  const [changedMeds, setChangedMeds] = useState<string[]>([])
  const [changeReason, setChangeReason] = useState('')
  const [onInsulin, setOnInsulin] = useState('')
  const [fbs, setFbs] = useState('')
  const [hba1c, setHba1c] = useState('')

  // ── Section 3: Side Effects ────────────────────────────────────────────────
  const [shortEffects, setShortEffects] = useState<string[]>([])
  const [shortOther, setShortOther] = useState('')
  const [longEffects, setLongEffects] = useState<string[]>([])
  const [longOther, setLongOther] = useState('')
  const [severity, setSeverity] = useState('')
  const [reported, setReported] = useState('')

  // ── Section 4: Lifestyle & QoL ─────────────────────────────────────────────
  const [adherence, setAdherence] = useState('')
  const [followsDiet, setFollowsDiet] = useState('')
  const [dietPlan, setDietPlan] = useState('')
  const [exerciseFreq, setExerciseFreq] = useState('')
  const [exerciseDur, setExerciseDur] = useState('')
  const [smoking, setSmoking] = useState('')
  const [alcohol, setAlcohol] = useState('')
  const [followsClinic, setFollowsClinic] = useState('')
  const [doctorFreq, setDoctorFreq] = useState('')
  const [hospitalised, setHospitalised] = useState('')
  const [satisfaction, setSatisfaction] = useState('')
  const [qolChange, setQolChange] = useState('')
  const [dailyImpact, setDailyImpact] = useState('')
  const [considerSwitch, setConsiderSwitch] = useState('')
  const [woundConsent, setWoundConsent] = useState('')
  const [woundFile, setWoundFile] = useState<File | null>(null)

  function toggle(list: string[], setter: (v: string[]) => void, value: string) {
    setter(list.includes(value) ? list.filter(v => v !== value) : [...list, value])
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUid(user.id)

      const [{ data: meds }, { data: existing }, { data: patient }] = await Promise.all([
        supabase.from('medications').select('id, name'),
        supabase.from('surveys').select('*').eq('uid', user.id).eq('survey_type', surveyType).maybeSingle(),
        supabase.from('patients').select('*').eq('uid', user.id).maybeSingle(),
      ])

      const map: Record<string, string> = {}
      for (const m of meds ?? []) map[m.name] = m.id
      setMedMap(map)

      // Prefill demographics from existing patient profile
      if (patient) {
        setAge(String(patient.age ?? ''))
        setGender(patient.sex === 'Male' ? 'Male' : patient.sex === 'Female' ? 'Female' : '')
        setHeight(String(patient.height_cm ?? ''))
        setWeight(String(patient.weight_kg ?? ''))
        setDuration(String(patient.diabetes_duration_years ?? ''))
        setDiabetesType(patient.diabetes_type ?? '')
      }

      if (existing) {
        setSurveyId(existing.id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = existing as any
        if (e.full_name) setFullName(e.full_name)
        if (e.primary_dose) setDose(e.primary_dose)
        if (e.med_duration) setMedDuration(e.med_duration)
        if (e.med_changed != null) setMedChanged(e.med_changed ? 'Yes' : 'No')
        if (e.med_change_reason) setChangeReason(e.med_change_reason)
        if (e.on_insulin != null) setOnInsulin(e.on_insulin ? 'Yes' : 'No')
        if (e.side_effect_severity) setSeverity(e.side_effect_severity)
        if (e.side_effect_reported) setReported(e.side_effect_reported)
        if (e.wound_consent != null) setWoundConsent(e.wound_consent ? 'Yes' : 'No')

        const [{ data: meas }, { data: ls }, { data: qol }, { data: conds }, { data: se }] = await Promise.all([
          supabase.from('measurements').select('*').eq('survey_id', existing.id).maybeSingle(),
          supabase.from('lifestyle').select('*').eq('survey_id', existing.id).maybeSingle(),
          supabase.from('quality_of_life').select('*').eq('survey_id', existing.id).maybeSingle(),
          supabase.from('patient_conditions').select('condition').eq('uid', user.id),
          supabase.from('side_effects').select('*').eq('survey_id', existing.id),
        ])
        if (meas) { setFbs(String(meas.fasting_glucose ?? '')); setHba1c(String(meas.hba1c ?? '')) }
        if (conds?.length) setConditions(conds.map(c => c.condition))
        if (se?.length) {
          setShortEffects(se.filter(s => s.effect_type === 'short_term').map(s => s.effect_name))
          setLongEffects(se.filter(s => s.effect_type === 'long_term').map(s => s.effect_name))
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const l = ls as any
        if (l) {
          setAdherence(l.adherence_level ?? '')
          setFollowsDiet(l.follows_diet == null ? '' : l.follows_diet ? 'Yes' : 'No')
          setDietPlan(l.diet_plan_text ?? '')
          setExerciseFreq(l.exercise_frequency ?? '')
          setExerciseDur(l.exercise_duration ?? '')
          setSmoking(l.smoking ?? '')
          setAlcohol(l.alcohol ?? '')
          setFollowsClinic(l.follows_clinic == null ? '' : l.follows_clinic ? 'Yes' : 'No')
        }
        if (qol) {
          setSatisfaction(String(qol.treatment_satisfaction ?? ''))
          setQolChange(qol.qol_change ?? '')
          setDailyImpact(qol.daily_routine_impact ?? '')
          setDoctorFreq(qol.doctor_visit_freq ?? '')
          setHospitalised(qol.hospitalisation_12m == null ? '' : qol.hospitalisation_12m ? 'Yes' : 'No')
          setConsiderSwitch(qol.consider_switch ?? '')
        }
      }
    }
    init()
  }, [surveyType])

  async function ensureSurvey(): Promise<string> {
    if (surveyId) return surveyId
    const { data, error } = await supabase.from('surveys').insert({
      uid, survey_type: surveyType, status: 'draft', data_source: 'real',
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
        // demographics → patients, conditions → patient_conditions, survey meta
        await supabase.from('patients').upsert({
          uid,
          age: parseInt(age) || null,
          sex: gender || null,
          height_cm: parseFloat(height) || null,
          weight_kg: parseFloat(weight) || null,
          diabetes_duration_years: parseFloat(duration) || null,
          diabetes_type: diabetesType === 'Other' ? 'Other' : diabetesType || null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any, { onConflict: 'uid' })

        await supabase.from('patient_conditions').delete().eq('uid', uid)
        const condRows = conditions
          .filter(c => c !== 'None')
          .map(c => ({ uid, condition: c === 'Other' && conditionOther ? conditionOther : c }))
        if (condRows.length) await supabase.from('patient_conditions').insert(condRows)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from('surveys').update({ full_name: fullName || null } as any).eq('id', sid)
      }

      if (step === 1) {
        // medications (checkbox list) → patient_medications rows
        await supabase.from('patient_medications').delete().eq('survey_id', sid)
        const doseNum = parseFloat(dose) || null
        const doseUnit = dose.includes('units') ? 'units' : 'mg'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const medRows: any[] = medications.filter(m => m !== 'Other').map(name => ({
          uid, survey_id: sid,
          medication_id: medMap[name] ?? null,
          custom_name: medMap[name] ? null : name,
          dose_value: doseNum, dose_unit: doseUnit,
          is_current: true,
        }))
        if (medications.includes('Other') && medicationOther) {
          medRows.push({ uid, survey_id: sid, medication_id: null, custom_name: medicationOther, dose_value: doseNum, dose_unit: doseUnit, is_current: true })
        }
        if (medRows.length) await supabase.from('patient_medications').insert(medRows)

        await supabase.from('measurements').delete().eq('survey_id', sid)
        await supabase.from('measurements').insert({
          survey_id: sid,
          hba1c: parseFloat(hba1c) || null,
          fasting_glucose: parseFloat(fbs) || null,
          glucose_unit: 'mg/dL',
        })

        await supabase.from('surveys').update({
          primary_dose: dose || null,
          med_duration: medDuration || null,
          med_changed: medChanged === 'Yes' ? true : medChanged === 'No' ? false : null,
          med_change_reason: changeReason || null,
          on_insulin: onInsulin === 'Yes' ? true : onInsulin === 'No' ? false : null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any).eq('id', sid)
      }

      if (step === 2) {
        await supabase.from('side_effects').delete().eq('survey_id', sid)
        const rows = [
          ...shortEffects.filter(e => e !== 'None').map(name => ({
            survey_id: sid, effect_name: name === 'Other' && shortOther ? shortOther : name,
            effect_type: 'short_term', severity: severity === 'Much Worse' ? 'severe' : severity === 'Worse' ? 'moderate' : 'mild',
            reported_to_doctor: reported === 'Yes',
          })),
          ...longEffects.filter(e => e !== 'None').map(name => ({
            survey_id: sid, effect_name: name === 'Other' && longOther ? longOther : name,
            effect_type: 'long_term', severity: severity === 'Much Worse' ? 'severe' : severity === 'Worse' ? 'moderate' : 'mild',
            reported_to_doctor: reported === 'Yes',
          })),
        ]
        if (rows.length) await supabase.from('side_effects').insert(rows)
        await supabase.from('surveys').update({
          side_effect_severity: severity || null,
          side_effect_reported: reported || null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any).eq('id', sid)
      }

      if (step === 3) {
        await supabase.from('lifestyle').delete().eq('survey_id', sid)
        await supabase.from('lifestyle').insert({
          survey_id: sid,
          adherence_level: adherence || null,
          follows_diet: followsDiet === 'Yes' ? true : followsDiet === 'No' ? false : null,
          diet_plan_text: dietPlan || null,
          exercise_frequency: exerciseFreq || null,
          exercise_duration: exerciseDur || null,
          smoking: smoking || null,
          alcohol: alcohol || null,
          follows_clinic: followsClinic === 'Yes' ? true : followsClinic === 'No' ? false : null,
          physical_activity: exerciseFreq || null, // keep legacy column populated for ML
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)

        await supabase.from('quality_of_life').delete().eq('survey_id', sid)
        await supabase.from('quality_of_life').insert({
          survey_id: sid,
          treatment_satisfaction: parseInt(satisfaction) || null,
          qol_change: qolChange || null,
          daily_routine_impact: dailyImpact || null,
          doctor_visit_freq: doctorFreq || null,
          hospitalisation_12m: hospitalised === 'Yes' ? true : hospitalised === 'No' ? false : null,
          consider_switch: considerSwitch || null,
        })

        // Wound image upload (optional)
        let woundUrl: string | null = null
        if (woundConsent === 'Yes' && woundFile) {
          const path = `${uid}/${sid}-${Date.now()}-${woundFile.name}`
          const { error: upErr } = await supabase.storage.from('wound-images').upload(path, woundFile, { upsert: true })
          if (!upErr) woundUrl = path
        }
        await supabase.from('surveys').update({
          wound_consent: woundConsent === 'Yes' ? true : woundConsent === 'No' ? false : null,
          ...(woundUrl ? { wound_image_url: woundUrl } : {}),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any).eq('id', sid)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleNext() {
    await saveCurrent()
    if (step < STEPS.length - 1) { setStep(s => s + 1); toast.success('Progress saved') }
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await saveCurrent()
      const sid = surveyId ?? await ensureSurvey()
      await supabase.from('surveys').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', sid)
      toast.success('Survey submitted — thank you!')
      navigate('/patient/submissions')
    } catch {
      toast.error('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
          {surveyType === 'baseline' ? 'Baseline Survey' : surveyType === 'followup_3m' ? '3-Month Follow-up' : '6-Month Follow-up'}
        </h2>
        <p className="text-muted-foreground text-sm">Evaluate the effectiveness of commonly used antidiabetic drugs with their long-term side effects. Your progress saves automatically.</p>
      </div>

      <div className="space-y-3">
        <SurveyWizardStepper steps={STEPS} currentStep={step} />
        <Progress value={progress} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

          {/* ════ Section 1: Patient Background ════ */}
          {step === 0 && (
            <GlassCard>
              <p className={sectionTitle}>Patient Background</p>
              <div className="space-y-5">
                <div><QLabel n={1}>Full Name</QLabel><input className={field} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Optional" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><QLabel n={2} required>Age</QLabel><input type="number" className={field} value={age} onChange={e => setAge(e.target.value)} /></div>
                  <div>
                    <QLabel n={3} required>Gender</QLabel>
                    <RadioGroup options={['Male', 'Female']} value={gender} onChange={setGender} />
                  </div>
                  <div><QLabel n={4}>Height (cm)</QLabel><input type="number" step="any" className={field} value={height} onChange={e => setHeight(e.target.value)} /></div>
                  <div><QLabel n={5}>Weight (kg)</QLabel><input type="number" step="any" className={field} value={weight} onChange={e => setWeight(e.target.value)} /></div>
                </div>
                <div><QLabel n={6}>Duration since diabetes diagnosis (years)</QLabel><input type="number" step="any" className={field} value={duration} onChange={e => setDuration(e.target.value)} /></div>
                <div>
                  <QLabel n={7}>What type of diabetes do you have?</QLabel>
                  <RadioGroup options={DIABETES_TYPES.map(d => d.label)} value={DIABETES_TYPES.find(d => d.value === diabetesType)?.label ?? ''} onChange={l => setDiabetesType(DIABETES_TYPES.find(d => d.label === l)?.value ?? '')} />
                  {diabetesType === 'Other' && <input className={`${field} mt-2`} placeholder="If Other, specify type" value={diabetesTypeOther} onChange={e => setDiabetesTypeOther(e.target.value)} />}
                </div>
                <div>
                  <QLabel n={8} required>Do you have any other health conditions? (in addition to diabetes)</QLabel>
                  <CheckGroup options={HEALTH_CONDITIONS} values={conditions} onToggle={v => toggle(conditions, setConditions, v)} />
                  {conditions.includes('Other') && <input className={`${field} mt-2`} placeholder="If Other, specify condition" value={conditionOther} onChange={e => setConditionOther(e.target.value)} />}
                </div>
              </div>
            </GlassCard>
          )}

          {/* ════ Section 2: Current Treatments ════ */}
          {step === 1 && (
            <GlassCard>
              <p className={sectionTitle}>Current Treatments</p>
              <div className="space-y-5">
                <div>
                  <QLabel n={9} required>What diabetes medication(s) are you currently taking?</QLabel>
                  <CheckGroup options={MEDICATION_OPTIONS} values={medications} onToggle={v => toggle(medications, setMedications, v)} />
                  {medications.includes('Other') && <input className={`${field} mt-2`} placeholder="If Other, specify medication" value={medicationOther} onChange={e => setMedicationOther(e.target.value)} />}
                </div>
                <div>
                  <QLabel n={10}>Current Medication Drug Dose</QLabel>
                  <select className={field} value={dose} onChange={e => setDose(e.target.value)}>
                    <option value="">Select dose…</option>
                    {DOSE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <QLabel n={11}>How long have you been using your current medication?</QLabel>
                  <RadioGroup options={MED_DURATION} value={medDuration} onChange={setMedDuration} />
                </div>
                <div>
                  <QLabel n={12}>Have you changed your medication in the past?</QLabel>
                  <RadioGroup options={['Yes', 'No']} value={medChanged} onChange={setMedChanged} />
                </div>
                {medChanged === 'Yes' && (
                  <>
                    <div>
                      <QLabel n={13}>If the medications have been changed, what are they?</QLabel>
                      <CheckGroup options={MEDICATION_OPTIONS} values={changedMeds} onToggle={v => toggle(changedMeds, setChangedMeds, v)} />
                    </div>
                    <div><QLabel n={14}>Why have you changed your medication in the past?</QLabel><input className={field} value={changeReason} onChange={e => setChangeReason(e.target.value)} /></div>
                  </>
                )}
                <div>
                  <QLabel n={15}>Are you currently on insulin therapy?</QLabel>
                  <RadioGroup options={INSULIN_OPTIONS} value={onInsulin} onChange={setOnInsulin} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><QLabel n={16}>Latest fasting blood sugar level (mg/dL)</QLabel><input type="number" step="any" className={field} value={fbs} onChange={e => setFbs(e.target.value)} /></div>
                  <div><QLabel n={17}>Latest HbA1c (%)</QLabel><input type="number" step="any" className={field} value={hba1c} onChange={e => setHba1c(e.target.value)} /></div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* ════ Section 3: Side Effects ════ */}
          {step === 2 && (
            <GlassCard>
              <p className={sectionTitle}>Long-term and short-term side effects</p>
              <div className="space-y-5">
                <div>
                  <QLabel n={18} required>Have you experienced any of the below short-term side effects?</QLabel>
                  <CheckGroup options={SHORT_TERM_EFFECTS} values={shortEffects} onToggle={v => toggle(shortEffects, setShortEffects, v)} />
                  {shortEffects.includes('Other') && <input className={`${field} mt-2`} placeholder="If Other, specify" value={shortOther} onChange={e => setShortOther(e.target.value)} />}
                </div>
                <div>
                  <QLabel n={19} required>Have you experienced any of the below long-term side effects?</QLabel>
                  <CheckGroup options={LONG_TERM_EFFECTS} values={longEffects} onToggle={v => toggle(longEffects, setLongEffects, v)} />
                  {longEffects.includes('Other') && <input className={`${field} mt-2`} placeholder="If Other, specify" value={longOther} onChange={e => setLongOther(e.target.value)} />}
                </div>
                <div>
                  <QLabel n={20}>How severe were these side effects?</QLabel>
                  <RadioGroup options={SEVERITY_OPTIONS} value={severity} onChange={setSeverity} />
                </div>
                <div>
                  <QLabel n={21}>Did you report these side effects to your doctor?</QLabel>
                  <RadioGroup options={REPORTED_OPTIONS} value={reported} onChange={setReported} />
                </div>
              </div>
            </GlassCard>
          )}

          {/* ════ Section 4: Lifestyle & Quality of Life ════ */}
          {step === 3 && (
            <GlassCard>
              <p className={sectionTitle}>Lifestyle &amp; Adherence · Quality of Life</p>
              <div className="space-y-5">
                <div>
                  <QLabel n={22}>How regularly do you take your medication as prescribed?</QLabel>
                  <RadioGroup options={ADHERENCE_OPTIONS} value={adherence} onChange={setAdherence} />
                </div>
                <div>
                  <QLabel n={23}>Have you followed or are you following the diet plan?</QLabel>
                  <RadioGroup options={['Yes', 'No']} value={followsDiet} onChange={setFollowsDiet} />
                </div>
                <div><QLabel n={24}>Explain your normal routine or diet plan (fasting time and eating foods)</QLabel><textarea className={`${field} min-h-[80px]`} value={dietPlan} onChange={e => setDietPlan(e.target.value)} /></div>
                <div>
                  <QLabel n={25}>How often do you exercise per week?</QLabel>
                  <RadioGroup options={EXERCISE_FREQ} value={exerciseFreq} onChange={setExerciseFreq} />
                </div>
                <div>
                  <QLabel n={26}>How long do you exercise per day?</QLabel>
                  <RadioGroup options={EXERCISE_DURATION} value={exerciseDur} onChange={setExerciseDur} />
                </div>
                <div>
                  <QLabel n={27}>Do you smoke?</QLabel>
                  <RadioGroup options={SMOKE_OPTIONS} value={smoking} onChange={setSmoking} />
                </div>
                <div>
                  <QLabel n={28}>Do you consume alcohol?</QLabel>
                  <RadioGroup options={ALCOHOL_OPTIONS} value={alcohol} onChange={setAlcohol} />
                </div>
                <div>
                  <QLabel n={29}>Do you follow a clinic?</QLabel>
                  <RadioGroup options={['Yes', 'No']} value={followsClinic} onChange={setFollowsClinic} />
                </div>
                <div>
                  <QLabel n={30}>How often do you visit your doctor for a diabetes review?</QLabel>
                  <RadioGroup options={DOCTOR_VISIT_FREQ} value={doctorFreq} onChange={setDoctorFreq} />
                </div>
                <div>
                  <QLabel n={31}>Have you ever been hospitalized due to diabetes complications?</QLabel>
                  <RadioGroup options={['Yes', 'No']} value={hospitalised} onChange={setHospitalised} />
                </div>
                <div>
                  <QLabel n={32}>How satisfied are you with your current diabetes treatment?</QLabel>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" onClick={() => setSatisfaction(String(n))}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${satisfaction === String(n) ? 'bg-primary/20 border-primary/40 text-primary-400' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">1 = Very dissatisfied · 5 = Very satisfied</p>
                </div>
                <div>
                  <QLabel n={33}>Overall, how would you rate your quality of life since starting medication?</QLabel>
                  <RadioGroup options={QOL_CHANGE} value={qolChange} onChange={setQolChange} />
                </div>
                <div>
                  <QLabel n={34}>How does diabetes medication impact your daily routine?</QLabel>
                  <RadioGroup options={DAILY_IMPACT} value={dailyImpact} onChange={setDailyImpact} />
                </div>
                <div>
                  <QLabel n={35}>Would you consider switching medication if a better option becomes available?</QLabel>
                  <RadioGroup options={CONSIDER_SWITCH} value={considerSwitch} onChange={setConsiderSwitch} />
                </div>
                <div>
                  <QLabel n={36}>Do you consent to voluntarily share a wound image for research purposes?</QLabel>
                  <RadioGroup options={['Yes', 'No']} value={woundConsent} onChange={setWoundConsent} />
                </div>
                {woundConsent === 'Yes' && (
                  <div>
                    <QLabel n={37}>If you have experienced any diabetic-related wound (such as foot ulcers), upload a clear photograph.</QLabel>
                    <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-white/20 px-3 py-3 text-sm text-gray-400 hover:border-white/30">
                      <Upload size={15} />
                      {woundFile ? woundFile.name : 'Choose an image…'}
                      <input type="file" accept="image/*" className="hidden" onChange={e => setWoundFile(e.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between sticky bottom-4 z-10">
        <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
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
