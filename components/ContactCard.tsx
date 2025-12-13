
/*** Add File: components/ContactCard.tsx 
import React from 'react';
import { Box, Text, Badge, HStack, VStack } from '@chakra-ui/react';
import CallButton from './CallButton';
import SmsButton from './SmsButton';
import { WhatsAppButton } from './WhatsAppButton';

export interface Contact {
  _id?: string;
  id?: string;
  name: string;
  phone?: string;
  phones?: { value: string }[];
  email?: string;
  emails?: { value: string }[];
  company?: string;
  confidenceScore?: number;
  linkedIn?: string;
  twitter?: string;
  instagram?: string;
}

export interface ContactCardProps {
  contact: Contact;
  userId?: string;
}

export default function ContactCard({ contact, userId }: ContactCardProps) {
  const primaryPhone = contact.phone || contact.phones?.[0]?.value || '';
  const primaryEmail = contact.email || contact.emails?.[0]?.value || '';
  const score = contact.confidenceScore ?? 0;

  return (
    <Box p={4} borderWidth="1px" borderRadius="md" w="100%" _hover={{ shadow: 'md' }}>
      <Text fontWeight="bold" fontSize="lg">{contact.name}</Text>
      <VStack align="start" spacing={1} mb={2}>
        {primaryPhone && (
          <HStack spacing={2}>
            <Text fontSize="sm">{primaryPhone}</Text>
            <CallButton contactId={contact._id} phone={primaryPhone} userId={userId} />
            <SmsButton contactId={contact._id} phone={primaryPhone} userId={userId} />
            <WhatsAppButton phoneNumber={primaryPhone} enableCloudApi={!!process.env.NEXT_PUBLIC_WABA_ENABLED} />
          </HStack>
        )}
        {primaryEmail && <Text fontSize="sm">{primaryEmail}</Text>}
        {contact.company && <Text fontSize="sm">{contact.company}</Text>}
      </VStack>
      <Badge colorScheme={score > 50 ? 'green' : score > 20 ? 'yellow' : 'red'}>
        {score}%
      </Badge>
    </Box>
  );
}*/

import Link from "next/link";
export interface ContactCardProps {
  contact: any;
}
export default function ContactCard({ contact }: ContactCardProps) {
  const primaryPhone = contact?.phones?.[0]?.value || contact?.phones?.[0];
  const primaryEmail = contact?.emails?.[0]?.value || contact?.emails?.[0];
  const trustScore = contact?.trustScore ?? 0;
  const tags = contact?.tags || [];
  const updatedAt = contact?.updatedAt ? new Date(contact.updatedAt) : null;
  let updatedLabel = "";
  if (updatedAt) {
    const now = new Date();
    const diff = now.getTime() - updatedAt.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
      updatedLabel = "today";
    } else if (days === 1) {
      updatedLabel = "yesterday";
    } else {
      updatedLabel = `${days} days ago`;
    }
  }
  return (
    <Link href={`/contact/${contact._id}`} passHref>
      <a className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow" aria-label={`View details for ${contact.name}`}>
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-800 truncate">
              {contact.name}
            </div>
            <div className="text-sm text-gray-600 truncate">
              {primaryPhone}
            </div>
            <div className="text-sm text-gray-600 truncate">
              {primaryEmail}
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end space-y-1">
            {contact.company && (
              <span className="text-sm text-gray-600 truncate">
                {contact.company}
              </span>
            )}
            <div className="flex flex-wrap gap-1">
              {tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end w-24">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${trustScore >= 80 ? "bg-green-500" : trustScore >= 50 ? "bg-yellow-400" : "bg-red-500"}`}
                style={{ width: `${trustScore}%` }}
              />
            </div>
            <span className="text-xs text-gray-700 mt-1">{trustScore}%</span>
          </div>
          <div className="hidden md:block text-sm text-gray-500 w-24 text-right">
            {updatedLabel}
          </div>
        </div>
      </a>
    </Link>
  );
}

