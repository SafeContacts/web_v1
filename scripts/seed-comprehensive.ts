// scripts/seed-comprehensive.ts
// Comprehensive seed script with test data for all features
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // Try .env as fallback
  dotenv.config();
}

import User from '../models/User';
import Person from '../models/Person';
import Contact from '../models/Contact';
import ContactAlias from '../models/ContactAlias';
import ContactEdge from '../models/ContactEdge';
import TrustEdge from '../models/TrustEdge';
import CallLog from '../models/CallLog';
import ConnectionRequest from '../models/ConnectionRequest';
import BlockedContact from '../models/BlockedContact';
import Business from '../models/Business';
import UpdateEvent from '../models/UpdateEvent';
import Permission from '../models/Permission';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI environment variable is required');
  console.error('   Please set MONGODB_URI in your .env.local file or environment');
  console.error('   Example: MONGODB_URI=mongodb://localhost:27017/safecontacts');
  process.exit(1);
}

// Static admin credentials (not a real user)
const STATIC_ADMIN = {
  username: 'admin',
  password: 'Admin@123!',
  phone: '+15550000000',
};

// Helper to normalize phone to E.164
function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('1') && digits.length === 11) {
    return '+' + digits;
  }
  if (digits.length === 10) {
    return '+1' + digits;
  }
  return '+' + digits;
}

// Generate random phone number
function randomPhone(): string {
  const area = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `+1${area}${exchange}${number}`;
}

// Generate random email
function randomEmail(name: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'business.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${name.toLowerCase().replace(/\s+/g, '.')}@${domain}`;
}

async function seed() {
  console.log('🌱 Starting comprehensive seed...');
  
  if (!MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(MONGODB_URI, {});
  console.log('✅ Connected to MongoDB');

  // Clean database
  console.log('🧹 Cleaning database...');
  await Promise.all([
    Person.deleteMany({}),
    User.deleteMany({}),
    Contact.deleteMany({}),
    ContactAlias.deleteMany({}),
    ContactEdge.deleteMany({}),
    TrustEdge.deleteMany({}),
    CallLog.deleteMany({}),
    ConnectionRequest.deleteMany({}),
    BlockedContact.deleteMany({}),
    Business.deleteMany({}),
    UpdateEvent.deleteMany({}),
    Permission.deleteMany({}),
  ]);
  console.log('✅ Database cleaned');

  // Create Persons (50 persons)
  console.log('👥 Creating persons...');
  const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack',
    'Kate', 'Liam', 'Mia', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Rachel', 'Sam', 'Tina',
    'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zoe', 'Alex', 'Blake', 'Casey', 'Drew',
    'Eden', 'Finley', 'Grey', 'Harper', 'Indigo', 'Jordan', 'Kai', 'Logan', 'Morgan', 'Nico',
    'Phoenix', 'Quinn', 'River', 'Sage', 'Taylor', 'Winter', 'Avery', 'Cameron', 'Dakota', 'Emery'];
  
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee',
    'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
    'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams'];
  
  const persons: any[] = [];
  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const name = `${firstName} ${lastName}`;
    const phone = randomPhone();
    const email = randomEmail(name);
    
    persons.push({
      phones: [{ label: 'mobile', value: phone, e164: toE164(phone) }],
      emails: [{ label: 'personal', value: email }],
      addresses: i % 3 === 0 ? [`${Math.floor(Math.random() * 9999)} Main St, City, State`] : [],
      trustScore: Math.floor(Math.random() * 100),
      socials: i % 5 === 0 ? {
        linkedIn: `https://linkedin.com/in/${name.toLowerCase().replace(/\s+/g, '-')}`,
      } : {},
    });
  }
  
  const createdPersons = await Person.insertMany(persons);
  console.log(`✅ Created ${createdPersons.length} persons`);

  // Create Users (20 users, including admin)
  console.log('👤 Creating users...');
  const users: any[] = [];
  const passwordHash = await bcrypt.hash('Password123!', 10);
  
  // Create static admin user
  const adminPerson = await Person.create({
    phones: [{ label: 'mobile', value: STATIC_ADMIN.phone, e164: toE164(STATIC_ADMIN.phone) }],
    emails: [{ label: 'work', value: 'admin@safcontacts.com' }],
    registeredUserId: 'static-admin',
  });
  
  const adminUser = await User.create({
    phone: STATIC_ADMIN.phone,
    username: STATIC_ADMIN.username,
    passwordHash: await bcrypt.hash(STATIC_ADMIN.password, 10),
    personId: adminPerson._id,
    role: 'admin',
    stealthMode: false,
  });
  users.push(adminUser);
  adminPerson.registeredUserId = adminUser._id.toString();
  await adminPerson.save();
  
  // Create regular users
  for (let i = 0; i < 19; i++) {
    const person = createdPersons[i];
    const phone = person.phones[0].e164;
    const username = person.emails[0].value.split('@')[0];
    
    const user = await User.create({
      phone,
      username,
      passwordHash,
      personId: person._id,
      role: i < 3 ? 'business' : 'user',
      stealthMode: i % 4 === 0, // 25% in stealth mode
    });
    
    users.push(user);
    person.registeredUserId = user._id.toString();
    await person.save();
    
    // Create self-alias
    await ContactAlias.create({
      userId: user._id.toString(),
      personId: person._id,
      alias: username,
      tags: [],
      notes: '',
    });
  }
  console.log(`✅ Created ${users.length} users (including admin)`);

  // Create Contacts and ContactEdges
  console.log('📇 Creating contacts and edges...');
  const contacts: any[] = [];
  const contactEdges: any[] = [];
  
  for (const user of users) {
    if (user.role === 'admin') continue; // Skip admin for contacts
    
    const userPerson = await Person.findById(user.personId);
    if (!userPerson) continue;
    
    // Each user has 10-20 contacts
    const numContacts = Math.floor(Math.random() * 11) + 10;
    const shuffledPersons = [...createdPersons].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numContacts && i < shuffledPersons.length; i++) {
      const contactPerson = shuffledPersons[i];
      if (contactPerson._id.toString() === userPerson._id.toString()) continue;
      
      const alias = contactPerson.emails[0].value.split('@')[0];
      
      // Create Contact
      const contact = await Contact.create({
        userId: user._id.toString(),
        name: alias,
        phones: contactPerson.phones,
        emails: contactPerson.emails,
        addresses: contactPerson.addresses,
        notes: `Contact notes for ${alias}`,
        trustScore: contactPerson.trustScore || 0,
        tags: ['friend', 'colleague', 'family'][Math.floor(Math.random() * 3)],
      });
      contacts.push(contact);
      
      // Create ContactAlias
      await ContactAlias.create({
        userId: user._id.toString(),
        personId: contactPerson._id,
        alias,
        tags: ['friend'],
        notes: '',
      });
      
      // Create ContactEdge
      const edge = await ContactEdge.create({
        fromPersonId: userPerson._id,
        toPersonId: contactPerson._id,
        weight: Math.floor(Math.random() * 10) + 1,
        lastContactedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
      contactEdges.push(edge);
    }
  }
  console.log(`✅ Created ${contacts.length} contacts and ${contactEdges.length} edges`);

  // Create TrustEdges (trust relationships)
  console.log('🤝 Creating trust edges...');
  const trustEdges: any[] = [];
  for (let i = 0; i < 30; i++) {
    const fromPerson = createdPersons[Math.floor(Math.random() * createdPersons.length)];
    const toPerson = createdPersons[Math.floor(Math.random() * createdPersons.length)];
    
    if (fromPerson._id.toString() === toPerson._id.toString()) continue;
    
    // Check if edge already exists
    const exists = await TrustEdge.findOne({
      fromPersonId: fromPerson._id,
      toPersonId: toPerson._id,
    });
    
    if (!exists) {
      const trustEdge = await TrustEdge.create({
        fromPersonId: fromPerson._id,
        toPersonId: toPerson._id,
        level: Math.floor(Math.random() * 3) + 1,
      });
      trustEdges.push(trustEdge);
    }
  }
  console.log(`✅ Created ${trustEdges.length} trust edges`);

  // Create CallLogs (calls and SMS)
  console.log('📞 Creating call and message logs...');
  const callLogs: any[] = [];
  const messageLogs: any[] = [];
  
  for (let i = 0; i < 200; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const userPerson = await Person.findById(user.personId);
    if (!userPerson) continue;
    
    const contactPerson = createdPersons[Math.floor(Math.random() * createdPersons.length)];
    if (contactPerson._id.toString() === userPerson._id.toString()) continue;
    
    const isCall = Math.random() > 0.5;
    const timestamp = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    
    if (isCall) {
      const callLog = await CallLog.create({
        userId: user._id.toString(),
        fromPersonId: userPerson._id,
        toPersonId: contactPerson._id,
        type: 'call',
        duration: Math.floor(Math.random() * 3600) + 60,
        timestamp,
      });
      callLogs.push(callLog);
    } else {
      const messageLog = await CallLog.create({
        userId: user._id.toString(),
        fromPersonId: userPerson._id,
        toPersonId: contactPerson._id,
        type: 'sms',
        duration: 0,
        timestamp,
      });
      messageLogs.push(messageLog);
    }
  }
  console.log(`✅ Created ${callLogs.length} call logs and ${messageLogs.length} message logs`);

  // Create ConnectionRequests
  console.log('🔗 Creating connection requests...');
  const connectionRequests: any[] = [];
  for (let i = 0; i < 15; i++) {
    const fromUser = users[Math.floor(Math.random() * users.length)];
    const toPerson = createdPersons[Math.floor(Math.random() * createdPersons.length)];
    const fromPerson = await Person.findById(fromUser.personId);
    
    if (!fromPerson || fromPerson._id.toString() === toPerson._id.toString()) continue;
    
    const statuses = ['pending', 'approved', 'rejected'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const request = await ConnectionRequest.create({
      fromUserId: fromUser._id.toString(),
      fromPersonId: fromPerson._id,
      toPersonId: toPerson._id,
      status,
      message: `Connection request from ${fromUser.username}`,
      requestCount: 1,
    });
    connectionRequests.push(request);
  }
  console.log(`✅ Created ${connectionRequests.length} connection requests`);

  // Create BlockedContacts
  console.log('🚫 Creating blocked contacts...');
  const blockedContacts: any[] = [];
  for (let i = 0; i < 10; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const blockedPerson = createdPersons[Math.floor(Math.random() * createdPersons.length)];
    const userPerson = await Person.findById(user.personId);
    
    if (!userPerson || userPerson._id.toString() === blockedPerson._id.toString()) continue;
    
    const blocked = await BlockedContact.create({
      userId: user._id.toString(),
      personId: blockedPerson._id,
      phoneNumber: blockedPerson.phones[0]?.value,
      reason: 'Spam',
      blockedAt: new Date(),
    });
    blockedContacts.push(blocked);
  }
  console.log(`✅ Created ${blockedContacts.length} blocked contacts`);

  // Create Businesses
  console.log('🏢 Creating businesses...');
  const businessNames = ['TechCorp', 'DesignStudio', 'ConsultingGroup', 'MarketingAgency', 'DevShop',
    'CreativeLab', 'InnovationHub', 'DigitalWorks', 'CodeCraft', 'WebSolutions'];
  
  const businesses: any[] = [];
  for (let i = 0; i < 10; i++) {
    const business = await Business.create({
      businessId: `biz-${i + 1}`,
      name: businessNames[i],
      phone: randomPhone(),
      category: ['Technology', 'Design', 'Consulting', 'Marketing', 'Development'][i % 5],
      rating: Math.random() * 2 + 3, // 3-5 stars
      verified: i % 2 === 0,
    });
    businesses.push(business);
  }
  console.log(`✅ Created ${businesses.length} businesses`);

  // Create UpdateEvents
  console.log('📝 Creating update events...');
  const updateEvents: any[] = [];
  for (let i = 0; i < 20; i++) {
    const fromUser = users[Math.floor(Math.random() * users.length)];
    const person = createdPersons[Math.floor(Math.random() * createdPersons.length)];
    
    const fields = ['phones', 'emails', 'addresses'];
    const field = fields[Math.floor(Math.random() * fields.length)];
    
    const updateEvent = await UpdateEvent.create({
      personId: person._id,
      fromUserId: fromUser._id.toString(),
      field,
      oldValue: 'old value',
      newValue: 'new value',
      stealth: Math.random() > 0.5,
      applied: false,
    });
    updateEvents.push(updateEvent);
  }
  console.log(`✅ Created ${updateEvents.length} update events`);

  // Create Permissions for users
  console.log('🔐 Creating permissions...');
  const permissions: any[] = [];
  for (const user of users) {
    // Grant default permissions to all users
    const permission = await Permission.create({
      userId: user._id.toString(),
      permissions: {
        readCallLogs: true,
        readMessageLogs: true,
        readContacts: true,
        makeCalls: true,
        sendMessages: true,
        sendEmails: user.role === 'admin' || user.role === 'business', // Only admin and business can send emails
      },
      grantedAt: new Date(),
      grantedBy: adminUser._id.toString(),
    });
    permissions.push(permission);
  }
  console.log(`✅ Created ${permissions.length} permission records`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${createdPersons.length} Persons`);
  console.log(`   - ${users.length} Users (1 admin)`);
  console.log(`   - ${contacts.length} Contacts`);
  console.log(`   - ${contactEdges.length} ContactEdges`);
  console.log(`   - ${trustEdges.length} TrustEdges`);
  console.log(`   - ${callLogs.length} CallLogs`);
  console.log(`   - ${messageLogs.length} MessageLogs`);
  console.log(`   - ${connectionRequests.length} ConnectionRequests`);
  console.log(`   - ${blockedContacts.length} BlockedContacts`);
  console.log(`   - ${businesses.length} Businesses`);
  console.log(`   - ${updateEvents.length} UpdateEvents`);
  console.log(`   - ${permissions.length} Permissions`);
  console.log('\n🔑 Static Admin Credentials:');
  console.log(`   Username: ${STATIC_ADMIN.username}`);
  console.log(`   Password: ${STATIC_ADMIN.password}`);
  console.log(`   Phone: ${STATIC_ADMIN.phone}`);
  
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

