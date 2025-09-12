import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../src/config/db.js';
import Badge from '../src/models/Badge.js';

const badges = [
  { key: 'first_review', name: 'First Sip', description: 'Post your first review', criteria: { type: 'first_review' } },
  { key: 'reviewer_5', name: 'Coffee Nomad', description: 'Write 5 reviews', criteria: { type: 'reviews_count', threshold: 5 } },
  { key: 'reviewer_20', name: 'Review Pro', description: 'Write 20 reviews', criteria: { type: 'reviews_count', threshold: 20 } },
  { key: 'contributor_1', name: 'Contributor', description: '1 suggestion approved', criteria: { type: 'suggestions_approved', threshold: 1 } }
];

const run = async () => {
  await connectDB();
  for (const b of badges) {
    await Badge.updateOne({ key: b.key }, b, { upsert: true });
  }
  const count = await Badge.countDocuments();
  console.log('Badges present:', count);
  process.exit(0);
};

run().catch((e)=>{ console.error(e); process.exit(1); });

