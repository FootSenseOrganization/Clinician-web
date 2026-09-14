import * as assignmentService from "@/services/assignmentService";

export function getPendingAssignments() {
  return assignmentService.getPendingRequests();
}
