/**
 * A simple in-memory list of spam phone numbers used for
 * trust scoring penalties. In a production environment
 * this list could be populated from external spam feeds (e.g.
 * Truecaller spam database, FTC scam number lists) or via a
 * regularly updated internal service.
 *
 * The numbers in this Set should contain only digits (no spaces or punctuation).
 */
export const spamNumbers: Set<string> = new Set([
  // Example spam numbers. Replace or extend with real data sources.
  '8001234567',
  '8885550000',
  '1234567890',
]);
