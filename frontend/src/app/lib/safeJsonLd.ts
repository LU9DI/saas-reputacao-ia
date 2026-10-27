/**
 * Serialize JSON-LD safely for embedding in an HTML script element.
 * Escaping "<" prevents attacker-controlled text from terminating the script tag.
 */
export function serializeJsonLd(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) return "null";
  return serialized.replace(/</g, "\\u003c");
}
