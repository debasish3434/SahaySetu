/** Read-only account inventory. This script never changes existing records. */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

dotenv.config();

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set in backend/.env');
  await mongoose.connect(process.env.MONGO_URI);
  const summary = await User.aggregate([
    { $group: { _id: { role: '$role', approvalStatus: { $ifNull: ['$approvalStatus', 'unset'] }, active: { $ifNull: ['$isActive', 'unset'] }, isSuperAdmin: { $ifNull: ['$isSuperAdmin', false] } }, count: { $sum: 1 } } },
    { $sort: { '_id.role': 1, '_id.approvalStatus': 1 } },
  ]);
  console.log('Read-only account inventory; no records were modified.');
  console.table(summary.map(({ _id, count }) => ({ ..._id, count })));
  const owners = await User.find({ isSuperAdmin: true }).select('name email isActive approvalStatus').lean();
  console.log(`Super Admin accounts (${owners.length}):`, owners);
  console.log('Back up MongoDB, then review account identities and approval statuses before any migration.');
};

run().catch((error) => { console.error('Inventory failed:', error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
