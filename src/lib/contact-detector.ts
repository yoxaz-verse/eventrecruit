/**
 * Contact detail auto-detector for platform safety & compliance.
 * Blocks phone numbers, email addresses, and obfuscated contact info in public text fields.
 */

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i;
const OBFUSCATED_EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+\s*(?:\[\s*at\s*\]|\(\s*at\s*\)|\s+at\s+)\s*[A-Za-z0-9.-]+\s*(?:\[\s*dot\s*\]|\(\s*dot\s*\)|\s+dot\s+|\.)\s*[A-Za-z]{2,}\b/i;

// Match Indian (+91) or standard 10-digit mobile numbers with optional spaces, dashes, dots, or parens
const PHONE_PATTERN = /(?:\+?91[\s.-]?)?[6-9]\d{4}[\s.-]?\d{5}\b/;
// Words for numbers e.g. "nine eight seven six five four three two one zero"
const NUMBER_WORDS_REGEX = /(?:zero|one|two|three|four|five|six|seven|eight|nine)[\s\-_,.]+(?:zero|one|two|three|four|five|six|seven|eight|nine)[\s\-_,.]+(?:zero|one|two|three|four|five|six|seven|eight|nine)/i;

/**
 * Check string for hidden or explicit contact details.
 */
export function containsContactDetails(text: string): { hasContact: boolean; reason?: string; match?: string } {
  if (!text || typeof text !== "string") {
    return { hasContact: false };
  }

  // 1. Direct Email Check
  const emailMatch = text.match(EMAIL_REGEX);
  if (emailMatch) {
    return {
      hasContact: true,
      reason: "Email addresses are not allowed in description fields.",
      match: emailMatch[0],
    };
  }

  // 2. Obfuscated Email Check (e.g. name at domain dot com)
  const obfuscatedEmailMatch = text.match(OBFUSCATED_EMAIL_REGEX);
  if (obfuscatedEmailMatch) {
    return {
      hasContact: true,
      reason: "Obfuscated email addresses are not allowed in description fields.",
      match: obfuscatedEmailMatch[0],
    };
  }

  // 3. Direct Phone Number Check
  const phoneMatch = text.match(PHONE_PATTERN);
  if (phoneMatch) {
    return {
      hasContact: true,
      reason: "Phone numbers are not allowed in description fields.",
      match: phoneMatch[0],
    };
  }

  // 4. Strip non-digits and check for contiguous 10-digit sequences (ignoring spaced numbers e.g. 9 8 7 6 5 4 3 2 1 0)
  const digitsOnly = text.replace(/\D/g, "");
  // Check if string contains a sequence of 10-12 digits that looks like an Indian phone number
  if (/^[6-9]\d{9}$/.test(digitsOnly) || /(?:^|[^0-9])[6-9]\d{9}(?:[^0-9]|$)/.test(digitsOnly)) {
    return {
      hasContact: true,
      reason: "Phone numbers (10 digits) are not allowed in description fields.",
    };
  }

  // 5. Contact keywords followed by digits e.g., "call 98765", "whatsapp 987", "ph: 987"
  const keywordMatch = text.match(/(?:call|whatsapp|phone|mobile|contact|reach me|ping|wa|ph)[\s:=#-]*[0-9\s.-]{7,}/i);
  if (keywordMatch) {
    return {
      hasContact: true,
      reason: "Direct contact requests with numbers are not allowed in description fields.",
      match: keywordMatch[0],
    };
  }

  // 6. Number Words Check
  if (NUMBER_WORDS_REGEX.test(text)) {
    return {
      hasContact: true,
      reason: "Spelled-out contact numbers are not allowed in description fields.",
    };
  }

  return { hasContact: false };
}
