export interface PIIDetectionResult {
  hasPII: boolean;
  types: string[];
  count: number;
}

// Patterns for common PII types
const PII_PATTERNS: { type: string; pattern: RegExp }[] = [
  {
    type: "EMAIL",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  },
  {
    type: "PHONE",
    // Matches: (123) 456-7890, 123-456-7890, +91-9876543210, etc.
    pattern: /(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4}\b/g,
  },
  {
    type: "SSN",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  {
    type: "CREDIT_CARD",
    pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  },
  {
    type: "LOCATION_COORDS",
    // Latitude/longitude patterns
    pattern: /\b-?\d{1,3}\.\d+,\s*-?\d{1,3}\.\d+\b/g,
  },
  {
    type: "URL",
    pattern: /https?:\/\/[^\s/$.?#].[^\s]*/gi,
  },
  {
    type: "IP_ADDRESS",
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  },
];

// Common name prefixes to help detect names
const NAME_PREFIXES = [
  "mr", "mrs", "ms", "dr", "prof", "sir", "mx",
  "my name is", "i am", "i'm", "call me", "named",
];

const NAME_PREFIX_PATTERN = new RegExp(
  `(?:${NAME_PREFIXES.join("|")})\\.?\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)`,
  "gi"
);

/**
 * Scan text for PII. Returns types found and whether PII is present.
 */
export function detectPII(text: string): PIIDetectionResult {
  const typesFound = new Set<string>();

  for (const { type, pattern } of PII_PATTERNS) {
    pattern.lastIndex = 0; // Reset stateful regex
    if (pattern.test(text)) {
      typesFound.add(type);
    }
  }

  // Check for likely name mentions
  NAME_PREFIX_PATTERN.lastIndex = 0;
  if (NAME_PREFIX_PATTERN.test(text)) {
    typesFound.add("NAME");
  }

  return {
    hasPII: typesFound.size > 0,
    types: Array.from(typesFound),
    count: typesFound.size,
  };
}

/**
 * Validate journal text is safe to process.
 * Returns true if text passes basic sanity checks.
 */
export function validateJournalText(text: string): { valid: boolean; reason?: string } {
  if (!text || typeof text !== "string") {
    return { valid: false, reason: "Text must be a non-empty string" };
  }
  if (text.trim().length < 10) {
    return { valid: false, reason: "Journal entry too short (minimum 10 characters)" };
  }
  if (text.length > 10000) {
    return { valid: false, reason: "Journal entry too long (maximum 10,000 characters)" };
  }
  return { valid: true };
}
