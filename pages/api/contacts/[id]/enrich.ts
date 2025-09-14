// pages/api/contacts/[id]/enrich.ts
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

