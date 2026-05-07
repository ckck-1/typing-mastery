/**
 * mock/utils/id.ts — tiny deterministic nanoid-style generator for mock rows.
 * Not cryptographically secure — fine for a mock backend.
 */

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateId(prefix = "id", length = 12): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return `${prefix}_${result}`;
}