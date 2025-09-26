import React, { useState, useEffect } from 'react';
import { Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, Spinner } from '@chakra-ui/react';

interface DialerProps {
  /**
   * List of contacts to match against. Each contact should contain an _id and at
   * least one phone number. When a call is placed we will log the call
   * against the matching contact (if any).
   */
  contacts?: { _id: string; name: string; phones: { value: string }[] }[];
  /**
   * The current user's id. Required for logging outgoing calls via the
   * /api/calllog endpoint. If not provided, calls will not be logged.
   */
  userId?: string;
}

export default function Dialer({ contacts = [], userId }: DialerProps) {
  const [number, setNumber] = useState('');

  // Append a digit to the dialed number
  function addDigit(digit: string) {
    setNumber((prev) => prev + digit);
  }

  // Remove the last digit from the dialed number
  function deleteDigit() {
    setNumber((prev) => prev.slice(0, -1));
  }

  // Attempt to find a contact whose phone number matches the current dialed
  // digits. We remove non-digits before comparing to make matching more
  // forgiving.
  const normalized = number.replace(/\D/g, '');
  const results = contacts.filter((c) =>
    c.phones.some((p) => p.value.replace(/\D/g, '').includes(normalized))
  );

  // Log an outgoing call via the /api/calllog endpoint. If a matching contact
  // exists we'll include the contactId on the payload. A missing userId will
  // skip logging entirely.
  async function logCall() {
    if (!userId || !normalized) return;
    try {
      const matching = results[0];
      const payload: any = {
        userId,
        phoneNumber: normalized,
        type: 'outgoing',
      };
      if (matching?._id) {
        payload.contactId = matching._id;
      }
      await fetch('/api/calllog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('Failed to log call', err);
    }
  }

  // When the call button is clicked, log the call (if possible) then trigger the
  // tel: link to start the call. We use an anchor so that mobile devices will
  // immediately open the dialer.

  async function handleCallClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // Prevent default navigation until we log the call
    e.preventDefault();
    if (!normalized) return;
    try {
      // Log the call if a userId is provided
      if (userId) {
        await logCall();
      }
    } catch (err) {
      console.error('Failed to log call', err);
    } finally {
      // Navigate to the tel: link regardless of logging outcome
      window.location.href = `tel:${normalized}`;
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <input type="tel" value={number} readOnly style={{ width: '100%', padding: '0.5rem', fontSize: '1.5rem', textAlign: 'center', marginBottom: '1rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        {[...Array(9)].map((_, idx) => (
          <button key={idx + 1} onClick={() => addDigit((idx  1).toString())}
            style={{ padding: '1rem', fontSize: '1.5rem' }}>
            {idx + 1}
          </button>
        ))}
        <button onClick={deleteDigit} style={{ padding: '1rem', fontSize: '1.5rem' }}>⌫</button>
        <button onClick={() => addDigit('0')} style={{ padding: '1rem', fontSize: '1.5rem' }}>0</button>
        <a
          href={normalized ? `tel:${normalized}` : '#'}
          onClick={handleCallClick}
          style={{
            display: 'inline-block',
            padding: '1rem',
            fontSize: '1.5rem',
            textAlign: 'center',
            backgroundColor: '#4caf50',
            color: '#fff',
            textDecoration: 'none',
          }}
        >
          Call
        </a>
      </div>
      {normalized && results.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Matching Contacts</h4>
          {results.map((c) => (
            <div key={c._id} style={{ padding: '0.5rem 0' }}>
              {c.name} – {c.phones[0]?.value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

