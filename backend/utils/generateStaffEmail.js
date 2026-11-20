import User from '../models/User.js';

const STAFF_DOMAIN = process.env.STAFF_EMAIL_DOMAIN || 'sahaysetu.com';

/**
 * Builds a unique staff email like debasish3434@sahaysetu.com from a username.
 * If the base username is taken, appends random digits until unique.
 */
export const generateUniqueStaffEmail = async (username) => {
  const base = String(username).toLowerCase().replace(/[^a-z0-9]/g, '');

  if (base.length < 3) {
    throw new Error('Username must contain at least 3 letters or numbers');
  }

  let candidate = `${base}@${STAFF_DOMAIN}`;
  const taken = await User.findOne({ email: candidate });

  if (!taken) return candidate;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    candidate = `${base}${suffix}@${STAFF_DOMAIN}`;
    const exists = await User.findOne({ email: candidate });
    if (!exists) return candidate;
  }

  throw new Error('Could not generate a unique SahaySetu email. Try a different username.');
};

export const isStaffRole = (role) => ['admin', 'volunteer', 'coordinator'].includes(role);

export { STAFF_DOMAIN };
