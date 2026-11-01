import { authenticate, sendResponse } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendResponse(res, 405, false, 'Method not allowed');
  }

  try {
    const user = await authenticate(req);
    return sendResponse(res, 200, true, 'Profile fetched successfully', {
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency || 'USD',
      role: user.role || 'ROLE_USER',
      createdAt: user.created_at || new Date().toISOString(),
    });
  } catch (err) {
    return sendResponse(res, err.status || 500, false, err.message);
  }
}
