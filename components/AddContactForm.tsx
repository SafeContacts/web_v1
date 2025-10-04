/*** File: safecontacts/components/AddContactForm.tsx */
import React, { useState } from 'react';

interface Props {
  /**
   * Called when a new contact is successfully created.  The parent can
   * refresh its contact list by pushing the new contact into state.
   */
  onCreated?: (contact: any) => void;
  /** Optional userId to include in the POST body.  If omitted the server
   * will attempt to derive the user from the Authorization header.
   */
  userId?: string;
}

/**
 * A simple form for creating a new contact.  Collects a name, phone number,
 * and optional email and notes.  On submit, sends a POST to `/api/contacts`.
 */
export default function AddContactForm({ onCreated, userId }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<string>('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name || !phone) {
      setStatus('Name and phone are required');
      return;
    }
    setStatus('');
    const payload: any = {
      name,
      phones: [{ label: 'mobile', value: phone }],
      emails: email ? [{ label: 'work', value: email }] : [],
      addresses: [],
      notes,
    };
    if (userId) payload.userId = userId;
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const contact = await res.json();
        setName('');
        setPhone('');
        setEmail('');
        setNotes('');
        setStatus('Contact created');
        if (onCreated) onCreated(contact);
      } else {
        const data = await res.json();
        setStatus(data.error || 'Failed to create contact');
      }
    } catch (err) {
      console.error(err);
      setStatus('Failed to create contact');
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
      <h3>Add Contact</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: '0.5rem' }}
        />
        <input
          type="tel"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ padding: '0.5rem' }}
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '0.5rem' }}
        />
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ padding: '0.5rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px' }}>
          Create Contact
        </button>
        {status && <p style={{ color: status.includes('created') ? 'green' : 'red' }}>{status}</p>}
      </div>
    </form>
  );
}

