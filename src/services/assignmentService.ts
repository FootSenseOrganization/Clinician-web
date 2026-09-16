import * as assignmentRequestModel from "@/models/assignmentRequestModel";
import type { AssignmentRequest } from "@/types";

export async function getPendingRequests(): Promise<AssignmentRequest[]> {
  return assignmentRequestModel.findAll();
}

export async function getClinicianRequests(clinicianId: string): Promise<AssignmentRequest[]> {
  return assignmentRequestModel.findByClinicianId(clinicianId);
}

export async function acceptRequest(id: string): Promise<void> {
  return assignmentRequestModel.updateStatus(id, "accepted");
}

export async function declineRequest(id: string): Promise<void> {
  return assignmentRequestModel.updateStatus(id, "declined");
}
