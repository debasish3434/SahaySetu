/**
 * Seed Script - SahaySetu Demo Users
 * ====================================
 * Run from the backend/ directory:
 *   node seed.js            -> inserts / refreshes all 4 demo accounts
 *   node seed.js --destroy  -> removes only the seeded demo accounts
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

dotenv.config();

const buildDemoUsers = () => {
  const users = [
    {
      name: 'Demo Admin',
      email: 'admin@sahaysetu.dev',
      password: 'Admin1234',
      phone: '9000000001',
      role: 'admin',
      bio: 'Demo admin account with full system access.',
    },
    {
      name: 'Demo Coordinator',
      email: 'coordinator@sahaysetu.dev',
      password: 'Coord1234',
      phone: '9000000002',
      role: 'coordinator',
      bio: 'Demo coordinator account for managing response operations.',
    },
    {
      name: 'Demo Volunteer',
      email: 'volunteer@sahaysetu.dev',
      password: 'Volun1234',
      phone: '9000000003',
      role: 'volunteer',
      bio: 'Demo volunteer account for verifying and responding to incidents.',
    },
    {
      name: 'Demo Citizen',
      email: 'citizen@sahaysetu.dev',
      password: 'Citiz1234',
      phone: '9000000004',
      role: 'citizen',
      bio: 'Demo citizen account for reporting local incidents.',
    },
  ];

  return users;
};

const DEMO_USERS = buildDemoUsers();

const DEMO_EMAILS = DEMO_USERS.map((u) => u.email);

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('ERROR: MONGO_URI is not set in .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('MongoDB connected:', mongoose.connection.host);
};

const destroyDemoUsers = async () => {
  const result = await User.deleteMany({ email: { $in: DEMO_EMAILS } });
  console.log('Removed', result.deletedCount, 'demo user(s).');
};

const seedDemoUsers = async () => {
  // Remove stale demo users first so we always get a clean re-seed
  await destroyDemoUsers();

  const lines = [];
  for (const userData of DEMO_USERS) {
    const user = await User.create(userData); // password auto-hashed by pre-save hook
    lines.push('  ' + user.role.padEnd(14) + user.email + '   pw: ' + userData.password);
  }

  console.log('\nDemo users seeded:\n');
  console.log(lines.join('\n'));
  console.log('\nUse the Quick Demo Access panel on the Login page to sign in.\n');
};

const run = async () => {
  try {
    await connectDB();

    if (process.argv.includes('--destroy')) {
      await destroyDemoUsers();
      console.log('All demo users removed.');
    } else {
      await seedDemoUsers();
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
    process.exit(0);
  }
};

run();
