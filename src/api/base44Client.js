/**
 * base44Client.js
 * 
 * Compatibility shim — يحاكي واجهة Base44 القديمة
 * لكنه يوجّه كل العمليات إلى dbClient (Neon PostgreSQL)
 * 
 * جميع الصفحات تستمر في استخدام:
 *   base44.entities.EntityName.list/create/update/delete/filter/get
 * دون أي تغيير.
 */
import dbClient from '@/api/dbClient';

const base44 = {
  entities: dbClient,
  auth: {
    me: async () => ({
      email: 'admin@example.com',
      full_name: 'Admin User',
      role: 'admin',
      id: 'admin-id',
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      disabled: false,
      is_verified: true
    }),
    logout: async () => {
      console.log('Logout');
    }
  }
};

export { base44 };
export default base44;