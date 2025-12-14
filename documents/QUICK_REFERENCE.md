# SafeContacts Quick Reference Guide

## 🎯 Core Features Implemented

### ✅ Contact Management
- CRUD operations with auto Person/ContactEdge creation
- Search by name, phone, email (normalized)
- Statistics dashboard

### ✅ Network Graph
- Interactive force-directed visualization
- User node centered (purple, fixed)
- Color-coded nodes (trust score), styled edges (mutual/orange, trust/green)
- Shows all contacts with weights

### ✅ Network Search (LinkedIn-style)
- Searches 1st & 2nd level connections (configurable depth)
- Privacy: Phone/email hidden for non-1st-level
- Name search via ContactAlias
- Connection level badges

### ✅ Connection Requests
- Send/approve/reject workflow
- Auto-creates bidirectional ContactEdge on approval
- Privacy: Details visible only after approval

### ✅ Trust Scoring
- Calculated from: call frequency, duration, messages, recency, consistency
- Auto-updates on call/message logging
- Stored on Person model

### ✅ Sync & Updates
- File/JSON import
- Change detection
- Network update suggestions

---

## 📁 Key Files

**Models:**
- `models/Person.ts` - Shared person data (has trustScore)
- `models/Contact.ts` - User-specific contacts
- `models/ContactEdge.ts` - Network relationships
- `models/ConnectionRequest.ts` - Connection requests

**APIs:**
- `pages/api/contacts/index.ts` - Contact CRUD (auto-creates Person/ContactEdge)
- `pages/api/network/search.ts` - Network search with privacy
- `pages/api/network/connect.ts` - Connection requests
- `pages/api/network/graph.ts` - Network graph data
- `pages/api/calls/calllog.ts` - Call logging (updates trust)

**Pages:**
- `pages/index.tsx` - Homepage
- `pages/discovery.tsx` - Network search UI
- `pages/network.tsx` - Graph visualization
- `pages/connection-requests.tsx` - Request management

**Components:**
- `components/NetworkGraph.tsx` - Graph visualization
- `components/NetworkSearchResult.tsx` - Search result card

**Lib:**
- `lib/trustScore.ts` - Trust calculation logic

---

## 🔑 Key Technical Details

### Contact Creation Flow
1. User adds contact → `POST /api/contacts`
2. Find/create Person by phone/email
3. Create Contact entry
4. Create ContactAlias
5. Create ContactEdge (from user's person to contact's person)

### Network Search Flow
1. Get 1st level connections (ContactEdge from user)
2. Get 2nd level (ContactEdge from 1st level)
3. Search Persons by name/phone/email in network
4. Apply privacy: hide phone/email if not 1st level
5. Return with connection level and request status

### Trust Score Formula
- Call frequency: 0-30 pts (calls/week)
- Duration: 0-25 pts (avg minutes)
- Messages: 0-20 pts (messages/week)
- Recency: 0-15 pts (days since last)
- Consistency: 0-10 pts (weeks spread)
- **Total: 0-100**

### Connection Request Flow
1. User sends request → `POST /api/network/connect`
2. Creates ConnectionRequest (pending)
3. Recipient approves → `PUT /api/network/connect` (action: approve)
4. Creates bidirectional ContactEdge
5. Creates ContactAlias for both users
6. Now both can see each other's details

---

## 🐛 Common Issues & Fixes

1. **Contacts not in graph:** Ensure ContactEdge created on contact add
2. **Phone search fails:** Normalize phone (remove non-digits) before search
3. **Trust score 0:** Check CallLog entries, ensure Person has trustScore field
4. **Privacy not working:** Verify connection level calculation in search API

---

## ⚙️ Configuration

```env
MONGODB_URI=...
NETWORK_SEARCH_DEPTH=2  # 1st and 2nd level
```

---

## 📊 Database Relationships

```
User → personId → Person
User → Contact (userId)
Contact → Person (via phone/email matching)
User → ContactAlias (userId, personId)
Person → ContactEdge (fromPersonId/toPersonId)
Person → TrustEdge (fromPersonId/toPersonId)
Person → ConnectionRequest (fromPersonId/toPersonId)
User → CallLog (userId, fromPersonId/toPersonId)
```

---

## 🚀 Quick Start for New Session

1. Read `documents/IMPLEMENTATION_PRD.md` for full details
2. Check `models/` for data structure
3. Check `pages/api/` for endpoints
4. All features are production-ready
5. Network search depth configurable via env var

---

**Last Updated:** 2024

