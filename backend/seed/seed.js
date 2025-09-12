import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../src/config/db.js';
import Cafe from '../src/models/Cafe.js';
import cafes from './data/cafes.json' assert { type: 'json' };

const run = async () => {
  await connectDB();
  await Cafe.deleteMany({});
  await Cafe.insertMany(cafes);
  console.log('Seeded cafes:', cafes.length);
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

