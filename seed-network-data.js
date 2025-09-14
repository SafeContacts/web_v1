// seed-network-contacts.js
require('dotenv').config();
const mongoose   = require('mongoose');
//const Contact    = require('./models/Contact');
//const TrustEdge  = require('./models/TrustEdge');

async function connect() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser:    true,
      useUnifiedTopology: true
    });
  }
}

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

const Contact   = mongoose.model('Contact', contactSchema);
const TrustEdge = mongoose.model('TrustEdge', trustEdgeSchema);



async function seed() {
  await connect();
  console.log('✅ Connected to MongoDB');

  // Clear existing
 // await Contact.deleteMany({});
  await TrustEdge.deleteMany({});
  console.log('🗑️  Cleared Contacts & TrustEdges');

  // Create sample contacts
  const sample = [
    { phone: '+1-202-555-0101', name: 'Alice Johnson', email: 'alice@example.com', confidenceScore: 80 },
    { phone: '+1-202-555-0102', name: 'Bob Smith',     email: 'bob@example.com',   confidenceScore: 75 },
    { phone: '+1-202-555-0103', name: 'Carol Lee',     email: 'carol@example.com', confidenceScore: 85 },
    { phone: '+1-202-555-0104', name: 'Dave Patel',    email: 'dave@example.com',  confidenceScore: 60 },
    { phone: '+1-202-555-0105', name: 'Eve Wong',      email: 'eve@example.com',   confidenceScore: 90 }
  ];
  const contacts = await Contact.insertMany(sample);
  console.log(`👤 Inserted ${contacts.length} contacts`);

  // Create trust edges (use contact._id)
  const edges = [
    // Mutual between Alice <-> Bob
    { fromUser: contacts[0]._id, toUser: contacts[1]._id, confirmed: true },
    { fromUser: contacts[1]._id, toUser: contacts[0]._id, confirmed: true },

    // One-way Carol -> Dave
    { fromUser: contacts[2]._id, toUser: contacts[3]._id, confirmed: false },

    // Mutual Dave <-> Eve
    { fromUser: contacts[3]._id, toUser: contacts[4]._id, confirmed: true },
    { fromUser: contacts[4]._id, toUser: contacts[3]._id, confirmed: true },

    // Alice -> Eve (pending)
    { fromUser: contacts[0]._id, toUser: contacts[4]._id, confirmed: false }
  ];
  await TrustEdge.insertMany(edges);
  console.log(`🔗 Inserted ${edges.length} trust edges`);

  console.log('🎉 Contact-based network seeding complete');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});

