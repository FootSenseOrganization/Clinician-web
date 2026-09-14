export type RiskLevel = "low" | "moderate" | "high";
export type UserRole = "admin" | "clinician" | null;

export interface Clinician {
  id: string;
  name: string;
  email: string;
  specialty: string;
  institution: string;
  ahpra_number: string;
  avatar_initials: string;
  status: string;
  last_login: string;
  created_at: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  age: number;
  diabetes_type: string;
  diagnosis_year: number;
  phone: string;
  clinician_id: string;
  last_measurement: string;
  latest_risk_level: RiskLevel;
  latest_risk_score: number;
  total_measurements: number;
  avatar_initials: string;
}

export interface SensorReading {
  zone: string;
  zone_name: string;
  temp_celsius: number;
}

export interface ClinicalPoint {
  zone: string;
  temp_celsius: number;
  pixel_x: number;
  pixel_y: number;
}

export interface MeasurementAnalysis {
  max_asymmetry_celsius: number;
  asymmetry_zone: string;
  hotspot_detected: boolean;
  hotspot_zones: string[];
  risk_score: number;
  risk_level: RiskLevel;
}

export interface Measurement {
  id: string;
  user_id: string;
  timestamp: string;
  sensor_readings: {
    left_foot: SensorReading[];
    right_foot: SensorReading[];
  };
  analysis: MeasurementAnalysis;
  clinical_points: {
    left: ClinicalPoint[];
    right: ClinicalPoint[];
  };
  image_urls: {
    left: string;
    right: string;
    left_detected: string;
    right_detected: string;
  };
  notes: string | null;
}

export interface Alert {
  id: string;
  patient_id: string;
  patient_name: string;
  timestamp: string;
  risk_level: RiskLevel;
  risk_score: number;
  message: string;
  zone: string;
  asymmetry_value: number;
  acknowledged: boolean;
}

export type ApplicationStatus = "pending" | "approved" | "declined";

export interface Application {
  id: string;
  ahpra_number: string;
  full_name: string;
  email: string;
  specialty: string;
  institution: string;
  status: ApplicationStatus;
  submitted_at: string;
  decline_reason?: string | undefined;
}

export interface RegisteredClinician {
  id: string;
  name: string;
  email: string;
  specialty: string;
  institution: string;
  ahpra_number: string;
  status: "active" | "suspended";
  patient_count: number;
  last_login: string;
}

export interface AssignmentRequest {
  id: string;
  patient_name: string;
  patient_email: string;
  diabetes_type: string;
  age: number;
  device_model: string;
  requested_at: string;
  status: string;
}

export interface Remark {
  id: string;
  patient_id: string;
  clinician_id: string;
  clinician_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Instruction {
  id: string;
  patient_id: string;
  clinician_id: string;
  clinician_name: string;
  content: string;
  visible_to_patient: boolean;
  created_at: string;
}
