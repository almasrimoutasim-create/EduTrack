/**
 * Database client that provides the same API interface as base44.entities
 * All CRUD operations go through the Vite dev server API middleware
 * which connects to Neon PostgreSQL.
 */

const API_BASE = '/neon-db/entities';

class EntityClient {
  constructor(entityName) {
    this.entityName = entityName;
    this.baseUrl = `${API_BASE}/${entityName}`;
  }

  async list(order = '-created_at', filtersOrLimit = null, limitOrOffset = 200, offset = 0) {
    let filters = null;
    let limit = 200;
    let finalOffset = offset;

    if (typeof filtersOrLimit === 'number') {
      limit = filtersOrLimit;
      finalOffset = typeof limitOrOffset === 'number' ? limitOrOffset : 0;
    } else if (filtersOrLimit && typeof filtersOrLimit === 'object') {
      filters = filtersOrLimit;
      limit = typeof limitOrOffset === 'number' ? limitOrOffset : 200;
    }

    const params = new URLSearchParams();
    if (order) params.set('order', order);
    if (filters) params.set('filters', JSON.stringify(filters));
    params.set('limit', limit.toString());
    params.set('offset', finalOffset.toString());

    const response = await fetch(`${this.baseUrl}?${params.toString()}`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || 'Failed to list entities');
    }
    return response.json();
  }

  async get(id) {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || 'Entity not found');
    }
    return response.json();
  }

  async create(data) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || 'Failed to create entity');
    }
    return response.json();
  }

  async update(id, data) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || 'Failed to update entity');
    }
    return response.json();
  }

  async delete(id) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || 'Failed to delete entity');
    }
    return response.json();
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
  'TypingIndicator',
];

const entities = {};
for (const name of entityNames) {
  entities[name] = new EntityClient(name);
}

export { entities };
export default entities;
