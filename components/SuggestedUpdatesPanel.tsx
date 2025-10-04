import React, { useEffect, useState } from 'react';

interface UpdateEvent {
  _id: string;
  contactId: string;
  userId: string;
  field: string;
  oldValue: any;
  newValue: any;
  status: string;
}

interface Props {
  userId: string;
}

export default function SuggestedUpdatesPanel({ userId }: Props) {
  const [events, setEvents] = useState<UpdateEvent[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await fetch(`/api/updates?userId=${userId}&status=pending`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function applyUpdate(event: UpdateEvent) {
    try {
      // Mark event as approved
      await fetch(`/api/updates/${event._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      // Apply change to contact
      await fetch(`/api/contacts/${event.contactId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [event.field]: event.newValue }),
      });
      await fetchEvents();
    } catch (err) {
      console.error(err);
    }
  }

  async function rejectUpdate(event: UpdateEvent) {
    try {
      await fetch(`/api/updates/${event._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });
      await fetchEvents();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <p>Loading updates…</p>;
  if (events.length === 0) return <p>No pending updates.</p>;
  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2>Suggested Updates</h2>
      {events.map((ev) => (
        <div key={ev._id} className="card" style={{ marginBottom: '1rem' }}>
          <p>
            <strong>{ev.field}</strong>: {JSON.stringify(ev.oldValue)} →{' '}
            <span style={{ fontWeight: 'bold' }}>{JSON.stringify(ev.newValue)}</span>
          </p>
          <button onClick={() => applyUpdate(ev)} style={{ marginRight: '0.5rem' }}>
            Apply Update
          </button>
          <button onClick={() => rejectUpdate(ev)}>Reject</button>
        </div>
      ))}
    </div>
  );
}
