/*** Add File: pages/api/contacts/[id]/enrich.ts
   Suggests missing fields for a contact by inspecting available data. This
   endpoint returns suggestions for company, jobTitle, or other enrichable
   fields based on heuristics. Authentication is required.

***/
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../../lib/mongodb';
import Contact from '../../../../models/Contact';
import { requireAuth } from '../../../../src/middleware/requireAuth';

export default requireAuth(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connect();
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Contact id is required' });
  }
  const contact: any = await Contact.findById(id).lean();
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  const suggestions: { field: string; value: any; reason: string }[] = [];
  // Suggest company based on email domain
  if (!contact.company && contact.email) {
    const domain = contact.email.split('@')[1] as string;
    if (domain) {
      const company = domain.split('.')[0];
      suggestions.push({ field: 'company', value: company, reason: 'Inferred from email domain' });
    }
  }
  // Suggest a default job title if missing
  if (!contact.jobTitle) {
    suggestions.push({ field: 'jobTitle', value: 'Engineer', reason: 'Default job title suggestion' });
  }
  return res.status(200).json({ contactId: id, suggestions });
}, ['user', 'admin']);



/* pages/api/contacts/[id]/enrich.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../../lib/mongodb';
import Contact from '../../../../models/Contact';

export type EnrichmentSuggestion = {
  field: string;
  value: string;
  source: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EnrichmentSuggestion[]>
) {
  await connect();
  const { id } = req.query;
  const c = await Contact.findById(id as string);
  if (!c) return res.status(404).end();

  // Mocked suggestions
  const firstName = c.name.split(' ')[0].toLowerCase();
  const suggestions: EnrichmentSuggestion[] = [
    { field: 'email', value: `${firstName}@company.com`, source: 'EnrichAI' },
    { field: 'company', value: 'Acme Corp',           source: 'EnrichAI' }
  ];

  res.status(200).json(suggestions);
}
*/
