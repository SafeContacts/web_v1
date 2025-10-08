/*** File: pages/index.tsx */
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ContactCard from '../components/ContactCard';
import SuggestedUpdatesPanel from '../components/SuggestedUpdatesPanel';
import CallLog from '../components/CallLog';
import AddContactForm from '../components/AddContactForm';

/**
 * Decode the user ID from the JWT in localStorage.
 * If no token is present, fall back to a demo user ID so the page still works.
 */
function getCurrentUserId(): string {
  try {
    const token = localStorage.getItem('token');
    if (!token) return 'demo-user';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || 'demo-user';
  } catch {
    return 'demo-user';
  }
}

export default function HomePage() {
  const [userId, setUserId] = useState<string>('demo-user');
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Decode the user ID when the component mounts.
    const uid = getCurrentUserId();
    setUserId(uid);

    async function fetchContacts() {
      try {
        setLoading(true);
        const res = await fetch(`/api/contacts?userId=${uid}`);
        if (res.ok) {
          const data = await res.json();
          setContacts(data);
        } else {
          console.error('Failed to fetch contacts', await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchContacts();
  }, []);

  return (
    /*<Layout> */
    <div>
      <h1>My Contacts</h1>
      {/* Show pending update suggestions for this user */}
      <SuggestedUpdatesPanel userId={userId} />
      {/* Form to add a new contact. On success, append to local state */}
      <AddContactForm
        userId={userId}
        onCreated={(contact) => setContacts((prev) => [...prev, contact])}
      />
      {loading ? (
        <p>Loading contacts…</p>
      ) : contacts.length === 0 ? (
        <p>No contacts found. Sync your device or add a contact above.</p>
      ) : (
        contacts.map((c) => (
          <ContactCard key={c._id} contact={c} userId={userId} />
        ))
      )}
      {/* Show recent call logs for this user */}
      <CallLog userId={userId} />
      </div>
   /* </Layout> */
  );
}
