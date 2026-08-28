import type { Condition } from '../types';

export async function loadConditions(): Promise<Condition[]> {
  try {
    const res = await fetch('/api/admin/conditions');
    const json = await res.json();
    return json.conditions ?? [];
  } catch {
    return [];
  }
}
