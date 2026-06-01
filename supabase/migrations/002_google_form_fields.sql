-- Migration 002: Add all fields from the Google Form so the baseline survey
-- can capture every question (37 questions across 4 sections).

-- ── Lifestyle: exercise, clinic, diet plan text ──────────────────────────────
alter table lifestyle add column if not exists exercise_frequency text;  -- Once a week / 3 Days per week / Daily / None
alter table lifestyle add column if not exists exercise_duration text;   -- half hour / 1 hour / more than 1 hour
alter table lifestyle add column if not exists follows_clinic boolean;
alter table lifestyle add column if not exists follows_diet boolean;
alter table lifestyle add column if not exists diet_plan_text text;

-- ── Survey-level treatment / side-effect summary fields ──────────────────────
-- These are asked once per response in the Google Form (not per medication/effect)
alter table surveys add column if not exists on_insulin boolean;
alter table surveys add column if not exists med_changed boolean;
alter table surveys add column if not exists med_change_reason text;
alter table surveys add column if not exists med_duration text;           -- Less than 3 months ... More than 5 years
alter table surveys add column if not exists side_effect_severity text;   -- Normal / Worse / Much Worse
alter table surveys add column if not exists side_effect_reported text;   -- Yes / No / Maybe
alter table surveys add column if not exists wound_consent boolean;
alter table surveys add column if not exists wound_image_url text;
alter table surveys add column if not exists full_name text;              -- optional respondent name (kept private)

-- ── Medications: single dose value already exists; allow a shared dose dropdown
-- (Google Form has one "Current Medication Drug Dose" radio for the whole form)
alter table surveys add column if not exists primary_dose text;           -- 0.25 mg ... 1000 mg / units

-- ── Patients: pregnancy / breastfeeding / planning already covered by
-- patient_conditions rows + pregnancy_status; no change needed.

-- ── Storage bucket for wound images (idempotent) ─────────────────────────────
insert into storage.buckets (id, name, public)
values ('wound-images', 'wound-images', false)
on conflict (id) do nothing;
