// صلاحيات نظام الإرشاد الطلابي
export const canCreateCase = (role) => 
  ['teacher', 'admin'].includes(role);

export const canAddAssessment = (role) => 
  ['teacher', 'admin', 'counselor'].includes(role);

export const canAddFollowUp = (role) => 
  ['teacher', 'admin', 'counselor'].includes(role);

export const canCreatePlan = (role) => 
  ['admin', 'counselor'].includes(role);

export const canCloseCase = (role) => 
  role === 'admin';

export const canViewFullCase = (role) => 
  ['teacher', 'admin', 'counselor'].includes(role);

// فلترة بيانات الحالة لعرض ولي الأمر فقط
export const getParentSafeCase = (caseData, latestPlan) => ({
  id: caseData.id,
  status: caseData.status,
  risk_level: caseData.risk_level,
  updated_at: caseData.updated_at,
  recommendation: latestPlan?.goal_text || null,
});

// ألوان مستوى الخطورة لـ UI
export const riskLevelConfig = {
  low:      { label: 'منخفض',  color: 'green',  badge: 'bg-emerald-100 text-emerald-700' },
  medium:   { label: 'متوسط',  color: 'gold',   badge: 'bg-amber-100 text-amber-700' },
  high:     { label: 'مرتفع',  color: 'red',    badge: 'bg-red-100 text-red-700' },
  critical: { label: 'حرج',    color: 'purple', badge: 'bg-purple-100 text-purple-700' },
};

export const statusConfig = {
  open:       { label: 'مفتوحة',        badge: 'bg-blue-100 text-blue-700' },
  monitoring: { label: 'تحت المتابعة',  badge: 'bg-amber-100 text-amber-700' },
  closed:     { label: 'مغلقة',         badge: 'bg-stone-100 text-stone-600' },
};

export const progressConfig = {
  improving: { label: 'تحسن',     color: 'text-emerald-600', icon: '↑' },
  stable:    { label: 'مستقر',    color: 'text-amber-600',   icon: '→' },
  declining: { label: 'تراجع',    color: 'text-red-600',     icon: '↓' },
};
