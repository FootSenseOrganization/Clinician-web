# Phase 2: Rewire to Supabase — Task Tracker

## Layer 0: Infrastructure
- [x] Install `@tanstack/react-query`
- [x] Wrap app in `QueryClientProvider` (`main.tsx`)
- [x] Set admin email in DB

## Layer 1: Types
- [x] Rewrite `src/types/index.ts` — match new JSONB schema

## Layer 2: Models (8 files)
- [x] `measurementModel.ts` — async Supabase + JSONB mapper
- [x] `patientModel.ts` — async Supabase
- [x] `clinicianModel.ts` — async Supabase
- [x] `alertModel.ts` — async Supabase
- [x] `applicationModel.ts` — async Supabase
- [x] `assignmentRequestModel.ts` — async Supabase
- [x] `remarkModel.ts` — async Supabase with JOIN
- [x] `instructionModel.ts` — async Supabase with JOIN

## Layer 3: Services (9 files)
- [x] `measurementService.ts` — async + sync helpers
- [x] `patientService.ts` — async + risk distribution
- [x] `alertService.ts` — async
- [x] `assignmentService.ts` — async with accept/decline
- [x] `remarkService.ts` — async CRUD
- [x] `instructionService.ts` — async CRUD
- [x] `profileService.ts` — async by ID/email
- [x] `authService.ts` — async Supabase lookups
- [x] `adminService.ts` — async with parallel fetching

## Layer 4: Controllers (7 files)
- [x] `patientController.ts` — async + CRUD
- [x] `alertController.ts` — async + acknowledge
- [x] `assignmentController.ts` — async + accept/decline
- [x] `profileController.ts` — async by ID
- [x] `authController.ts` — async email-based lookup
- [x] `adminController.ts` — async + parallel fetching
- [x] `registrationController.ts` — sync validation (no changes needed)

## Layer 5: Auth + Login
- [x] `AuthContext.tsx` — email-based login via Supabase
- [x] `LoginPage.tsx` — email-only sign in
- [x] `AdminLoginPage.tsx` — email-only admin sign in

## Layer 6: UI Components + Pages
- [x] `ClinicianLayout.tsx` — useAuth + useQuery
- [x] `AdminLayout.tsx` — useQuery for stats
- [x] `ThermalFoot.tsx` → `ThermalView` — combined GCS image
- [x] `PatientDetailPage.tsx` — full rewrite with useQuery/useMutation
- [x] `ClinicianDashboardPage.tsx` — useQuery, no mockClinician
- [x] `PatientListPage.tsx` — useQuery
- [x] `AlertsCentrePage.tsx` — useQuery + useMutation
- [x] `AssignmentsPage.tsx` — useQuery + useMutation
- [x] `ProfilePage.tsx` — useAuth for profile data
- [x] `AdminDashboardPage.tsx` — useQuery
- [x] `AdminApplicationsPage.tsx` — useQuery + useMutation
- [x] `AdminCliniciansPage.tsx` — useQuery
- [x] `RegisterStatusPage.tsx` — async lookup fix

## Layer 7: Cleanup
- [x] Delete `src/mock/mockData.ts`
- [x] Fix `supabaseClient.ts` bracket env access
- [x] Fix TS4111 in `measurementModel.ts`

## Verification
- [x] `npx tsc --noEmit` — 0 errors
- [x] `npx vite build` — success (11.37s)

## Remaining
- [x] Testing directory setup (Handed over to next chat)
- [x] End-to-end manual verification in browser (Handed over to next chat)
