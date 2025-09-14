// seed-data.js
require('dotenv').config();
const mongoose = require('mongoose');

// 1. Define your schemas/models inline
const userSchema = new mongoose.Schema({
  phone: { type: String, unique: true },
  name: String,
  publicProfile: { type: Boolean, default: true }
});
const contactSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: String,
  phone: String,
  email: String,
  confidenceScore: Number
});
const trustEdgeSchema = new mongoose.Schema({
  fromUser: mongoose.Schema.Types.ObjectId,
  toUser:   mongoose.Schema.Types.ObjectId,
  confirmed:{ type: Boolean, default: false },
  createdAt:{ type: Date, default: Date.now }
});
const businessSchema = new mongoose.Schema({
  businessId: String,
  name:       String,
  category:   String,
  phone:      String,
  rating:     Number,
  verified:   { type: Boolean, default: false }
});

const User      = mongoose.model('User', userSchema);
const Contact   = mongoose.model('Contact', contactSchema);
const TrustEdge = mongoose.model('TrustEdge', trustEdgeSchema);
const Business  = mongoose.model('Business', businessSchema);

// 2. Sample data
const sampleUsers = [
  { phone: '+1-202-555-0143', name: 'Alice Johnson' },
  { phone: '+1-303-555-0198', name: 'Bob Smith' },
  { phone: '+1-415-555-0123', name: 'Carol Lee' }
];
const sampleBusinesses = [
  { businessId: 'biz1', name: 'Bob’s Plumbing', category: 'Home Services', phone: '+1-303-555-0198', rating: 4.7 },
  { businessId: 'biz2', name: 'Carol’s Cafe',   category: 'Food & Beverage', phone: '+1-415-555-0123', rating: 4.3 }
];

async function seed() {
  // 3. Connect
  //const uri = process.env.MONGODB_URI;
  console.log('✅ .............Connecting to MongoDB');
  const uri = "mongodb+srv://safecontacts:hansraj@cluster0.aquzss3.mongodb.net/?retryWrites=true&w=majority&appName=cluster0"
  if (!uri) throw new Error('MONGODB_URI not set in .env');
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  // 4. Clean existing data
  await Promise.all([
    User.deleteMany({}),
//    Contact.deleteMany({}),
    TrustEdge.deleteMany({}),
    Business.deleteMany({})
  ]);
  console.log('🗑️  Cleared existing collections');

  // 5. Insert users
  const users = await User.insertMany(sampleUsers);
  console.log(`👤 Inserted ${users.length} users`);

  // 6. Create contacts (one per user)
  const contacts = await Contact.insertMany(
    users.map(u => ({
      userId: u._id,
      name: u.name,
      phone: u.phone,
      email: `${u.name.split(' ')[0].toLowerCase()}@example.com`,
      confidenceScore: Math.floor(Math.random()*40) + 60 // 60–100
    }))
  );
  console.log(`📇 Inserted ${contacts.length} contacts`);

  // 7. Insert mutual trust edges between first two users
  if (users.length >= 2) {
    await TrustEdge.insertMany([
      { fromUser: users[0]._id, toUser: users[1]._id, confirmed: true },
      { fromUser: users[1]._id, toUser: users[0]._id, confirmed: true }
    ]);
    console.log('🔗 Inserted 2 trust edges between first two users');
  }

  // 8. Insert businesses
  const biz = await Business.insertMany(sampleBusinesses);
  console.log(`🏢 Inserted ${biz.length} businesses`);

  // 9. Done
  console.log('🎉 Seeding complete');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

