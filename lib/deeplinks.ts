// =============================================
// File: lib/deeplinks.ts
// =============================================
export const encode = (s: string) => encodeURIComponent(s ?? "");


export function buildWhatsAppChatUrl(e164: string, text?: string) {
const number = e164.replace(/\D/g, "");
const base = `https://wa.me/${number}`;
return text ? `${base}?text=${encode(text)}` : base;
}


export function buildWhatsAppCallUrl(e164: string) {
const number = e164.replace(/\D/g, "");
return `whatsapp://call?number=${number}`;
}


// Generic helpers (kept minimal for now)
export function buildSmsUrl(e164: string, body?: string) {
const number = e164.replace(/\D/g, "");
return body ? `sms:+${number}?body=${encode(body)}` : `sms:+${number}`;
}
