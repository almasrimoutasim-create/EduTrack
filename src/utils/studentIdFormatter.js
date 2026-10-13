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
 * Extract next sequential student ID
 * @param {Array} students - Array of student objects with student_id field
 * @returns {string} Next student ID in format "STU-0001", "STU-0002", etc.
 */
export function getNextStudentId(students = []) {
  let maxNum = 0;
  
  students.forEach(s => {
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
