// =============================================
// File: lib/phone.ts
// =============================================
// NOTE: For production, prefer libphonenumber-js. This is a light normalizer.
export function toE164(input: string, defaultCountryCode = "91") {
if (!input) return "";
const digits = input.replace(/\D/g, "");
if (input.trim().startsWith("+")) return `+${digits}`;
// Heuristic: if 10 digits, assume Indian local and prefix +91 (configurable)
if (digits.length === 10) return `+${defaultCountryCode}${digits}`;
// If already includes country code without +
if (digits.length > 10) return `+${digits}`;
return `+${defaultCountryCode}${digits}`;
}
