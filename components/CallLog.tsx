import React, { useEffect, useState } from 'react';

interface CallLogEntry {
  _id: string;
  userId: string;
  contactId?: string;
  phoneNumber: string;
  type: string;
  timestamp: string;
}

interface Props {
  userId: string;
}

export default function CallLog({ userId }: Props) {
  const [logs, setLogs] = useState<CallLogEntry[]>([]);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch(`/api/calllog?userId=${userId}&limit=20`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchLogs();
  }, [userId]);
  if (!userId) return null;
  return (
    <div style={{ marginTop: '2rem' }}>
      <h2>Recent Calls</h2>
      {logs.length === 0 && <p>No recent calls.</p>}
      {logs.map((log) => (
        <div key={log._id} className="card" style={{ marginBottom: '0.5rem' }}>
          <div>
            <strong>{log.phoneNumber}</strong> ({log.type})
          </div>
          <div>{new Date(log.timestamp).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
