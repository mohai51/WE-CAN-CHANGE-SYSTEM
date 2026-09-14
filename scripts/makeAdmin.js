// Usage: node scripts/makeAdmin.js someone@example.com
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.log('Usage: node scripts/makeAdmin.js <email>');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
  if (!user) {
    console.log('No user found with that email. Register first, then run this.');
  } else {
    console.log(`${user.name} (${user.email}) is now an admin.`);
  }
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
