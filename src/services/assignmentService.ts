import * as assignmentRequestModel from "@/models/assignmentRequestModel";
import type { AssignmentRequest } from "@/types";

export function getPendingRequests(): AssignmentRequest[] {
  return assignmentRequestModel.findAll();
}
