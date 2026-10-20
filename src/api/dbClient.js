/**
 * Database client that provides the same API interface as base44.entities
 * All CRUD operations go through the Vite dev server API middleware
 * which connects to Neon PostgreSQL.
 */

// @ts-ignore
const BACKEND = import.meta.env.VITE_BACKEND_URL || '';
const API_BASE = BACKEND
  ? `${BACKEND.replace(/\/$/, '')}/neon-db/entities`
  : '/neon-db/entities';

// Warn once in dev if backend URL is missing (common cause of "Failed to fetch")
if (typeof window !== 'undefined' && !BACKEND && import.meta.env.DEV) {
  console.warn('[dbClient] VITE_BACKEND_URL is not set; API calls will use relative /neon-db/entities (requires Vite dev server).');
}

class EntityClient {
  constructor(entityName) {
    this.entityName = entityName;
    this.baseUrl = `${API_BASE}/${entityName}`;
  }

  getHeaders() {
    const token = localStorage.getItem('portal_jwt_token') || localStorage.getItem('jwt_token') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    // Founder JWT is attached ONLY on founder routes — never leaks into school/portal sessions sharing a browser
    // Founder-only entities are managed exclusively from the founder dashboard.
    // Attach the founder JWT for these whenever a founder session exists, so
    // the lists (Schools, RegistrationRequests, ...) never come back empty
    // because of a missed pathname check. School/portal sessions do not set
    // founder_auth, so their requests stay unprivileged.
    const FOUNDER_ENTITIES = new Set(['School', 'SchoolBranch', 'RegistrationRequest', 'SystemAdmin', 'Teacher', 'Student']);
    // Founder token is attached ONLY when actually browsing the founder dashboard.
    // Otherwise a leftover founder session in the same browser would make
    // school/portal pages fetch ALL records (cross-school leak).
    const isFounderRoute = typeof window !== 'undefined'
      && (window.location.pathname.startsWith('/founder') || window.location.pathname.startsWith('/founder-dashboard'));
    const isFounderSession = isFounderRoute
      && typeof window !== 'undefined'
      && localStorage.getItem('founder_auth') === 'true'
      && FOUNDER_ENTITIES.has(this.entityName);
    const founderToken = isFounderSession ? localStorage.getItem('founder_token') : null;
    /** @type {Record<string, string>} */
    const headers = {};
    if (founderToken) {
      headers['Authorization'] = `Bearer ${founderToken}`;
    } else if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const activeBranchId = typeof window !== 'undefined' ? localStorage.getItem('active_branch_id') : null;
    // Founder sessions must never be scoped by a leftover branch id from a
    // previous school/portal session sharing the same browser — otherwise the
    // teacher/student/requests lists come back empty.
    if (!isFounderSession && activeBranchId && activeBranchId !== 'all') {
      headers['x-branch-id'] = activeBranchId;
    }
    if (this.entityName === 'SystemSetting' || this.entityName === 'RegistrationRequest' || this.entityName === 'School' || this.entityName === 'SchoolBranch') {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  async list(order = '-created_at', filtersOrLimit = null, limitOrOffset = null, offset = null) {
    let filters = null;
    let limit = 1000;
    let finalOffset = 0;

    if (typeof filtersOrLimit === 'number') {
      limit = filtersOrLimit;
      finalOffset = typeof limitOrOffset === 'number' ? limitOrOffset : 0;
    } else if (filtersOrLimit && typeof filtersOrLimit === 'object') {
      filters = filtersOrLimit;
      limit = typeof limitOrOffset === 'number' ? limitOrOffset : 1000;
      finalOffset = typeof offset === 'number' ? offset : 0;
    } else {
      limit = typeof limitOrOffset === 'number' ? limitOrOffset : 1000;
      finalOffset = typeof offset === 'number' ? offset : 0;
    }

    const params = new URLSearchParams();
    if (order) params.set('order', order);
    if (filters) params.set('filters', JSON.stringify(filters));
    params.set('limit', limit.toString());
    params.set('offset', finalOffset.toString());

    let response;
    try {
      response = await fetch(`${this.baseUrl}?${params.toString()}`, { headers: this.getHeaders() });
    } catch (netErr) {
      console.error(`[dbClient] Network error listing ${this.entityName}:`, netErr);
      throw new Error('تعذر الاتصال بالخادم (Network/CORS). تحقق من VITE_BACKEND_URL وحالة الـ backend.');
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));

      if (response.status === 401 && this.entityName === 'SystemSetting') {
        console.warn('SystemSetting list restricted (401), returning empty array for defaults.');
        return [];
      }

      throw new Error(err.error || `Failed to list ${this.entityName} (HTTP ${response.status})`);
    }
    try {
      return await response.json();
    } catch {
      throw new Error('فشل في قراءة استجابة الخادم (Backend غير متاح أو خطأ في الـ deploy). استخدم الوضع المحلي أو أعد ضبط VITE_BACKEND_URL');
    }
  }

  async get(id) {
    const response = await fetch(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || 'Entity not found');
    }
    try {
      return await response.json();
    } catch {
      throw new Error('فشل في قراءة استجابة الخادم (Backend غير متاح أو خطأ في الـ deploy). استخدم الوضع المحلي أو أعد ضبط VITE_BACKEND_URL');
    }
  }

  async create(data) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.getHeaders() },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || 'Failed to create entity');
    }
    try {
      return await response.json();
    } catch {
      throw new Error('فشل في قراءة استجابة الخادم (Backend غير متاح أو خطأ في الـ deploy). استخدم الوضع المحلي أو أعد ضبط VITE_BACKEND_URL');
    }
  }

  async update(id, data) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...this.getHeaders() },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || 'Failed to update entity');
    }
    try {
      return await response.json();
    } catch {
      throw new Error('فشل في قراءة استجابة الخادم (Backend غير متاح أو خطأ في الـ deploy). استخدم الوضع المحلي أو أعد ضبط VITE_BACKEND_URL');
    }
  }

  async delete(id) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || 'Failed to delete entity');
    }
    try {
      return await response.json();
    } catch {
      throw new Error('فشل في قراءة استجابة الخادم (Backend غير متاح أو خطأ في الـ deploy). استخدم الوضع المحلي أو أعد ضبط VITE_BACKEND_URL');
    }
  }

  async filter(filters, order = '-created_at') {
    return this.list(order, filters);
  }
}

const entityNames = [
  'Student', 'Teacher', 'Attendance', 'Subject',
  'LibraryBook', 'FinancialRecord', 'ActivityPost',
  'ActivityComment', 'ActivityChat', 'AuditLog',
  'BusDriver', 'BusDriverReport', 'CardTopUp',
  'ClassSchedule', 'Donation', 'FriendRequest',
  'StoreItem', 'Purchase', 'StudyRoom', 'StudyGroup',
  'StudyGroupPost', 'StudyMaterial', 'StudentAward',
  'StudentGrade', 'StudentReport', 'Supervisor',
  'StaffMember', 'TeacherRating', 'TeacherTask',
  'PortalAccessConfig', 'PortalGroup', 'PortalGroupMessage',
  'PortalNotification', 'PrivateMessage', 'RoomMessage',
  'RoomVideo', 'BookReview', 'MessageReadReceipt',
  'TypingIndicator', 'Fine', 'ParentLinkRequest',
  'VirtualSession', 'SessionParticipant', 'OfficialAnnouncement',
  'CounselingCase', 'CaseAssessment', 'InterventionPlan',
  'FollowUp', 'CaseVisibilityLog',
  'FeeStructure', 'StudentFee', 'FeePayment',
  'ActivityFee', 'StudentActivityFee', 'StudentWallet',
  'WalletTransaction', 'HallRental', 'OtherRevenue',
  'Expense', 'SalaryRecord', 'PurchaseOrder', 'Visitor',
  'StaffLeave', 'StaffContract', 'StaffEvaluation', 'StaffRequest',
  'Department', 'CareerLadder', 'StoreCategory', 'SalesOrder', 'SystemSetting', 'GatewayAccount', 'SystemAdmin', 'RegistrationRequest',
  'School', 'SchoolBranch',
  'TeacherOwnStudent', 'TeacherAssignment', 'TeacherExam',
  'TeacherSubmission', 'TeacherLiveClass', 'ClassParticipant',
  'TeacherYoutubeVideo', 'TeacherSubscription', 'CurriculumBook'
];

const entities = {};
for (const name of entityNames) {
  entities[name] = new EntityClient(name);
}

// Root for /neon-db/* routes (API_BASE points at the entities sub-path).
const NEON_DB_BASE = BACKEND
  ? `${BACKEND.replace(/\/$/, '')}/neon-db`
  : '/neon-db';

/**
 * Delete a virtual class by id.
 *
 * Uses the dedicated server route (which enforces teacher-owner / admin
 * permission) instead of the generic entity DELETE, which only scopes by
 * school_id and would let a teacher remove any class in the school.
 */
export async function deleteVirtualClass(id) {
  const token = localStorage.getItem('portal_jwt_token') || localStorage.getItem('jwt_token') || localStorage.getItem('auth_token') || localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${NEON_DB_BASE}/virtual-classes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || 'Failed to delete virtual class');
  }
  try {
    return await response.json();
  } catch {
    return { success: true };
  }
}

export { entities };
export default entities;