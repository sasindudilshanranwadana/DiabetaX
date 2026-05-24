export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cds_audit_events: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          uid: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          uid: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "cds_audit_events_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      consents: {
        Row: {
          consent_version: string
          consented: boolean
          consented_at: string | null
          id: string
          uid: string
        }
        Insert: {
          consent_version?: string
          consented?: boolean
          consented_at?: string | null
          id?: string
          uid: string
        }
        Update: {
          consent_version?: string
          consented?: boolean
          consented_at?: string | null
          id?: string
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      export_audit: {
        Row: {
          created_at: string
          export_type: string
          filters: Json | null
          id: string
          role: string
          uid: string
        }
        Insert: {
          created_at?: string
          export_type: string
          filters?: Json | null
          id?: string
          role: string
          uid: string
        }
        Update: {
          created_at?: string
          export_type?: string
          filters?: Json | null
          id?: string
          role?: string
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_audit_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      follow_up_consent: {
        Row: {
          consented: boolean
          created_at: string
          uid: string
        }
        Insert: {
          consented?: boolean
          created_at?: string
          uid: string
        }
        Update: {
          consented?: boolean
          created_at?: string
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_consent_uid_fkey"
            columns: ["uid"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      lifestyle: {
        Row: {
          adherence_level: string | null
          alcohol: string | null
          diet_quality: string | null
          id: string
          missed_doses_30d: string | null
          physical_activity: string | null
          reason_missed: string | null
          smoking: string | null
          survey_id: string
        }
        Insert: {
          adherence_level?: string | null
          alcohol?: string | null
          diet_quality?: string | null
          id?: string
          missed_doses_30d?: string | null
          physical_activity?: string | null
          reason_missed?: string | null
          smoking?: string | null
          survey_id: string
        }
        Update: {
          adherence_level?: string | null
          alcohol?: string | null
          diet_quality?: string | null
          id?: string
          missed_doses_30d?: string | null
          physical_activity?: string | null
          reason_missed?: string | null
          smoking?: string | null
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lifestyle_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: true
            referencedRelation: "ai_features_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "lifestyle_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: true
            referencedRelation: "ai_labels_current_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "lifestyle_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: true
            referencedRelation: "ai_training_dataset_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "lifestyle_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: true
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          fasting_glucose: number | null
          glucose_unit: string | null
          hba1c: number | null
          hba1c_date: string | null
          id: string
          previous_hba1c: number | null
          survey_id: string
        }
        Insert: {
          fasting_glucose?: number | null
          glucose_unit?: string | null
          hba1c?: number | null
          hba1c_date?: string | null
          id?: string
          previous_hba1c?: number | null
          survey_id: string
        }
        Update: {
          fasting_glucose?: number | null
          glucose_unit?: string | null
          hba1c?: number | null
          hba1c_date?: string | null
          id?: string
          previous_hba1c?: number | null
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurements_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_features_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "measurements_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_labels_current_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "measurements_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_training_dataset_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "measurements_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          drug_class: string
          id: string
          name: string
        }
        Insert: {
          drug_class: string
          id?: string
          name: string
        }
        Update: {
          drug_class?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      ml_explanations: {
        Row: {
          created_at: string
          explanation: Json | null
          id: string
          model_id: string | null
          survey_id: string | null
          uid: string | null
        }
        Insert: {
          created_at?: string
          explanation?: Json | null
          id?: string
          model_id?: string | null
          survey_id?: string | null
          uid?: string | null
        }
        Update: {
          created_at?: string
          explanation?: Json | null
          id?: string
          model_id?: string | null
          survey_id?: string | null
          uid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_explanations_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ml_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_explanations_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_features_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "ml_explanations_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_labels_current_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "ml_explanations_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_training_dataset_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "ml_explanations_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_explanations_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      ml_models: {
        Row: {
          id: string
          is_active: boolean
          metrics: Json | null
          name: string
          trained_at: string | null
          version: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          metrics?: Json | null
          name: string
          trained_at?: string | null
          version: string
        }
        Update: {
          id?: string
          is_active?: boolean
          metrics?: Json | null
          name?: string
          trained_at?: string | null
          version?: string
        }
        Relationships: []
      }
      ml_predictions: {
        Row: {
          created_at: string
          id: string
          model_id: string | null
          prediction: Json | null
          survey_id: string | null
          uid: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          model_id?: string | null
          prediction?: Json | null
          survey_id?: string | null
          uid?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          model_id?: string | null
          prediction?: Json | null
          survey_id?: string | null
          uid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_predictions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ml_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_predictions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_features_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "ml_predictions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_labels_current_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "ml_predictions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_training_dataset_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "ml_predictions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_predictions_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      patient_conditions: {
        Row: {
          condition: string
          id: string
          uid: string
        }
        Insert: {
          condition: string
          id?: string
          uid: string
        }
        Update: {
          condition?: string
          id?: string
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_conditions_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      patient_medications: {
        Row: {
          created_at: string
          custom_name: string | null
          dose_unit: string | null
          dose_value: number | null
          drug_class: string | null
          end_date: string | null
          frequency: string | null
          id: string
          is_current: boolean
          medication_id: string | null
          start_date: string | null
          survey_id: string | null
          uid: string
        }
        Insert: {
          created_at?: string
          custom_name?: string | null
          dose_unit?: string | null
          dose_value?: number | null
          drug_class?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_current?: boolean
          medication_id?: string | null
          start_date?: string | null
          survey_id?: string | null
          uid: string
        }
        Update: {
          created_at?: string
          custom_name?: string | null
          dose_unit?: string | null
          dose_value?: number | null
          drug_class?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_current?: boolean
          medication_id?: string | null
          start_date?: string | null
          survey_id?: string | null
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_medications_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_medications_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_features_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "patient_medications_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_labels_current_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "patient_medications_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_training_dataset_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "patient_medications_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_medications_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      patients: {
        Row: {
          age: number | null
          created_at: string
          diabetes_duration_years: number | null
          diabetes_type: string | null
          height_cm: number | null
          kidney_function: string | null
          pregnancy_status: string | null
          sex: string | null
          uid: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          created_at?: string
          diabetes_duration_years?: number | null
          diabetes_type?: string | null
          height_cm?: number | null
          kidney_function?: string | null
          pregnancy_status?: string | null
          sex?: string | null
          uid: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          created_at?: string
          diabetes_duration_years?: number | null
          diabetes_type?: string | null
          height_cm?: number | null
          kidney_function?: string | null
          pregnancy_status?: string | null
          sex?: string | null
          uid?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_uid_fkey"
            columns: ["uid"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          participant_code: string | null
          role: string
          uid: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          participant_code?: string | null
          role?: string
          uid: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          participant_code?: string | null
          role?: string
          uid?: string
          updated_at?: string
        }
        Relationships: []
      }
      quality_of_life: {
        Row: {
          consider_switch: string | null
          daily_routine_impact: string | null
          doctor_visit_freq: string | null
          hospitalisation_12m: boolean | null
          id: string
          qol_change: string | null
          survey_id: string
          treatment_satisfaction: number | null
        }
        Insert: {
          consider_switch?: string | null
          daily_routine_impact?: string | null
          doctor_visit_freq?: string | null
          hospitalisation_12m?: boolean | null
          id?: string
          qol_change?: string | null
          survey_id: string
          treatment_satisfaction?: number | null
        }
        Update: {
          consider_switch?: string | null
          daily_routine_impact?: string | null
          doctor_visit_freq?: string | null
          hospitalisation_12m?: boolean | null
          id?: string
          qol_change?: string | null
          survey_id?: string
          treatment_satisfaction?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_of_life_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: true
            referencedRelation: "ai_features_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "quality_of_life_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: true
            referencedRelation: "ai_labels_current_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "quality_of_life_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: true
            referencedRelation: "ai_training_dataset_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "quality_of_life_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: true
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      side_effects: {
        Row: {
          caused_med_change: boolean | null
          effect_name: string
          effect_type: string
          id: string
          ongoing: boolean | null
          onset_time: string | null
          reported_to_doctor: boolean | null
          severity: string | null
          survey_id: string
        }
        Insert: {
          caused_med_change?: boolean | null
          effect_name: string
          effect_type: string
          id?: string
          ongoing?: boolean | null
          onset_time?: string | null
          reported_to_doctor?: boolean | null
          severity?: string | null
          survey_id: string
        }
        Update: {
          caused_med_change?: boolean | null
          effect_name?: string
          effect_type?: string
          id?: string
          ongoing?: boolean | null
          onset_time?: string | null
          reported_to_doctor?: boolean | null
          severity?: string | null
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "side_effects_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_features_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "side_effects_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_labels_current_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "side_effects_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_training_dataset_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "side_effects_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string
          data_source: string
          exclude_from_ml: boolean
          id: string
          status: string
          submitted_at: string | null
          survey_type: string
          uid: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_source?: string
          exclude_from_ml?: boolean
          id?: string
          status?: string
          submitted_at?: string | null
          survey_type: string
          uid: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_source?: string
          exclude_from_ml?: boolean
          id?: string
          status?: string
          submitted_at?: string | null
          survey_type?: string
          uid?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surveys_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
    }
    Views: {
      ai_features_v1: {
        Row: {
          adherence_level: string | null
          age: number | null
          alcohol: string | null
          bmi: number | null
          daily_routine_impact: string | null
          data_source: string | null
          diabetes_duration_years: number | null
          diabetes_type: string | null
          diet_quality: string | null
          exclude_from_ml: boolean | null
          fasting_glucose: number | null
          glucose_unit: string | null
          hba1c: number | null
          hba1c_date: string | null
          height_cm: number | null
          hospitalisation_12m: boolean | null
          kidney_function: string | null
          missed_doses_30d: string | null
          physical_activity: string | null
          previous_hba1c: number | null
          qol_change: string | null
          reason_missed: string | null
          sex: string | null
          smoking: string | null
          submitted_at: string | null
          survey_id: string | null
          survey_type: string | null
          treatment_satisfaction: number | null
          uid: string | null
          weight_kg: number | null
        }
        Relationships: [
          {
            foreignKeyName: "surveys_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      ai_labels_current_v1: {
        Row: {
          has_severe_side_effect: boolean | null
          hba1c: number | null
          poor_glycaemic_control: boolean | null
          severe_count: number | null
          survey_id: string | null
          uid: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surveys_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      ai_med_features_v1: {
        Row: {
          drug_class: string | null
          has_current_med: boolean | null
          med_count: number | null
          survey_id: string | null
          uid: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_medications_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_features_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "patient_medications_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_labels_current_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "patient_medications_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_training_dataset_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "patient_medications_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_medications_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      ai_side_effect_features_v1: {
        Row: {
          any_med_change: boolean | null
          any_reported: boolean | null
          long_term_count: number | null
          severe_count: number | null
          short_term_count: number | null
          survey_id: string | null
          total_side_effects: number | null
        }
        Relationships: [
          {
            foreignKeyName: "side_effects_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_features_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "side_effects_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_labels_current_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "side_effects_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ai_training_dataset_v1"
            referencedColumns: ["survey_id"]
          },
          {
            foreignKeyName: "side_effects_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_training_dataset_v1: {
        Row: {
          adherence_level: string | null
          age: number | null
          alcohol: string | null
          any_med_change: boolean | null
          any_reported: boolean | null
          bmi: number | null
          daily_routine_impact: string | null
          data_source: string | null
          diabetes_duration_years: number | null
          diabetes_type: string | null
          diet_quality: string | null
          drug_class: string | null
          exclude_from_ml: boolean | null
          fasting_glucose: number | null
          glucose_unit: string | null
          has_current_med: boolean | null
          hba1c: number | null
          hba1c_date: string | null
          height_cm: number | null
          hospitalisation_12m: boolean | null
          kidney_function: string | null
          long_term_count: number | null
          med_count: number | null
          missed_doses_30d: string | null
          physical_activity: string | null
          previous_hba1c: number | null
          qol_change: string | null
          reason_missed: string | null
          severe_count: number | null
          sex: string | null
          short_term_count: number | null
          smoking: string | null
          submitted_at: string | null
          survey_id: string | null
          survey_type: string | null
          total_side_effects: number | null
          treatment_satisfaction: number | null
          uid: string | null
          weight_kg: number | null
        }
        Relationships: [
          {
            foreignKeyName: "surveys_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
    }
    Functions: {
      get_my_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

export type Role = 'patient' | 'research_admin' | 'clinician_admin' | 'super_admin'
