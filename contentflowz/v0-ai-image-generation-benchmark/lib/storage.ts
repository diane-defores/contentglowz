import type { TestResult } from "./types"

export function loadHistory(): TestResult[] {
  return []
}

export function saveHistory(_history: TestResult[]): void {
  // No-op: history only in memory
}

export function clearHistory(): void {
  // No-op: history only in memory
}
