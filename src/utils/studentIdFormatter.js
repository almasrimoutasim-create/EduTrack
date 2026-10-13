/**
 * Student ID Formatting Utilities
 * Provides consistent formatting for school student IDs
 */

/**
 * Format student ID to standard STU-xxxx format with leading zeros
 * @param {string|number} studentId - Raw student ID (e.g., "STU-1", "1", "0001")
 * @returns {string} Formatted student ID (e.g., "STU-0001", "STU-0042")
 */
export function formatStudentId(studentId) {
  if (!studentId) return '';
  const str = String(studentId).trim();
  // If already in STU-xxxx format, extract and reformat the numeric part
  const match = str.match(/STU-(\d+)/i);
  if (match) {
    return `STU-${match[1].padStart(4, '0')}`;
  }
  // Otherwise treat as numeric only
  const numericOnly = str.replace(/\D/g, '');
  return `STU-${numericOnly.padStart(4, '0')}`;
}

/**
 * Extract next sequential student ID — scoped per school.
 * كل مدرسة لها تسلسلها الخاص: يُحتسب الأقصى داخل نفس school_id فقط.
 * @param {Array} students - Array of student objects with student_id (+ school_id) field
 * @param {string|null} schoolId - current school id; when provided, only matching rows count
 * @returns {string} Next student ID in format "STU-0001", "STU-0002", etc.
 */
export function getNextStudentId(students = [], schoolId = null) {
  let maxNum = 0;
  const scope = schoolId !== null && schoolId !== undefined && schoolId !== ''
    ? String(schoolId)
    : null;

  students.forEach(s => {
    // عند تمرير schoolId: تُحتسب صفوف نفس المدرسة فقط (مطابق لمنطق الخادم
    // WHERE school_id = $1) — تُتجاهل صفوف المدارس الأخرى والمستقلة (NULL) نهائياً
    if (scope !== null) {
      if (s?.school_id === undefined || s?.school_id === null || String(s.school_id) !== scope) return;
    }
    // Extract numeric part from student_id (format: STU-0001)
    const match = String(s.student_id || '0').match(/STU-(\d+)/i);
    const num = match ? parseInt(match[1], 10) : 0;
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  });

  return `STU-${String(maxNum + 1).padStart(4, '0')}`;
}

/**
 * Current school id for scoping (portal_school_id / user school).
 */
export function getCurrentSchoolId(user = null) {
  try {
    if (user?.school_id) return user.school_id;
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('portal_school_id') || null;
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Fetch next scoped student ID from the server (source of truth per school),
 * with client-side fallback.
 */
export async function fetchNextSchoolStudentId(listFn, schoolId = null) {
  const scopedSchoolId = schoolId ?? getCurrentSchoolId();
  // 1) Server endpoint — يحسب التالي داخل نفس المدرسة فقط
  try {
    const apiBase = (import.meta?.env?.VITE_BACKEND_URL || '').replace(/\/$/, '');
    const url = apiBase ? `${apiBase}/neon-db/next-student-id` : '/neon-db/next-student-id';
    const headers = {};
    try {
      const token = localStorage.getItem('portal_jwt_token') || localStorage.getItem('jwt_token') || localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch { /* ignore */ }
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data?.student_id) return data.student_id;
    }
  } catch { /* fall through to client calc */ }
  // 2) Fallback: احسب من القائمة (مفلترة بنطاق المدرسة)
  try {
    const students = listFn ? await listFn() : [];
    return getNextStudentId(Array.isArray(students) ? students : [], scopedSchoolId);
  } catch {
    return `STU-0001`;
  }
}

/**
 * Validate student ID format
 * @param {string} studentId - Student ID to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidStudentId(studentId) {
  const trimmed = String(studentId || '').trim();
  if (!trimmed) return false;
  
  // Accept STU-xxxx format or numeric only (1-4 digits)
  const stuMatch = trimmed.match(/^STU-(\d+)$/i);
  if (stuMatch) {
    return stuMatch[1].length > 0 && stuMatch[1].length <= 4;
  }
  
  // Extract numbers and check if at least 1-4 digits
  const numericOnly = trimmed.replace(/\D/g, '');
  return numericOnly.length > 0 && numericOnly.length <= 4;
}

/**
 * Display format for student ID with visual separation
 * @param {string|number} studentId - Student ID
 * @returns {string} Formatted for display with icon-friendly format (e.g., "STU-0001")
 */
export function displayStudentId(studentId) {
  return formatStudentId(studentId);
}
