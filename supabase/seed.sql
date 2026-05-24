-- DiabetaX — Medications Reference Table Seed
-- Run this after the migration to populate the medications reference table

insert into medications (name, drug_class) values
  -- Biguanides
  ('Metformin', 'Biguanide'),

  -- Sulfonylureas
  ('Gliclazide', 'Sulfonylurea'),
  ('Glibenclamide', 'Sulfonylurea'),
  ('Glimepiride', 'Sulfonylurea'),
  ('Glipizide', 'Sulfonylurea'),

  -- DPP-4 Inhibitors
  ('Sitagliptin', 'DPP-4 Inhibitor'),
  ('Vildagliptin', 'DPP-4 Inhibitor'),
  ('Linagliptin', 'DPP-4 Inhibitor'),
  ('Teneligliptin', 'DPP-4 Inhibitor'),
  ('Saxagliptin', 'DPP-4 Inhibitor'),
  ('Alogliptin', 'DPP-4 Inhibitor'),

  -- SGLT2 Inhibitors
  ('Empagliflozin', 'SGLT2 Inhibitor'),
  ('Dapagliflozin', 'SGLT2 Inhibitor'),
  ('Canagliflozin', 'SGLT2 Inhibitor'),
  ('Ertugliflozin', 'SGLT2 Inhibitor'),

  -- Thiazolidinediones (TZDs)
  ('Pioglitazone', 'Thiazolidinedione'),
  ('Rosiglitazone', 'Thiazolidinedione'),

  -- Alpha-Glucosidase Inhibitors
  ('Acarbose', 'Alpha-Glucosidase Inhibitor'),
  ('Miglitol', 'Alpha-Glucosidase Inhibitor'),
  ('Voglibose', 'Alpha-Glucosidase Inhibitor'),

  -- GLP-1 Receptor Agonists
  ('Liraglutide', 'GLP-1 Receptor Agonist'),
  ('Semaglutide', 'GLP-1 Receptor Agonist'),
  ('Dulaglutide', 'GLP-1 Receptor Agonist'),
  ('Exenatide', 'GLP-1 Receptor Agonist'),
  ('Lixisenatide', 'GLP-1 Receptor Agonist'),

  -- Insulin
  ('Insulin (Regular)', 'Insulin'),
  ('Insulin (NPH)', 'Insulin'),
  ('Insulin (Glargine)', 'Insulin'),
  ('Insulin (Detemir)', 'Insulin'),
  ('Insulin (Degludec)', 'Insulin'),
  ('Insulin (Aspart)', 'Insulin'),
  ('Insulin (Lispro)', 'Insulin'),
  ('Insulin (Glulisine)', 'Insulin'),
  ('Premixed Insulin', 'Insulin'),

  -- Meglitinides
  ('Repaglinide', 'Meglitinide'),
  ('Nateglinide', 'Meglitinide')

on conflict (name) do nothing;
