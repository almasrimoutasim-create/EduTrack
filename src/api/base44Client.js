/**
 * Base44 Client - Now connected to Neon PostgreSQL
 * 
 * This file re-exports the database client with the same API interface
 * that all pages expect (base44.entities.EntityName.list/create/update/delete).
 * 
 * The original base44 SDK is kept as a fallback for auth-related functions.
 */

import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import dbClient from '@/api/dbClient';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Keep the original base44 client for auth and other SDK features
const base44Instance = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: 'https://api-mock.base44.io', // Use a mock URL to avoid local proxy loops
  requiresAuth: false,
  appBaseUrl
});

// Use a Proxy or simple assignment to ensure entities are always handled by our dbClient
const base44 = new Proxy(base44Instance, {
  get(target, prop) {
    if (prop === 'entities') {
      return dbClient;
    }
    if (prop === 'auth') {
      return {
        ...target.auth,
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
        logout: async () => { console.log('Mock logout'); }
      };
    }
    return target[prop];
  }
});

export { base44 };
export default base44;
