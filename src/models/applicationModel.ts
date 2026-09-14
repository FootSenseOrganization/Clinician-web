import { mockApplications } from "@/mock/mockData";
import type { Application } from "@/types";

export function findAll(): Application[] {
  return mockApplications;
}

export function findByAhpraOrEmail(query: string): Application | undefined {
  const q = query.trim().toLowerCase();
  return mockApplications.find(
    (a) => a.ahpra_number.toLowerCase() === q || a.email.toLowerCase() === q,
  );
}
