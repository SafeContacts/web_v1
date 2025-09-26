// =============================================
// File: pages/business.tsx — AI Prototype: Business Search (v0)
// =============================================
import React from "react";
import { Box, Input, VStack, Heading, Text, Button } from "@chakra-ui/react";
import data from "../public/businesses.json"; // ship a small curated JSON
import { buildWhatsAppChatUrl } from "../lib/deeplinks";
import { toE164 } from "../lib/phone";


const score = (q: string, name: string) => {
q = q.toLowerCase();
name = name.toLowerCase();
if (name.includes(q)) return q.length / name.length + 0.5; // contain boost
// Jaro-Winkler-lite: prefix match boost
let prefix = 0;
for (let i = 0; i < Math.min(q.length, name.length); i++) {
if (q[i] === name[i]) prefix++;
else break;
}
return prefix / q.length;
};


export default function BusinessSearchPage() {
const [q, setQ] = React.useState("");
const results = React.useMemo(() => {
if (!q) return [] as any[];
const items = (data as any[]).map((b) => ({ ...b, _s: score(q, b.name) }));
return items.filter((b) => b._s > 0).sort((a, b) => b._s - a._s).slice(0, 5);
}, [q]);


return (
<Box p={6}>
<Heading size="md" mb={4}>Business Search</Heading>
<Input placeholder="Search businesses (e.g., 'Pizza Hut', 'pharmacy')" value={q} onChange={(e) => setQ(e.target.value)} />
<VStack align="stretch" mt={4} spacing={3}>
{results.map((b) => {
const e164 = toE164(b.phone);
const waUrl = buildWhatsAppChatUrl(e164, `Hi ${b.name}, I\'d like to inquire.`);
return (
<Box key={b.id} p={3} borderWidth="1px" borderRadius="lg">
<Text fontWeight="semibold">{b.name}</Text>
<Text fontSize="sm" color="gray.500">{b.category} • {b.location}</Text>
<Box mt={2} display="flex" gap={8}>
<Button as="a" href={`tel:${e164}`} size="sm">Call</Button>
<Button as="a" href={waUrl} target="_blank" rel="noreferrer" size="sm">
WhatsApp
</Button>
</Box>
</Box>
);
})}
</VStack>
</Box>
);
}
