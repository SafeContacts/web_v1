/**  File: lib/duplicate.ts  */
// Helpers for detecting and merging duplicate contacts. A duplicate group
// contains two or more contacts with the same phone number or email
// address, normalized for case and punctuation.

import { Contact }           from '../models/Contact';
import { compareTwoStrings } from './similarity';

export interface DuplicateGroup {
  contacts: string[];
}

/**
 * Find duplicate contacts by grouping on normalized phone numbers and
 * lowercase emails. Returns an array of groups of contact IDs. Groups
 * with only one contact are filtered out.
 */
export async function findDuplicateGroups(): Promise<DuplicateGroup[]> {
  const contacts = await Contact.find().lean();
  const phoneMap: Record<string, string[]> = {};
  const emailMap: Record<string, string[]> = {};
  contacts.forEach((c: any) => {
    const phone = (c.phone || '').replace(/\D/g, '');
    if (phone) {
      phoneMap[phone] = phoneMap[phone] || [];
      phoneMap[phone].push(c._id.toString());
    }
    const email = (c.email || '').toLowerCase();
    if (email) {
      emailMap[email] = emailMap[email] || [];
      emailMap[email].push(c._id.toString());
    }
  });
  const groups: DuplicateGroup[] = [];
  // Add groups for phone duplicates
  Object.values(phoneMap).forEach((ids) => {
    const uniq = Array.from(new Set(ids));
    if (uniq.length > 1) groups.push({ contacts: uniq });
  });
  // Add groups for email duplicates
  Object.values(emailMap).forEach((ids) => {
    const uniq = Array.from(new Set(ids));
    if (uniq.length > 1) groups.push({ contacts: uniq });
  });
  return groups;
}

/**
 * Merge contacts in a duplicate group. Keeps the contact with the highest
 * confidenceScore and merges non-empty fields from the others. The merged
 * contact is saved and all other contacts in the group are deleted.
 * Returns the merged contact or undefined if nothing to merge.
 */
export async function mergeDuplicateGroup(group: string[]): Promise<any> {
  if (!Array.isArray(group) || group.length < 2) return;
  const contacts = await Contact.find({ _id: { $in: group } });
  if (contacts.length < 2) return;
  // Sort by confidenceScore descending; pick first as master
  contacts.sort((a: any, b: any) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0));
  const master: any = contacts[0];
  const others = contacts.slice(1);
  // Merge missing fields from others onto master
  others.forEach((c: any) => {
    // Copy over string fields if master is missing
    ['email', 'company', 'address', 'jobTitle', 'birthday'].forEach((field) => {
      if (!master[field] && c[field]) {
        master[field] = c[field];
      }
    });
    // Merge tags
    if (Array.isArray(c.tags)) {
      master.tags = Array.from(new Set([...(master.tags || []), ...c.tags]));
    }
  });
  await master.save();
  // Remove duplicate contacts
  const toDelete = others.map((c: any) => c._id);
  await Contact.deleteMany({ _id: { $in: toDelete } });
  return master;
}

