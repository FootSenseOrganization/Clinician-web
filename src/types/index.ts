export type RiskLevel = "low" | "moderate" | "high";
export type UserRole = "admin" | "clinician" | null;

// ─── Users ────────────────────────────────────────────────────────────────────

export interface Clinician {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialty: string;
  institution: string;
  ahpra_number: string;
  status: string;
  last_login: string;
  created_at: string;
  patient_count: number;
  is_admin?: boolean;
  is_clinician?: boolean;
  roles?: ("admin" | "clinician")[];
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  age: number | null;
  diabetes_type: string | null;
  diagnosis_year: number | null;
  mobile_number: string;
  clinician_id: string | null;
  last_measurement: string | null;
  latest_risk_level: RiskLevel;
  latest_risk_score: number;
  total_measurements: number;
  country_code: string;
  address: string;
}

// ─── Measurements ─────────────────────────────────────────────────────────────

export interface ClinicalPoint {
  zone: string;
  temp_celsius: number;
  pixel_x: number;
  pixel_y: number;
  grid_col: number;
  grid_row: number;
}

export interface MeasurementAnalysis {
  max_asymmetry_celsius: number;
  alert_triggered: boolean;
  alert_severity: string | null;
  clinical_points_left: ClinicalPoint[];
  clinical_points_right: ClinicalPoint[];
  zone_asymmetry: Record<string, number>;
  calibrated_left: number[][];
  calibrated_right: number[][];
  // Derived fields (computed by model mapper)
  risk_score: number;
  risk_level: RiskLevel;
  hotspot_detected: boolean;
  hotspot_zones: string[];
  asymmetry_zone: string;
}

export interface MeasurementImages {
  detected_9pts_url: string;
  room_calibrated_url: string;
  raw_url: string;
  left_url?: string;
  right_url?: string;
  left_detected_url?: string;
  right_detected_url?: string;
}

export interface Measurement {
  id: string;
  user_id: string;
  timestamp: string;
  notes: string | null;
  room_temp_start_celsius: number | null;
  room_temp_end_celsius: number | null;
  max_asymmetry_celsius: number | null;
  alert_triggered: boolean;
  alert_severity: string | null;
  analysis: MeasurementAnalysis;
  clinical_points: {
    left: ClinicalPoint[];
    right: ClinicalPoint[];
  };
  images: MeasurementImages;
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export interface Alert {
  id: string;
  patient_id: string;
  clinician_id: string;
  measurement_id: string | null;
  patient_first_name: string;
  patient_last_name: string;
  timestamp: string;
  risk_level: RiskLevel;
  risk_score: number;
  message: string;
  zone: string | null;
  asymmetry_value: number | null;
  acknowledged: boolean;
}

// ─── Applications ─────────────────────────────────────────────────────────────

export type ApplicationStatus = "pending" | "approved" | "declined";

export interface Application {
  id: string;
  ahpra_number: string;
  first_name: string;
  last_name: string;
  email: string;
  specialty: string;
  institution: string;
  status: ApplicationStatus;
  submitted_at: string;
  decline_reason?: string | undefined;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
}

export interface RegisteredClinician {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialty: string;
  institution: string;
  ahpra_number: string;
  status: "active" | "suspended";
  patient_count: number;
  last_login: string;
  is_admin?: boolean;
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export interface AssignmentRequest {
  id: string;
  patient_id: string | null;
  clinician_id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_email: string;
  diabetes_type: string;
  age: number;
  device_model: string | null;
  requested_at: string;
  status: string;
}

// ─── Remarks & Instructions ──────────────────────────────────────────────────

export interface Remark {
  id: string;
  patient_id: string;
  clinician_id: string;
  clinician_first_name: string;
  clinician_last_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Instruction {
  id: string;
  patient_id: string;
  clinician_id: string;
  clinician_first_name: string;
  clinician_last_name: string;
  content: string;
  visible_to_patient: boolean;
  created_at: string;
}
