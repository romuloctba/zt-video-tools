/**
 * Generates a unique ID using crypto API
 */
export function generateId(): string {
  return crypto.randomUUID();
}
