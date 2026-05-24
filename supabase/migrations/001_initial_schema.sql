-- DiabetaX — Initial Schema Migration
-- Run this in your Supabase SQL editor or via the Supabase CLI

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- CORE TABLES
-- ============================================================

-- profiles: one row per auth user, stores role + participant code
create table if not exists profiles (
  uid         uuid primary key references auth.users(id) on delete cascade,
  participant_code text unique,
  role        text not null default 'patient'
                check (role in ('patient','research_admin','clinician_admin','super_admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- consents: research consent records
create table if not exists consents (
  id              uuid primary key default uuid_generate_v4(),
  uid             uuid not null references profiles(uid) on delete cascade,
  consent_version text not null default '1.0',
  consented       boolean not null default false,
  consented_at    timestamptz
);

-- patients: clinical profile for patient users
create table if not exists patients (
  uid                    uuid primary key references profiles(uid) on delete cascade,
  age                    integer check (age between 5 and 120),
  sex                    text check (sex in ('Male','Female','Other','Prefer not to say')),
  height_cm              numeric check (height_cm between 80 and 250),
  weight_kg              numeric check (weight_kg between 20 and 300),
  diabetes_type          text check (diabetes_type in ('Type1','Type2','Gestational','Other')),
  diabetes_duration_years numeric check (diabetes_duration_years between 0 and 80),
  kidney_function        text check (kidney_function in ('Normal','Reduced','Dialysis','Not sure')),
  pregnancy_status       text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- patient_conditions: comorbidities (one row per condition)
create table if not exists patient_conditions (
  id        uuid primary key default uuid_generate_v4(),
  uid       uuid not null references profiles(uid) on delete cascade,
  condition text not null
);

-- surveys: baseline and follow-up survey headers
create table if not exists surveys (
  id             uuid primary key default uuid_generate_v4(),
  uid            uuid not null references profiles(uid) on delete cascade,
  survey_type    text not null check (survey_type in ('baseline','followup_3m','followup_6m')),
  status         text not null default 'draft' check (status in ('draft','submitted')),
  submitted_at   timestamptz,
  data_source    text not null default 'real' check (data_source in ('real','synthetic')),
  exclude_from_ml boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- measurements: HbA1c and glucose readings per survey
create table if not exists measurements (
  id              uuid primary key default uuid_generate_v4(),
  survey_id       uuid not null references surveys(id) on delete cascade,
  hba1c           numeric check (hba1c between 3.5 and 20),
  hba1c_date      date,
  fasting_glucose numeric check (fasting_glucose between 2 and 600),
  glucose_unit    text check (glucose_unit in ('mmol/L','mg/dL')),
  previous_hba1c  numeric check (previous_hba1c between 3.5 and 20)
);

-- medications: reference table of medication names + drug classes
create table if not exists medications (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null unique,
  drug_class text not null
);

-- patient_medications: medications taken per patient per survey
create table if not exists patient_medications (
  id            uuid primary key default uuid_generate_v4(),
  uid           uuid not null references profiles(uid) on delete cascade,
  survey_id     uuid references surveys(id) on delete cascade,
  medication_id uuid references medications(id),
  custom_name   text,
  drug_class    text,
  dose_value    numeric check (dose_value > 0),
  dose_unit     text,
  frequency     text,
  start_date    date,
  end_date      date,
  is_current    boolean not null default true,
  created_at    timestamptz not null default now()
);

-- side_effects: reported side effects per survey (repeatable)
create table if not exists side_effects (
  id                 uuid primary key default uuid_generate_v4(),
  survey_id          uuid not null references surveys(id) on delete cascade,
  effect_name        text not null,
  effect_type        text not null check (effect_type in ('short_term','long_term')),
  severity           text check (severity in ('mild','moderate','severe')),
  onset_time         text check (onset_time in ('<1 month','1-6 months','>6 months','not sure')),
  ongoing            boolean,
  caused_med_change  boolean,
  reported_to_doctor boolean
);

-- lifestyle: adherence and lifestyle factors per survey
create table if not exists lifestyle (
  id                uuid primary key default uuid_generate_v4(),
  survey_id         uuid not null unique references surveys(id) on delete cascade,
  adherence_level   text check (adherence_level in ('Always','Often','Sometimes','Rarely')),
  missed_doses_30d  text check (missed_doses_30d in ('0','1-3','4-7','8-14','>14')),
  reason_missed     text,
  diet_quality      text,
  physical_activity text,
  smoking           text,
  alcohol           text
);

-- quality_of_life: QoL responses per survey
create table if not exists quality_of_life (
  id                    uuid primary key default uuid_generate_v4(),
  survey_id             uuid not null unique references surveys(id) on delete cascade,
  treatment_satisfaction integer check (treatment_satisfaction between 1 and 5),
  qol_change            text check (qol_change in ('Much improved','Improved','No change','Worse','Much worse')),
  daily_routine_impact  text check (daily_routine_impact in ('Easy','Manageable','Difficult')),
  doctor_visit_freq     text,
  hospitalisation_12m   boolean,
  consider_switch       text
);

-- follow_up_consent: optional consent for future follow-up surveys
create table if not exists follow_up_consent (
  uid        uuid primary key references profiles(uid) on delete cascade,
  consented  boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- GOVERNANCE / AUDIT TABLES
-- ============================================================

-- cds_audit_events: every clinician CDS access is logged
create table if not exists cds_audit_events (
  id         uuid primary key default uuid_generate_v4(),
  uid        uuid not null references profiles(uid),
  action     text not null,
  details    jsonb,
  created_at timestamptz not null default now()
);

-- export_audit: every admin data export is logged
create table if not exists export_audit (
  id          uuid primary key default uuid_generate_v4(),
  uid         uuid not null references profiles(uid),
  role        text not null,
  export_type text not null,
  filters     jsonb,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- AI REGISTRY TABLES (read-only in UI; written by Python pipeline)
-- ============================================================

create table if not exists ml_models (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  version    text not null,
  metrics    jsonb,
  trained_at timestamptz,
  is_active  boolean not null default false
);

create table if not exists ml_predictions (
  id         uuid primary key default uuid_generate_v4(),
  uid        uuid references profiles(uid),
  survey_id  uuid references surveys(id),
  model_id   uuid references ml_models(id),
  prediction jsonb,
  created_at timestamptz not null default now()
);

create table if not exists ml_explanations (
  id          uuid primary key default uuid_generate_v4(),
  uid         uuid references profiles(uid),
  survey_id   uuid references surveys(id),
  model_id    uuid references ml_models(id),
  explanation jsonb,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- AI FEATURE VIEWS
-- ============================================================

create or replace view ai_features_v1 as
select
  s.id            as survey_id,
  s.uid,
  s.survey_type,
  s.submitted_at,
  s.data_source,
  s.exclude_from_ml,
  p.age,
  p.sex,
  p.diabetes_type,
  p.diabetes_duration_years,
  p.kidney_function,
  p.height_cm,
  p.weight_kg,
  round((p.weight_kg / nullif(power(p.height_cm / 100.0, 2), 0))::numeric, 2) as bmi,
  m.hba1c,
  m.hba1c_date,
  m.fasting_glucose,
  m.glucose_unit,
  m.previous_hba1c,
  l.adherence_level,
  l.missed_doses_30d,
  l.reason_missed,
  l.diet_quality,
  l.physical_activity,
  l.smoking,
  l.alcohol,
  q.treatment_satisfaction,
  q.qol_change,
  q.daily_routine_impact,
  q.hospitalisation_12m
from surveys s
join patients p on p.uid = s.uid
left join measurements m on m.survey_id = s.id
left join lifestyle l on l.survey_id = s.id
left join quality_of_life q on q.survey_id = s.id
where s.status = 'submitted';

create or replace view ai_med_features_v1 as
select
  pm.survey_id,
  pm.uid,
  coalesce(med.drug_class, pm.drug_class) as drug_class,
  count(*) as med_count,
  bool_or(pm.is_current) as has_current_med
from patient_medications pm
left join medications med on med.id = pm.medication_id
group by pm.survey_id, pm.uid, coalesce(med.drug_class, pm.drug_class);

create or replace view ai_side_effect_features_v1 as
select
  se.survey_id,
  count(*) as total_side_effects,
  count(*) filter (where se.effect_type = 'short_term') as short_term_count,
  count(*) filter (where se.effect_type = 'long_term') as long_term_count,
  count(*) filter (where se.severity = 'severe') as severe_count,
  bool_or(se.caused_med_change) as any_med_change,
  bool_or(se.reported_to_doctor) as any_reported
from side_effects se
group by se.survey_id;

create or replace view ai_training_dataset_v1 as
select
  f.*,
  mf.drug_class,
  mf.med_count,
  mf.has_current_med,
  sf.total_side_effects,
  sf.short_term_count,
  sf.long_term_count,
  sf.severe_count,
  sf.any_med_change,
  sf.any_reported
from ai_features_v1 f
left join ai_med_features_v1 mf on mf.survey_id = f.survey_id
left join ai_side_effect_features_v1 sf on sf.survey_id = f.survey_id
where f.exclude_from_ml = false;

create or replace view ai_labels_current_v1 as
select
  survey_id,
  uid,
  hba1c,
  case when hba1c > 8.0 then true else false end as poor_glycaemic_control,
  severe_count,
  case when severe_count > 0 then true else false end as has_severe_side_effect
from ai_training_dataset_v1
where hba1c is not null;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table profiles         enable row level security;
alter table consents          enable row level security;
alter table patients          enable row level security;
alter table patient_conditions enable row level security;
alter table surveys           enable row level security;
alter table measurements      enable row level security;
alter table patient_medications enable row level security;
alter table side_effects      enable row level security;
alter table lifestyle         enable row level security;
alter table quality_of_life   enable row level security;
alter table follow_up_consent enable row level security;
alter table cds_audit_events  enable row level security;
alter table export_audit      enable row level security;
alter table ml_models         enable row level security;
alter table ml_predictions    enable row level security;
alter table ml_explanations   enable row level security;
alter table medications       enable row level security;

-- Helper function: get current user's role
create or replace function get_my_role()
returns text
language sql
security definer
stable
as $$
  select role from profiles where uid = auth.uid()
$$;

-- ---- profiles ----
create policy "Users can view own profile"
  on profiles for select using (uid = auth.uid());

create policy "Admins can view all profiles"
  on profiles for select using (get_my_role() in ('research_admin','clinician_admin','super_admin'));

create policy "Users can update own profile"
  on profiles for update using (uid = auth.uid());

create policy "Super admin can update any profile"
  on profiles for update using (get_my_role() = 'super_admin');

create policy "Auth trigger inserts profile"
  on profiles for insert with check (uid = auth.uid());

-- ---- consents ----
create policy "Own consent read"
  on consents for select using (uid = auth.uid());

create policy "Admin consent read"
  on consents for select using (get_my_role() in ('research_admin','clinician_admin','super_admin'));

create policy "Own consent write"
  on consents for insert with check (uid = auth.uid());

create policy "Own consent update"
  on consents for update using (uid = auth.uid());

-- ---- patients ----
create policy "Own patient read"
  on patients for select using (uid = auth.uid());

create policy "Admin patient read"
  on patients for select using (get_my_role() in ('research_admin','clinician_admin','super_admin'));

create policy "Own patient write"
  on patients for insert with check (uid = auth.uid());

create policy "Own patient update"
  on patients for update using (uid = auth.uid());

-- ---- patient_conditions ----
create policy "Own conditions read"
  on patient_conditions for select using (uid = auth.uid());

create policy "Admin conditions read"
  on patient_conditions for select using (get_my_role() in ('research_admin','clinician_admin','super_admin'));

create policy "Own conditions write"
  on patient_conditions for insert with check (uid = auth.uid());

create policy "Own conditions delete"
  on patient_conditions for delete using (uid = auth.uid());

-- ---- surveys ----
create policy "Own surveys read"
  on surveys for select using (uid = auth.uid());

create policy "Admin surveys read"
  on surveys for select using (get_my_role() in ('research_admin','clinician_admin','super_admin'));

create policy "Own surveys write"
  on surveys for insert with check (uid = auth.uid());

create policy "Own draft surveys update"
  on surveys for update using (uid = auth.uid() and status = 'draft');

-- ---- measurements ----
create policy "Own measurements read"
  on measurements for select using (
    exists (select 1 from surveys s where s.id = measurements.survey_id and s.uid = auth.uid())
  );

create policy "Admin measurements read"
  on measurements for select using (get_my_role() in ('research_admin','clinician_admin','super_admin'));

create policy "Own measurements write"
  on measurements for insert with check (
    exists (select 1 from surveys s where s.id = measurements.survey_id and s.uid = auth.uid() and s.status = 'draft')
  );

create policy "Own measurements update"
  on measurements for update using (
    exists (select 1 from surveys s where s.id = measurements.survey_id and s.uid = auth.uid() and s.status = 'draft')
  );

-- ---- patient_medications ----
create policy "Own meds read"
  on patient_medications for select using (uid = auth.uid());

create policy "Admin meds read"
  on patient_medications for select using (get_my_role() in ('research_admin','clinician_admin','super_admin'));

create policy "Own meds write"
  on patient_medications for insert with check (uid = auth.uid());

create policy "Own meds update"
  on patient_medications for update using (uid = auth.uid());

create policy "Own meds delete"
  on patient_medications for delete using (uid = auth.uid());

-- ---- side_effects ----
create policy "Own side effects read"
  on side_effects for select using (
    exists (select 1 from surveys s where s.id = side_effects.survey_id and s.uid = auth.uid())
  );

create policy "Admin side effects read"
  on side_effects for select using (get_my_role() in ('research_admin','clinician_admin','super_admin'));

create policy "Own side effects write"
  on side_effects for insert with check (
    exists (select 1 from surveys s where s.id = side_effects.survey_id and s.uid = auth.uid() and s.status = 'draft')
  );

create policy "Own side effects delete"
  on side_effects for delete using (
    exists (select 1 from surveys s where s.id = side_effects.survey_id and s.uid = auth.uid() and s.status = 'draft')
  );

-- ---- lifestyle ----
create policy "Own lifestyle read"
  on lifestyle for select using (
    exists (select 1 from surveys s where s.id = lifestyle.survey_id and s.uid = auth.uid())
  );

create policy "Admin lifestyle read"
  on lifestyle for select using (get_my_role() in ('research_admin','clinician_admin','super_admin'));

create policy "Own lifestyle write"
  on lifestyle for insert with check (
    exists (select 1 from surveys s where s.id = lifestyle.survey_id and s.uid = auth.uid() and s.status = 'draft')
  );

create policy "Own lifestyle update"
  on lifestyle for update using (
    exists (select 1 from surveys s where s.id = lifestyle.survey_id and s.uid = auth.uid() and s.status = 'draft')
  );

-- ---- quality_of_life ----
create policy "Own qol read"
  on quality_of_life for select using (
    exists (select 1 from surveys s where s.id = quality_of_life.survey_id and s.uid = auth.uid())
  );

create policy "Admin qol read"
  on quality_of_life for select using (get_my_role() in ('research_admin','clinician_admin','super_admin'));

create policy "Own qol write"
  on quality_of_life for insert with check (
    exists (select 1 from surveys s where s.id = quality_of_life.survey_id and s.uid = auth.uid() and s.status = 'draft')
  );

create policy "Own qol update"
  on quality_of_life for update using (
    exists (select 1 from surveys s where s.id = quality_of_life.survey_id and s.uid = auth.uid() and s.status = 'draft')
  );

-- ---- follow_up_consent ----
create policy "Own follow_up_consent"
  on follow_up_consent for all using (uid = auth.uid());

-- ---- cds_audit_events ----
create policy "Clinician admin audit read"
  on cds_audit_events for select using (get_my_role() in ('clinician_admin','super_admin'));

create policy "Clinician admin audit write"
  on cds_audit_events for insert with check (get_my_role() in ('clinician_admin','super_admin') and uid = auth.uid());

-- ---- export_audit ----
create policy "Admin export audit read"
  on export_audit for select using (get_my_role() in ('research_admin','clinician_admin','super_admin'));

create policy "Admin export audit write"
  on export_audit for insert with check (get_my_role() in ('research_admin','clinician_admin','super_admin') and uid = auth.uid());

-- ---- ml_models ----
create policy "Admin ml_models read"
  on ml_models for select using (get_my_role() in ('research_admin','clinician_admin','super_admin'));

-- ---- ml_predictions ----
create policy "Admin ml_predictions read"
  on ml_predictions for select using (get_my_role() in ('research_admin','clinician_admin','super_admin'));

-- ---- ml_explanations ----
create policy "Admin ml_explanations read"
  on ml_explanations for select using (get_my_role() in ('research_admin','clinician_admin','super_admin'));

-- ---- medications (reference table — all users can read) ----
create policy "Anyone can read medications"
  on medications for select using (true);

create policy "Super admin manages medications"
  on medications for all using (get_my_role() = 'super_admin');

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile row when a new user signs up
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into profiles (uid, role)
  values (new.id, 'patient')
  on conflict (uid) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Auto-update updated_at timestamps
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();

create trigger patients_updated_at before update on patients
  for each row execute function update_updated_at();

create trigger surveys_updated_at before update on surveys
  for each row execute function update_updated_at();
