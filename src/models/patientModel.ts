import { mockPatients } from "@/mock/mockData";
import type { Patient } from "@/types";

export function findAll(): Patient[] {
  return mockPatients;
}

export function findById(id: string): Patient | undefined {
  return mockPatients.find((p) => p.id === id);
}
