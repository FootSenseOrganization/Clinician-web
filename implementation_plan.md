# Phase 2: Full Rewire — mockData → Supabase + UI Compatibility

## Goal

Replace **all** `mockData.ts` imports with live Supabase queries. After this phase: zero mock data, zero hardcoded numbers, every UI component derives data from Supabase. Thermal images from GCS rendered inline.

---

## Deep Audit: DB ↔ UI Field Mismatches

### 1. Measurement Type (CRITICAL — 6 breaking changes)

| UI Field (old `Measurement` type) | DB Field (Supabase) | Status |
|---|---|---|
| `sensor_readings.left_foot[]` | **GONE** — no `sensor_readings` column | ❌ Must remove |
| `sensor_readings.right_foot[]` | **GONE** | ❌ Must remove |
| `analysis.risk_score` | `analysis` JSONB — **no `risk_score` key** | ❌ Must compute |
| `analysis.risk_level` | `analysis` JSONB — **no `risk_level` key** | ❌ Must derive from alert_severity |
| `analysis.hotspot_detected` | **GONE** | ❌ Must derive from max_asymmetry |
| `analysis.hotspot_zones` | **GONE** — use `zone_asymmetry` keys where value > 2°C | ❌ Must derive |
| `analysis.asymmetry_zone` | **GONE** — max key from `zone_asymmetry` | ❌ Must derive |
| `clinical_points.left[]` | `analysis.clinical_points_left[]` | ⚠️ Moved into JSONB |
| `clinical_points.right[]` | `analysis.clinical_points_right[]` | ⚠️ Moved into JSONB |
| `image_urls.left/right/left_detected/right_detected` | `images.raw_url`, `images.room_calibrated_url`, `images.detected_9pts_url` | ⚠️ Different keys |
| `analysis.max_asymmetry_celsius` | `analysis.max_asymmetry_celsius` ✓ | ✅ Same |
| — | `analysis.calibrated_left` (20x8 grid) | 🆕 NEW |
| — | `analysis.calibrated_right` (20x8 grid) | 🆕 NEW |
| — | `analysis.zone_asymmetry` (9-zone map) | 🆕 NEW |

### Actual JSONB `analysis` structure (from MongoDB):
```json
{
  "calibrated_left": [[...20x8 float grid...]],
  "calibrated_right": [[...20x8 float grid...]],
  "max_asymmetry_celsius": 7.39,
  "alert_triggered": true,
  "alert_severity": "high",
  "clinical_points_left": [
    { "zone": "Heel (Calcaneus)", "pixel_x": 80, "pixel_y": 340, "grid_col": 3.5, "grid_row": 16.2, "temp_celsius": 24.01 }
  ],
  "clinical_points_right": [...same structure...],
  "zone_asymmetry": {
    "Big Toe (Hallux)": 4.71,
    "3rd Toe": 2.95,
    "5th Toe": 4.02,
    "Heel (Calcaneus)": 0.09,
    "1st Metatarsal (Inner Ball)": 0.12,
    "3rd Metatarsal (Center Ball)": 0.35,
    "5th Metatarsal (Outer Ball)": 1.59,
    "Medial Midfoot (Arch)": 0.01,
    "Lateral Midfoot": 0.32
  }
}
```

### Actual JSONB `images` structure:
```json
{
  "detected_9pts_url": "https://storage.googleapis.com/footsense-heatmaps-monashuni/01389baf2be1_detected_9pts.png",
  "room_calibrated_url": "https://storage.googleapis.com/footsense-heatmaps-monashuni/01389baf2be1_room_calibrated.png",
  "raw_url": "https://storage.googleapis.com/footsense-heatmaps-monashuni/01389baf2be1_raw.png"
}
```

### 2. ClinicalPoint Type (minor)
| UI Field | DB Field | Status |
|---|---|---|
| `zone` | `zone` ✓ | ✅ |
| `temp_celsius` | `temp_celsius` ✓ | ✅ |
| `pixel_x` | `pixel_x` ✓ | ✅ |
| `pixel_y` | `pixel_y` ✓ | ✅ |
| — | `grid_col` (new) | 🆕 Available |
| — | `grid_row` (new) | 🆕 Available |

### 3. Patient Type (minor)
| UI Field | DB Field (patient_summary view) | Status |
|---|---|---|
| `phone` | `mobile_number` | ⚠️ Renamed |
| All others | Match ✓ | ✅ |

### 4. Remark/Instruction Types
| UI Field | DB Field | Status |
|---|---|---|
| `clinician_name` | **Not in DB** — DB only has `clinician_id` | ⚠️ Must JOIN |

---

## Proposed Changes

### Layer 0: Dependencies

#### [NEW] Install React Query
```bash
npm install @tanstack/react-query
```

#### [MODIFY] [main.tsx](file:///d:/Footsens/clinician-web/src/main.tsx)
Wrap app in `<QueryClientProvider>`.

---

### Layer 1: Type Definitions

#### [MODIFY] [types/index.ts](file:///d:/Footsens/clinician-web/src/types/index.ts)

```diff
 export interface ClinicalPoint {
   zone: string;
   temp_celsius: number;
   pixel_x: number;
   pixel_y: number;
+  grid_col: number;
+  grid_row: number;
 }

-export interface SensorReading { ... }       // DELETE entirely
-export interface MeasurementAnalysis { ... } // DELETE entirely

+export interface MeasurementAnalysis {
+  max_asymmetry_celsius: number;
+  alert_triggered: boolean;
+  alert_severity: string | null;
+  clinical_points_left: ClinicalPoint[];
+  clinical_points_right: ClinicalPoint[];
+  zone_asymmetry: Record<string, number>;
+  calibrated_left: number[][];
+  calibrated_right: number[][];
+  // Derived fields (computed by model mapper)
+  risk_score: number;
+  risk_level: RiskLevel;
+  hotspot_detected: boolean;
+  hotspot_zones: string[];
+  asymmetry_zone: string;
+}

+export interface MeasurementImages {
+  detected_9pts_url: string;
+  room_calibrated_url: string;
+  raw_url: string;
+}

 export interface Measurement {
   id: string;
   user_id: string;
   timestamp: string;
-  sensor_readings: { ... };
-  analysis: MeasurementAnalysis;
-  clinical_points: { left: ...; right: ... };
-  image_urls: { ... };
+  analysis: MeasurementAnalysis;        // Mapped from JSONB
+  clinical_points: {                    // Extracted from analysis
+    left: ClinicalPoint[];
+    right: ClinicalPoint[];
+  };
+  images: MeasurementImages;            // GCS URLs
   notes: string | null;
+  max_asymmetry_celsius: number;
+  alert_triggered: boolean;
+  alert_severity: string | null;
+  room_temp_start_celsius: number | null;
+  room_temp_end_celsius: number | null;
 }

 export interface Patient {
   ...
-  phone: string;
+  mobile_number: string;
 }

 export interface Remark {
   ...
-  clinician_name: string;  // Will be fetched via JOIN
+  clinician_name: string;
 }
```

---

### Layer 2: Model Files — Mapper + Async Supabase

#### [MODIFY] [measurementModel.ts](file:///d:/Footsens/clinician-web/src/models/measurementModel.ts)

This is the most critical change. The model must:
1. Query Supabase `measurements` table
2. **Map** the raw JSONB `analysis` blob → structured `MeasurementAnalysis` with derived fields
3. Extract `clinical_points` from analysis JSONB
4. Map `images` JSONB to typed `MeasurementImages`

```typescript
import { supabase } from "@/lib/supabaseClient";
import type { Measurement, MeasurementAnalysis, ClinicalPoint, RiskLevel } from "@/types";

function deriveRiskScore(maxAsym: number): number {
  // Scale asymmetry to 0–100 risk score
  return Math.min(100, Math.round((maxAsym / 10) * 100));
}

function deriveRiskLevel(score: number): RiskLevel {
  if (score >= 60) return "high";
  if (score >= 30) return "moderate";
  return "low";
}

function mapAnalysis(raw: any): MeasurementAnalysis {
  const maxAsym = raw?.max_asymmetry_celsius ?? 0;
  const zoneAsym: Record<string, number> = raw?.zone_asymmetry ?? {};
  const hotspotZones = Object.entries(zoneAsym)
    .filter(([, v]) => v > 2)
    .sort(([, a], [, b]) => b - a)
    .map(([k]) => k);
  const riskScore = deriveRiskScore(maxAsym);
  const asymmetryZone = hotspotZones[0] ?? "None";

  return {
    max_asymmetry_celsius: maxAsym,
    alert_triggered: raw?.alert_triggered ?? false,
    alert_severity: raw?.alert_severity ?? null,
    clinical_points_left: raw?.clinical_points_left ?? [],
    clinical_points_right: raw?.clinical_points_right ?? [],
    zone_asymmetry: zoneAsym,
    calibrated_left: raw?.calibrated_left ?? [],
    calibrated_right: raw?.calibrated_right ?? [],
    risk_score: riskScore,
    risk_level: deriveRiskLevel(riskScore),
    hotspot_detected: hotspotZones.length > 0,
    hotspot_zones: hotspotZones,
    asymmetry_zone: asymmetryZone,
  };
}

function mapRow(row: any): Measurement {
  const analysis = mapAnalysis(row.analysis);
  return {
    ...row,
    analysis,
    clinical_points: {
      left: analysis.clinical_points_left,
      right: analysis.clinical_points_right,
    },
    images: row.images ?? { detected_9pts_url: "", room_calibrated_url: "", raw_url: "" },
  };
}

export async function findByPatientId(patientId: string): Promise<Measurement[]> {
  const { data, error } = await supabase
    .from("measurements")
    .select("*")
    .eq("user_id", patientId)
    .order("timestamp", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}
```

#### [MODIFY] All other 7 model files
Same pattern: remove `mockData` import → async `supabase.from(table).select()`.

**Remark/Instruction models** need to JOIN `users_profile` to get `clinician_name`:
```typescript
export async function findByPatientId(patientId: string) {
  const { data, error } = await supabase
    .from("remarks")
    .select("*, clinician:users_profile!clinician_id(first_name, last_name)")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  // Map: clinician_name = CONCAT(clinician.first_name, ' ', clinician.last_name)
}
```

---

### Layer 3: Services → async

Every service function changes from sync → async. Example:
```diff
-export function getPatientMeasurements(patientId: string): Measurement[] {
-  return [...measurementModel.findByPatientId(patientId)]...
+export async function getPatientMeasurements(patientId: string): Promise<Measurement[]> {
+  const data = await measurementModel.findByPatientId(patientId);
+  return data;
 }
```

### Layer 4: Controllers → async
Same sync → async propagation.

---

### Layer 5: Auth System

#### [MODIFY] [LoginPage.tsx](file:///d:/Footsens/clinician-web/src/pages/LoginPage.tsx)
- Replace "Sign in with Google" → **email input field** (no password)
- On submit: look up email in `users_profile` where `role = 'clinician'`
- If found: set auth state, navigate to dashboard
- If not: show error

#### [MODIFY] [AdminLoginPage.tsx](file:///d:/Footsens/clinician-web/src/pages/AdminLoginPage.tsx)
- Replace username+password → **email input only**
- On submit: look up email in `users_profile` where `role = 'admin'`
- If found: set auth state

#### [MODIFY] [AuthContext.tsx](file:///d:/Footsens/clinician-web/src/context/AuthContext.tsx)
- Remove `mockClinician` import
- `loginWithEmail(email: string)`: fetch clinician/admin from Supabase
- Store full user object in context state
- `user` now comes from `clinician_summary` view

#### Admin email change
- Update Supabase: change `admin@footsense.io` → `foot.sense.monash@gmail.com`

---

### Layer 6: UI Components

#### [MODIFY] [ThermalFoot.tsx](file:///d:/Footsens/clinician-web/src/components/ThermalFoot.tsx)
**Critical**: Currently shows placeholder "Thermal Image" text. Now render actual GCS heatmap:

```diff
 <div className="relative h-[600px] w-[240px] ...">
-  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white/40">
-    Thermal Image
-  </span>
+  <img
+    src={measurement.images.detected_9pts_url}
+    alt={`${side} foot thermal heatmap`}
+    className="absolute inset-0 h-full w-full object-contain"
+    crossOrigin="anonymous"
+  />
```

Clinical point positioning: The `pixel_x`/`pixel_y` from the DB are absolute pixel coordinates on the original heatmap image. We need to scale them relative to the rendered container size.

#### [MODIFY] [PatientDetailPage.tsx](file:///d:/Footsens/clinician-web/src/pages/PatientDetailPage.tsx)

**12 breaking references to fix:**

| Line | Old Code | Fix |
|---|---|---|
| L25 | `import { mockClinician }` | Use `useAuth().user` |
| L44 | `patientController.getPatientDetail(id!)` sync | `useQuery` async |
| L45 | `patientController.getPatientMeasurements(id!)` sync | `useQuery` async |
| L70 | `m.analysis.risk_score` | ✅ Now derived by mapper |
| L122 | `patient.phone` | `patient.mobile_number` |
| L194 | `selected.analysis.hotspot_detected` | ✅ Now derived |
| L196 | `selected.analysis.asymmetry_zone` | ✅ Now derived |
| L229 | `selected.sensor_readings.left_foot` | **Replace** with `zone_asymmetry` table |
| L365 | `m.analysis.risk_level` | ✅ Now derived |
| L374 | `m.analysis.hotspot_zones` | ✅ Now derived |
| L400 | `m.sensor_readings[sideKey]` | **Replace** with clinical_points |
| L468/602 | `mockClinician.id/.name` | `useAuth().user.id/.name` |

#### [MODIFY] [ClinicianLayout.tsx](file:///d:/Footsens/clinician-web/src/components/layout/ClinicianLayout.tsx)
- L16: Remove `mockClinician` import
- L64/65: `alertController.getUnreadCount()` sync → async `useQuery`
- L93/97/100: `mockClinician.avatar_initials/.name/.specialty` → `useAuth().user`

#### [MODIFY] [ClinicianDashboardPage.tsx](file:///d:/Footsens/clinician-web/src/pages/ClinicianDashboardPage.tsx)
- L8: Remove `mockClinician` import → use `useAuth().user`

#### Zone Asymmetry Table (new approach for L229-257)
Since `sensor_readings` no longer exists, replace the zone comparison table with data from `analysis.zone_asymmetry`:
```typescript
// Build from zone_asymmetry + clinical_points
const zones = Object.entries(selected.analysis.zone_asymmetry).map(([zone, asymmetry]) => {
  const left = selected.analysis.clinical_points_left.find(p => p.zone === zone);
  const right = selected.analysis.clinical_points_right.find(p => p.zone === zone);
  return { zone, leftTemp: left?.temp_celsius ?? 0, rightTemp: right?.temp_celsius ?? 0, asymmetry };
});
```

---

### Layer 7: Cleanup

#### [DELETE] [mockData.ts](file:///d:/Footsens/clinician-web/src/mock/mockData.ts)

---

## Execution Order

| Step | What | Files |
|---|---|---|
| 1 | Install React Query | `package.json` |
| 2 | Wrap app in QueryClientProvider | `main.tsx` |
| 3 | Update admin email in DB | SQL query |
| 4 | Rewrite `types/index.ts` | 1 file |
| 5 | Rewrite all 8 model files (async + mapper) | 8 files |
| 6 | Rewrite all 9 service files (async) | 9 files |
| 7 | Rewrite all 7 controller files (async) | 7 files |
| 8 | Rewrite `AuthContext.tsx` (Supabase lookup) | 1 file |
| 9 | Rewrite `LoginPage.tsx` + `AdminLoginPage.tsx` (email only) | 2 files |
| 10 | Rewrite `ClinicianLayout.tsx` (use auth context) | 1 file |
| 11 | Rewrite `ThermalFoot.tsx` (render GCS images) | 1 file |
| 12 | Rewrite all page files (useQuery, loading, async) | 10 pages |
| 13 | Add write mutations (remarks, instructions, alerts) | models |
| 14 | Delete `mockData.ts` | 1 file |
| 15 | Build test | `npm run build` |

---

## Testing Plan (25 Test Cases)

### Verification Data (Live in DB)

| Table | Rows | Key Verification Points |
|---|---|---|
| `users_profile` | 8 | All NOT NULL ✓, admin = foot.sense.monash@gmail.com |
| `measurements` | 5 | All have `images` with GCS URLs + full `analysis` JSONB |
| `alerts` | 3 | Tharaka=high(72), Kenath=moderate(48), Kavindu=low(15) |
| `patient_summary` view | 5 | risk computed from analysis JSONB |
| `clinician_summary` view | 2 | Sarah(5 patients), James(0) |

### Test Matrix

#### Auth (T1–T3)
| # | Test | Expected |
|---|---|---|
| T1 | Admin login with `foot.sense.monash@gmail.com` | Logs in, redirects to `/admin/dashboard` |
| T2 | Clinician login with `sarah.chen@citymedical.com` | Logs in, redirects to `/dashboard` |
| T3 | Login with invalid email | Shows error, no redirect |

#### Dashboard (T4–T8)
| # | Test | Expected |
|---|---|---|
| T4 | Greeting shows clinician name | "Dr. Sarah Chen" from DB, not hardcoded |
| T5 | Sidebar shows clinician info | "SC", "Podiatry" from `clinician_summary` |
| T6 | Total Patients stat | 5 (from `patient_summary` count) |
| T7 | Unread Alerts badge | 2 (from DB `alerts WHERE acknowledged = false`) |
| T8 | Recent Patients list | Real names from DB |

#### Patient List (T9–T11)
| # | Test | Expected |
|---|---|---|
| T9 | All 5 patients render | Names from DB: Tharaka, Kenath, Kavindu, Steven, Emily |
| T10 | Risk scores derived from asymmetry | Not hardcoded 78/45/15 |
| T11 | Phone field | Shows `mobile_number` not `phone` |

#### Patient Detail — Thermal (T12–T16)
| # | Test | Expected |
|---|---|---|
| T12 | Thermal heatmap images render | GCS URLs loaded as `<img>`, not placeholder |
| T13 | Clinical points overlay on image | 9 dots with correct zones from DB |
| T14 | Zone comparison table | Uses `zone_asymmetry` data, not `sensor_readings` |
| T15 | Risk score in chart | Derived from `max_asymmetry_celsius`, not hardcoded |
| T16 | "Hotspot: detected" text | Derived from zones with asymmetry > 2°C |

#### Patient Detail — Notes (T17–T19)
| # | Test | Expected |
|---|---|---|
| T17 | Add remark → persists | Insert to `remarks`, shows after refresh |
| T18 | Add instruction → persists | Insert to `instructions`, shows after refresh |
| T19 | Clinician name on remark | Fetched via JOIN, not mock |

#### Alerts (T20–T21)
| # | Test | Expected |
|---|---|---|
| T20 | Alert list | 3 alerts with patient names from `alert_with_patient_name` view |
| T21 | Acknowledge alert | Updates `acknowledged=true` in DB |

#### Admin (T22–T23)
| # | Test | Expected |
|---|---|---|
| T22 | Admin dashboard stats | 2 clinicians, 5 patients, 3 applications from DB |
| T23 | Application list | Real data: Alice Wong, Ben Patel, Clara Hughes |

#### Build & Cleanup (T24–T25)
| # | Test | Expected |
|---|---|---|
| T24 | `npm run build` | Zero errors |
| T25 | `grep -r "mockData" src/` | Zero results — no mock imports remaining |

---

## Open Questions

> [!IMPORTANT]
> **Thermal image sizing**: The `detected_9pts_url` image is a composite of both feet. The current `ThermalFoot` component renders left and right separately in `240x600px` containers. We need to verify if the GCS images are per-foot or combined. If combined, we may need a single image with clinical points overlaid, rather than two separate `ThermalFoot` components.

> [!NOTE]
> **Risk score computation**: The DB `analysis` JSONB has `max_asymmetry_celsius` but no explicit `risk_score`. The mapper derives it as `min(100, round(maxAsym / 10 * 100))`. This means 7.39°C → score 74, which is reasonable. Confirm this formula is acceptable.
