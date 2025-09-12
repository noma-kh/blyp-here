import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node seed/make_admin.js user@example.com');
  process.exit(1);
}

const run = async () => {
  await connectDB();
  const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
  if (!user) {
    console.error('User not found:', email);
    process.exit(1);
  }
  console.log('Updated user to admin:', user.email);
  process.exit(0);
};

run().catch((e)=>{ console.error(e); process.exit(1); });

