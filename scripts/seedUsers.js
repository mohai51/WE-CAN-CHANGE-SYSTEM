require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('Error: MONGO_URI is not defined in .env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Admin Credentials
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const adminData = {
      userId: 'admin',
      name: 'WCC Executive Administrator',
      email: 'admin@wecanchange.org',
      password: adminPasswordHash,
      role: 'admin',
      phone: '+8801700000001',
      status: 'active'
    };

    // Member Credentials
    const memberPasswordHash = await bcrypt.hash('member123', 10);
    const memberData = {
      userId: 'member01',
      name: 'General Member',
      email: 'member@wecanchange.org',
      password: memberPasswordHash,
      role: 'member',
      phone: '+8801700000002',
      status: 'active'
    };

    // Upsert Admin
    await User.findOneAndUpdate(
      { $or: [{ userId: 'admin' }, { email: 'admin@wecanchange.org' }] },
      adminData,
      { upsert: true, new: true }
    );
    console.log('✓ Admin account seeded:');
    console.log('   User ID:  admin');
    console.log('   Email:    admin@wecanchange.org');
    console.log('   Password: admin123');
    console.log('   Role:     admin (Access to Member & Finance Management)');

    // Upsert Member
    await User.findOneAndUpdate(
      { $or: [{ userId: 'member01' }, { email: 'member@wecanchange.org' }] },
      memberData,
      { upsert: true, new: true }
    );
    console.log('✓ Member account seeded:');
    console.log('   User ID:  member01');
    console.log('   Email:    member@wecanchange.org');
    console.log('   Password: member123');
    console.log('   Role:     member (Access to Member Self-Service only)');

    console.log('\n✓ Database seeding completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
