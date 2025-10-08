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
  // Build maps for normalized phones and emails.  Each contact may have multiple
  // phone numbers or email addresses.  We normalize each phone by removing
  // non-digit characters and each email by lowercasing.  We then map each
  // normalized value to a list of contact IDs.
  contacts.forEach((c: any) => {
    (c.phones || []).forEach((p: any) => {
      const normPhone = (p?.value || '').replace(/\D/g, '');
      if (normPhone) {
        phoneMap[normPhone] = phoneMap[normPhone] || [];
        phoneMap[normPhone].push(c._id.toString());
      }
    });
    (c.emails || []).forEach((e: any) => {
      const normEmail = (e?.value || '').toLowerCase();
      if (normEmail) {
        emailMap[normEmail] = emailMap[normEmail] || [];
        emailMap[normEmail].push(c._id.toString());
      }
    });
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
  // Determine the master contact by highest trustScore (fallback to 0)
  contacts.sort((a: any, b: any) => (b.trustScore ?? 0) - (a.trustScore ?? 0));
  const master: any = contacts[0];
  const others = contacts.slice(1);
  // Merge missing fields and arrays from others onto master
  others.forEach((c: any) => {
    // Merge array fields (phones, emails, addresses).  Ensure unique values
    ['phones', 'emails', 'addresses'].forEach((arrField) => {
      const masterArr = Array.isArray(master[arrField]) ? master[arrField] : [];
      const otherArr = Array.isArray(c[arrField]) ? c[arrField] : [];
      otherArr.forEach((item: any) => {
        if (!masterArr.some((m: any) => m.value === item.value)) {
          masterArr.push(item);
        }
      });
      master[arrField] = masterArr;
    });
    // Merge simple string fields
    ['notes', 'linkedIn', 'twitter', 'instagram'].forEach((field) => {
      if (!master[field] && c[field]) {
        master[field] = c[field];
      }
    });
  });
  await master.save();
  // Remove duplicate contacts
  const toDelete = others.map((c: any) => c._id);
  await Contact.deleteMany({ _id: { $in: toDelete } });
  return master;
}
