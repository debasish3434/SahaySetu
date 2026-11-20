import User from '../models/User.js';

/**
 * initSuperAdmin
 * =============================================================
 * Called once on server startup (from server.js AFTER connectDB).
 *
 * Reads SUPER_ADMIN_EMAIL and SUPER_ADMIN_INITIAL_PASSWORD from
 * the environment. If a Super Admin does not yet exist in the
 * database, it creates one.
 *
 * Rules enforced:
 *  - Only ONE Super Admin can ever exist.
 *  - Credentials come exclusively from env vars — never from an API.
 *  - If the account already exists, nothing is changed.
 *  - The password is hashed by the User model pre-save hook.
 *
 * HOW TO CONFIGURE YOUR CREDENTIALS:
 * -----------------------------------
 * Add these lines to backend/.env (never commit this file to git):
 *
 *   SUPER_ADMIN_EMAIL=your_real_email@gmail.com
 *   SUPER_ADMIN_INITIAL_PASSWORD=YourSecurePassword123!
 *
 * After the server starts and the account is created, you MAY
 * remove SUPER_ADMIN_INITIAL_PASSWORD from .env for safety
 * (the account persists in MongoDB; the env var is only needed
 *  for the initial creation).
 *
 * NEVER hardcode credentials in this file or any frontend code.
 */
const initSuperAdmin = async () => {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const initialPassword = process.env.SUPER_ADMIN_INITIAL_PASSWORD;

  if (!email) {
    console.warn(
      '[SuperAdmin] SUPER_ADMIN_EMAIL not set in .env — Super Admin account will NOT be created automatically.\n' +
      '             Add SUPER_ADMIN_EMAIL=your_email@example.com to backend/.env and restart.'
    );
    return;
  }

  if (!initialPassword) {
    console.warn(
      '[SuperAdmin] SUPER_ADMIN_INITIAL_PASSWORD not set in .env — skipping Super Admin creation.\n' +
      '             Add SUPER_ADMIN_INITIAL_PASSWORD=YourPassword to backend/.env and restart.'
    );
    return;
  }

  try {
    // Wait for the partial unique index so concurrent app instances cannot race.
    await User.init();
    // Safety check: ensure only one Super Admin ever exists
    const existingSuper = await User.findOne({ isSuperAdmin: true });
    if (existingSuper) {
      console.log(`[SuperAdmin] Super Admin already exists: ${existingSuper.email} — no action taken.`);
      return;
    }

    // Check if the target email already has an account with a different role
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error(`[SuperAdmin] Configured email ${email} already belongs to an account. No role was changed. Back up the database and review an explicit owner migration.`);
      return;
    }

    // Create brand-new Super Admin account
    const superAdmin = await User.create({
      name: 'Super Administrator',
      email: email.toLowerCase(),
      password: initialPassword,
      role: 'admin',
      isSuperAdmin: true,
      approvalStatus: 'approved',
      isActive: true,
      bio: 'SahaySetu platform owner and Super Administrator.',
    });

    console.log(`[SuperAdmin] ✅ Super Admin account created successfully: ${superAdmin.email}`);
    console.log('[SuperAdmin] ⚠️  You may now remove SUPER_ADMIN_INITIAL_PASSWORD from your .env file.');

  } catch (err) {
    console.error('[SuperAdmin] ❌ Error during Super Admin initialization:', err.message);
    // Non-fatal — server continues to run; Super Admin can be manually set in MongoDB
  }
};

export default initSuperAdmin;
