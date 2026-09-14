require('dotenv').config();
const mongoose = require('mongoose');
const Pillar = require('../models/Pillar');

const pillars = [
  { name: 'Education', description: 'Scholarships, career counseling, skill development' },
  { name: 'Health', description: 'Health camps, blood donation, welfare aid' },
  { name: 'Sports', description: 'Tournaments, athlete development' },
  { name: 'Culture', description: 'Cultural events, festivals, artist directory' },
  { name: 'Heritage', description: 'Heritage archive, oral history, site documentation' }
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  for (const p of pillars) {
    await Pillar.updateOne({ name: p.name }, p, { upsert: true });
  }
  console.log('Seeded 5 pillars');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
