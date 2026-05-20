/**
 * Student ID Formatting Utilities
 * Provides consistent formatting for school student IDs
 */

/**
 * Format student ID to standard 4-digit format with leading zeros
 * @param {string|number} studentId - Raw student ID
 * @returns {string} Formatted student ID (e.g., "0001", "0042")
 */
export function formatStudentId(studentId) {
  if (!studentId) return '';
  const numericOnly = String(studentId).replace(/\D/g, '');
  return numericOnly.padStart(4, '0');
}

/**
 * Extract next sequential student ID
 * @param {Array} students - Array of student objects with student_id field
 * @returns {string} Next student ID in format "0001", "0002", etc.
 */
export function getNextStudentId(students = []) {
  let maxId = 0;
  
  students.forEach(s => {
    // Extract numeric part from student_id
    const match = String(s.student_id || '0').match(/(\d+)/);
    const num = match ? parseInt(match[0], 10) : 0;
    if (!isNaN(num) && num > maxId) {
      maxId = num;
    }
  });
  
  return String(maxId + 1).padStart(4, '0');
}

/**
 * Validate student ID format
 * @param {string} studentId - Student ID to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidStudentId(studentId) {
  const trimmed = String(studentId || '').trim();
  if (!trimmed) return false;
  
  // Extract numbers and check if at least 1-4 digits
  const numericOnly = trimmed.replace(/\D/g, '');
  return numericOnly.length > 0 && numericOnly.length <= 4;
}

/**
 * Display format for student ID with visual separation
 * @param {string|number} studentId - Student ID
 * @returns {string} Formatted for display with icon-friendly format
 */
export function displayStudentId(studentId) {
  const formatted = formatStudentId(studentId);
  // Returns "0001" format suitable for mono fonts and display
  return formatted;
}
