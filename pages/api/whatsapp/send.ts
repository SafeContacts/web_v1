// =============================================
// File: pages/api/whatsapp/send.ts
// =============================================
import type { NextApiRequest, NextApiResponse } from "next";


/**
* Minimal WhatsApp Cloud API proxy.
* Requires env: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID
*/
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
const { to, type, text, template } = req.body as {
to: string; // e.g. +9198...
type: "text" | "template";
text?: string;
template?: { name: string; language: string; components?: any[] };
};
const token = process.env.WHATSAPP_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
if (!token || !phoneNumberId) return res.status(500).json({ error: "Missing WA env" });


const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
const payload =
type === "template"
? {
messaging_product: "whatsapp",
to: to.replace(/\D/g, ""),
type: "template",
template: template,
}
: {
messaging_product: "whatsapp",
to: to.replace(/\D/g, ""),
type: "text",
text: { body: text || "" },
};


try {
const r = await fetch(url, {
method: "POST",
headers: {
Authorization: `Bearer ${token}`,
"Content-Type": "application/json",
},
body: JSON.stringify(payload),
});
const data = await r.json();
if (!r.ok) return res.status(r.status).json(data);
return res.status(200).json(data);
} catch (e: any) {
return res.status(500).json({ error: e?.message || "Unknown error" });
}
}
