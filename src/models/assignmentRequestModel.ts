import { mockAssignmentRequests } from "@/mock/mockData";
import type { AssignmentRequest } from "@/types";

export function findAll(): AssignmentRequest[] {
  return mockAssignmentRequests;
}
