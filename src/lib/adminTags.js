// Keep the first spelling/order while accepting comma-separated text or string arrays.
export function parseTags(input, existing = []) {
  const result = [], seen = new Set();
  const entries = [...(Array.isArray(existing) ? existing : []), ...(Array.isArray(input) ? input : [input])];
  for (const entry of entries) {
    if (typeof entry !== "string") continue;
    for (const part of entry.split(",")) {
      const tag = part.trim(), key = tag.toLowerCase();
      if (!tag || seen.has(key)) continue;
      seen.add(key); result.push(tag);
    }
  }
  return result;
}
