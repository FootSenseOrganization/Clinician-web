import * as assignmentService from "@/services/assignmentService";
import type { AssignmentRequest } from "@/types";

export async function getPendingAssignments(): Promise<AssignmentRequest[]> {
  return assignmentService.getPendingRequests();
}

export async function getClinicianAssignments(clinicianId: string): Promise<AssignmentRequest[]> {
  return assignmentService.getClinicianRequests(clinicianId);
}

export async function acceptAssignment(id: string): Promise<void> {
  return assignmentService.acceptRequest(id);
}

export async function declineAssignment(id: string): Promise<void> {
  return assignmentService.declineRequest(id);
}
