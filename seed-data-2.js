// seed-network.js
require('dotenv').config();
const mongoose   = require('mongoose');
const User       = require('./models/User');
const TrustEdge  = require('./models/TrustEdge');

// 1) Connect to MongoDB
async function connect() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser:    true,
      useUnifiedTopology: true
    });
  }
}

// 2) Seed users & trust edges
async function seed() {
  await connect();
  console.log('✅ Connected');

  // a) Clear existing
  await User.deleteMany({});
  await TrustEdge.deleteMany({});
  console.log('🗑️  Cleared User & TrustEdge collections');

  // b) Create sample users
  const sampleUsers = [
    { phone: '+1-202-555-0101', name: 'Alice' },
    { phone: '+1-202-555-0102', name: 'Bob' },
    { phone: '+1-202-555-0103', name: 'Carol' },
    { phone: '+1-202-555-0104', name: 'Dave' },
    { phone: '+1-202-555-0105', name: 'Eve' }
  ];
  const users = await User.insertMany(sampleUsers);
  console.log(`👤 Inserted ${users.length} users`);

  // c) Create trust edges (confirmed in both directions for some pairs)
  const edges = [
    // strong mutual between Alice & Bob
    { fromUser: users[0]._id, toUser: users[1]._id, confirmed: true },
    { fromUser: users[1]._id, toUser: users[0]._id, confirmed: true },

    // one-way trust Carol→Dave
    { fromUser: users[2]._id, toUser: users[3]._id, confirmed: false },

    // mutual Dave↔Eve
    { fromUser: users[3]._id, toUser: users[4]._id, confirmed: true },
    { fromUser: users[4]._id, toUser: users[3]._id, confirmed: true },

    // bridging Alice→Eve
    { fromUser: users[0]._id, toUser: users[4]._id, confirmed: false }
  ];
  await TrustEdge.insertMany(edges);
  console.log(`🔗 Inserted ${edges.length} trust edges`);

  console.log('🎉 Network seeding complete');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});

