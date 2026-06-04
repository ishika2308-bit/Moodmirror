import * as crypto from "crypto";

export interface TokenMap {
  [token: string]: string; // token → original value
}

export interface TokenizationResult {
  tokenizedText: string;
  tokenMap: TokenMap;
  tokenCount: number;
}

// Replacement patterns (order matters — more specific first)
const TOKENIZATION_RULES: { type: string; pattern: RegExp }[] = [
  {
    type: "EMAIL",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  },
  {
    type: "PHONE",
    pattern: /(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4}\b/g,
  },
  {
    type: "SSN",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  {
    type: "URL",
    pattern: /https?:\/\/[^\s/$.?#].[^\s]*/gi,
  },
  {
    type: "IP",
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  },
  {
    type: "NAME",
    pattern: /(?:(?:mr|mrs|ms|dr|prof|mx)\.?\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
  },
];

// Location keywords to generalize
const LOCATION_KEYWORDS: RegExp = /\b(at|in|near|from|to)\s+([A-Z][a-zA-Z\s]{2,20}(?:Street|St|Ave|Avenue|Road|Rd|Drive|Dr|Lane|Ln|Blvd|Boulevard|College|University|School|Hospital|Mall|Park|Airport))\b/g;

/**
 * Generate a short deterministic token ID for a PII value.
 * NOT used for security — used only for consistent replacement within one text.
 */
function makeToken(type: string, value: string, secret: string): string {
  const hash = crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
  return `[${type}_${hash}]`;
}

/**
 * Replace PII in text with opaque tokens.
 * Returns tokenized text and a map for potential de-tokenization.
 *
 * IMPORTANT: The tokenMap contains real PII — store it encrypted or discard it.
 */
export function tokenize(text: string): TokenizationResult {
  const secret = process.env.TOKENIZER_SECRET ?? "default-insecure-secret";
  const tokenMap: TokenMap = {};
  let tokenizedText = text;

  for (const { type, pattern } of TOKENIZATION_RULES) {
    pattern.lastIndex = 0;
    tokenizedText = tokenizedText.replace(pattern, (match) => {
      const token = makeToken(type, match, secret);
      tokenMap[token] = match;
      return token;
    });
  }

  // Tokenize locations
  LOCATION_KEYWORDS.lastIndex = 0;
  tokenizedText = tokenizedText.replace(LOCATION_KEYWORDS, (match, prep, place) => {
    const token = makeToken("LOCATION", place, secret);
    tokenMap[token] = place;
    return `${prep} ${token}`;
  });

  return {
    tokenizedText,
    tokenMap,
    tokenCount: Object.keys(tokenMap).length,
  };
}

/**
 * Restore original values from tokens.
 * Only use server-side when displaying to the authenticated owner.
 */
export function detokenize(tokenizedText: string, tokenMap: TokenMap): string {
  let result = tokenizedText;
  for (const [token, original] of Object.entries(tokenMap)) {
    result = result.split(token).join(original);
  }
  return result;
}
