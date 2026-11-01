import { query, isUsingPostgres, getMemoryStore } from '../_lib/db.js';
import { authenticate, sendResponse } from '../_lib/auth.js';

const DEFAULT_CATEGORIES = [
  { name: 'Food', type: 'EXPENSE', icon: 'Utensils', color: '#EF4444' },
  { name: 'Shopping', type: 'EXPENSE', icon: 'ShoppingBag', color: '#F59E0B' },
  { name: 'Transportation', type: 'EXPENSE', icon: 'Car', color: '#3B82F6' },
  { name: 'Education', type: 'EXPENSE', icon: 'GraduationCap', color: '#8B5CF6' },
  { name: 'Healthcare', type: 'EXPENSE', icon: 'Activity', color: '#EC4899' },
  { name: 'Entertainment', type: 'EXPENSE', icon: 'Film', color: '#06B6D4' },
  { name: 'Rent', type: 'EXPENSE', icon: 'Home', color: '#10B981' },
  { name: 'Bills', type: 'EXPENSE', icon: 'FileText', color: '#6366F1' },
  { name: 'Other', type: 'EXPENSE', icon: 'MoreHorizontal', color: '#64748B' },
  { name: 'Salary', type: 'INCOME', icon: 'Briefcase', color: '#10B981' },
  { name: 'Freelance', type: 'INCOME', icon: 'Laptop', color: '#06B6D4' },
  { name: 'Investments', type: 'INCOME', icon: 'TrendingUp', color: '#3B82F6' },
  { name: 'Business', type: 'INCOME', icon: 'Building2', color: '#8B5CF6' },
  { name: 'Gifts', type: 'INCOME', icon: 'Gift', color: '#EC4899' },
  { name: 'Other Income', type: 'INCOME', icon: 'DollarSign', color: '#F59E0B' },
];

export async function categoriesHandler(req, res, pathParamId = null) {
  let user;
  try {
    user = await authenticate(req);
  } catch (err) {
    return sendResponse(res, err.status || 401, false, err.message);
  }

  const catId = pathParamId ? parseInt(pathParamId, 10) : (req.query?.id ? parseInt(req.query.id, 10) : null);

  if (catId && !isNaN(catId)) {
    if (req.method === 'DELETE') {
      try {
        if (isUsingPostgres()) {
          const delRes = await query('DELETE FROM categories WHERE id = $1 AND user_id = $2 AND is_custom = TRUE', [catId, user.id]);
          if (delRes.rowCount === 0) return sendResponse(res, 400, false, 'Cannot delete system default category or category of another user');
        } else {
          const store = getMemoryStore();
          const idx = store.categories.findIndex((c) => c.id === catId && c.user_id === user.id && c.is_custom === true);
          if (idx === -1) return sendResponse(res, 400, false, 'Cannot delete system default category or category of another user');
          store.categories.splice(idx, 1);
        }
        return sendResponse(res, 200, true, 'Category deleted successfully');
      } catch (err) {
        return sendResponse(res, 500, false, err.message);
      }
    }
    return sendResponse(res, 405, false, 'Method not allowed');
  }

  const { type } = req.query || {};

  if (req.method === 'GET') {
    try {
      if (isUsingPostgres()) {
        let sql = 'SELECT id, name, type, icon, color, is_custom as "isCustom" FROM categories WHERE user_id IS NULL OR user_id = $1';
        let params = [user.id];
        if (type) {
          sql += ' AND type = $2';
          params.push(type.toUpperCase());
        }
        sql += ' ORDER BY name ASC';
        const catRes = await query(sql, params);

        let list = catRes.rows;
        if (list.length === 0) {
          list = DEFAULT_CATEGORIES.map((c, i) => ({ id: i + 1, ...c, isCustom: false }));
          if (type) list = list.filter((c) => c.type === type.toUpperCase());
        }
        return sendResponse(res, 200, true, 'Categories retrieved successfully', list);
      } else {
        const store = getMemoryStore();
        let list = store.categories.filter((c) => c.user_id === null || c.user_id === user.id);
        if (type) list = list.filter((c) => c.type.toUpperCase() === type.toUpperCase());
        return sendResponse(
          res,
          200,
          true,
          'Categories retrieved successfully',
          list.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            icon: c.icon,
            color: c.color,
            isCustom: c.is_custom,
          }))
        );
      }
    } catch (err) {
      return sendResponse(res, 500, false, err.message);
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, type: cType, icon = 'Tag', color = '#10B981' } = req.body || {};
      if (!name || !cType) return sendResponse(res, 400, false, 'Category name and type are required');

      if (isUsingPostgres()) {
        const insertRes = await query(
          `INSERT INTO categories (name, type, icon, color, is_custom, user_id)
           VALUES ($1, $2, $3, $4, TRUE, $5)
           RETURNING id, name, type, icon, color, is_custom as "isCustom"`,
          [name.trim(), cType.toUpperCase(), icon, color, user.id]
        );
        return sendResponse(res, 200, true, 'Category created successfully', insertRes.rows[0]);
      } else {
        const store = getMemoryStore();
        const cat = {
          id: store.nextIds.categories++,
          name: name.trim(),
          type: cType.toUpperCase(),
          icon,
          color,
          is_custom: true,
          user_id: user.id,
        };
        store.categories.push(cat);
        return sendResponse(res, 200, true, 'Category created successfully', {
          id: cat.id,
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          color: cat.color,
          isCustom: true,
        });
      }
    } catch (err) {
      return sendResponse(res, 500, false, err.message);
    }
  }

  return sendResponse(res, 405, false, 'Method not allowed');
}
