// Exact option lists mirroring the Google Form
// "Evaluate the effectiveness of commonly used antidiabetic drugs..."

export const DIABETES_TYPES = [
  { value: 'Type1', label: 'Type 1 Diabetes' },
  { value: 'Type2', label: 'Type 2 Diabetes' },
  { value: 'Gestational', label: 'Gestational Diabetes' },
  { value: 'PreDiabetes', label: 'Pre-Diabetes' },
  { value: 'Other', label: 'Other' },
]

export const HEALTH_CONDITIONS = [
  'Hypertension', 'High cholesterol', 'Kidney disease', 'Heart disease',
  'Eye problems', 'Nerve problems', 'Liver disease', 'Obesity',
  'Thyroid disorder', 'Recurrent infections', 'Mental health issues',
  'Pregnant Women', 'Breastfeeding', 'Planning pregnancy',
  'Elderly (>65 years)', 'Recent Surgery', 'None', 'Other',
]

// Medication checkbox list — matches the Google Form exactly (Q9)
export const MEDICATION_OPTIONS = [
  'Metformin', 'Gliclazide', 'Glimbenclamide', 'Glimepiride', 'Sitagliptin',
  'Vildagliptin', 'Linagliptin', 'Teneligliptin', 'Empagliflozin', 'Dapagliflozin',
  'Canagliflozin', 'Piglitazone', 'Acarbose', 'Liraglutide', 'Semaglutide',
  'Dulaglutide', 'Insulin Therapy', 'Other',
]

export const DOSE_OPTIONS = [
  '0.25 mg', '0.5 mg', '0.6 mg', '1 mg', '1.2 mg', '1.8 mg', '2 mg', '2.5 mg',
  '3 mg', '4 mg', '5 mg', '10 mg', '25 mg', '30 mg', '50 mg', '60 mg', '100 mg',
  '300 mg', '500 mg', '850 mg', '1000 mg', '10 units', '20 units', '30 units',
  '75 mg', '750 mg',
]

export const MED_DURATION = [
  'Less than 3 months', '3-6 months', '6-12 months',
  '1-3 years', '3-5 years', 'More than 5 years',
]

export const SHORT_TERM_EFFECTS = [
  'Hypoglycemia (low blood sugar)', 'Hyperglycemia (high blood sugar)', 'Dizziness',
  'Sweating', 'Shaking / tremors', 'Palpitations', 'Confusion', 'Headache',
  'Nausea', 'Vomiting', 'Diarrhea', 'Abdominal pain', 'Bloating',
  'Frequent urination (polyuria)', 'Excessive thirst (polydipsia)', 'Dehydration',
  'Fatigue', 'Weakness', 'Blurred vision (temporary)', 'Dry mouth',
  'Injection site pain', 'Skin rash or itching', 'Genital/urinary infections',
  'Mild weight gain', 'Mild weight loss', 'Other', 'None',
]

export const LONG_TERM_EFFECTS = [
  'Diabetic retinopathy', 'Cataract', 'Vision loss / blindness', 'Kidney diseases',
  'Diabetic nephropathy', 'Chronic kidney disease', 'Proteinuria',
  'Peripheral neuropathy', 'Autonomic neuropathy', 'Erectile dysfunction',
  'Coronary artery disease', 'Heart attack (myocardial infarction)', 'Stroke',
  'Peripheral arterial disease', 'Diabetic foot ulcers', 'Poor wound healing',
  'Gangrene', 'Charcot foot', 'Dyslipidemia', 'Fatty liver disease',
  'Weight gain or severe weight loss', 'Urinary tract infections', 'Fungal infections',
  'Skin infections', 'Depression', 'Anxiety', 'Cognitive decline', 'Sleep disorders',
  'Other', 'None',
]

export const SEVERITY_OPTIONS = ['Normal', 'Worse', 'Much Worse']
export const REPORTED_OPTIONS = ['Yes', 'No', 'Maybe']
export const ADHERENCE_OPTIONS = ['Always', 'Often', 'Sometimes', 'Rarely']
export const EXERCISE_FREQ = ['Once a week', '3 Days per week', 'Daily', 'None']
export const EXERCISE_DURATION = ['half hour', '1 hour', 'more than 1 hour']
export const SMOKE_OPTIONS = ['Regularly', 'Occasionally', 'Never']
export const ALCOHOL_OPTIONS = ['Regularly', 'Occasionally', 'Never']
export const DOCTOR_VISIT_FREQ = ['Weekly', 'Monthly', 'Per 3 months', 'Per 6 months', 'None']
export const QOL_CHANGE = ['Much improved', 'Improved', 'No change', 'Worse', 'Much worse']
export const DAILY_IMPACT = ['Easy', 'Manageable', 'Difficult']
export const CONSIDER_SWITCH = ['Yes', 'No', 'Not sure']
export const INSULIN_OPTIONS = ['Yes', 'No']
