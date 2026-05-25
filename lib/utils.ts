import { type ClassValue, clsx } from "clsx";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]): string {
  // Minimal implementation without twMerge to keep deps light for Phase 1
  return clsx(inputs);
}

/** Sleep helper for mock delays */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Generate a random ID (not crypto-safe, fine for mock data) */
export function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}
