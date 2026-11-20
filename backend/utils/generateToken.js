import jwt from 'jsonwebtoken';

/**
 * Generates a signed JWT containing the user's id and role.
 * Used for authenticating subsequent requests.
 */
const generateToken = (id, role, sessionVersion = 0) =>
  jwt.sign({ id, role, sessionVersion }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

export default generateToken;
