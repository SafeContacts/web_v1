import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Dialer from '../components/Dialer';
import { Contact } from '../components/ContactCard';

// A simple dialer page. It loads the current user's contacts and passes them
// to the Dialer component along with the userId so calls can be logged.
export default function DialerPage() {
  // In your production app you should replace this with real user id retrieval
  const [userId] = useState<string>('demo-user');
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    async function fetchContacts() {
      try {
        const res = await fetch(`/api/admin/contacts?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setContacts(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchContacts();
  }, [userId]);
  return (
    <div>
      <h1>Dialer</h1>
      {/* Pass userId to the Dialer so it can log outgoing calls */}
      <Dialer contacts={contacts} userId={userId} />
    </div>
  );
}

