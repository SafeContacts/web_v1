import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import User   from '../../../models/User';
import ContactEdge from '../../../models/ContactEdge';
import ContactAlias from '../../../models/ContactAlias';
import Person from '../../../models/Person';
import { connect } from '../../../lib/mongodb';
import { signToken } from '../../../src/lib/jwt';
import { setRefreshToken } from '../../../src/lib/cookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  if (req.method !== 'POST') return res.status(405).end();
  const { phone, password, name } = req.body;
  if (!phone || !password || !name) {
    return res.status(400).json({ error: 'phone, password & name required' });
  }
  if (await User.findOne({ phone })) {
    return res.status(409).json({ error: 'User exists' });
  }
  const passwordHash = await bcrypt.hash(password, 10);

  // Check if Person already exists (from synced contacts) - if so, link to it
  const phoneE164 = '+' + phone.replace(/\D/g, '');
  let person = await Person.findOne({
    $or: [
      { 'phones.e164': phoneE164 },
      { 'phones.value': phone },
    ],
  });

  if (!person) {
    // Create a Person record.  We set registeredUserId later once the User is created.
    person = await Person.create({
      phones: [{ label: 'mobile', value: phone, e164: phoneE164 }],
      emails: [{ label: 'work', value: phone + '@hidden.safe.local' }],
    });
  } else {
    // Update existing Person to mark it as registered
    // This "takes up" the node when a synced contact registers
    if (!person.phones?.some((p: any) => p.value === phone || p.e164 === phoneE164)) {
      person.phones.push({ label: 'mobile', value: phone, e164: phoneE164 });
    }
  }

  // Create a User referencing the person
  const user = await User.create({ username: name, personId: person._id, role: "user", phone, passwordHash });
  // Link the Person back to the user as the registered account.
  person.registeredUserId = user._id.toString();
  await person.save();
  // Create a ContactAlias for the user referring to themselves, so they appear in their own contact list
  await ContactAlias.create({ userId: user._id.toString(), personId: person._id, alias: name, tags: [], notes: "" });
  // Also create a ContactEdge from the person's node to themselves to establish a self-link.
  await ContactEdge.create({ fromPersonId: person._id, toPersonId: person._id, weight: 1 });
  /* Ensure a Contact exists for this phone, mark it “alive”
  await Contact.findOneAndUpdate(
   { phone },
     {
	phone,
	name,
	email: phone + '@hidden.local', // placeholder until user provides
	isRegistered: true,
	userRef: user._id
     },
     { upsert: true, setDefaultsOnInsert: true }
  );
  */
  const accessToken  = signToken({ sub: user._id, role: user.role }, '2d');
  const refreshToken = signToken({ sub: user._id }, '7d');
  setRefreshToken(res, refreshToken);
  res.status(201).json({ accessToken });
/*+    // Generate JWT for the new user
+    const payload = { sub: userDoc._id.toString(), role: userDoc.role };
+    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1h" });
+    return res.status(201).json({ ok: true, userId: userDoc._id.toString(), token });
*/
}
