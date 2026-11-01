import { authenticate, sendResponse } from '../_lib/auth.js';
import { seedDemoDataForUser, clearUserData } from '../_lib/seed.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendResponse(res, 405, false, 'Method not allowed');
  }

  try {
    const user = await authenticate(req);
    await clearUserData(user.id);
    await seedDemoDataForUser(user.id);
    return sendResponse(res, 200, true, 'Sample demo financial data generated successfully');
  } catch (err) {
    return sendResponse(res, err.status || 500, false, err.message);
  }
}
