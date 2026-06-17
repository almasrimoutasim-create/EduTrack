/**
 * Student ID System - Usage Examples
 * Examples showing how to use the student ID system
 */

import { 
  formatStudentId, 
  getNextStudentId, 
  isValidStudentId, 
  displayStudentId 
} from '@/utils/studentIdFormatter';

// ============================================
// Example 1: Format Student IDs
// ============================================
console.log('=== Example 1: Format Student IDs ===');
console.log(formatStudentId("1"));        // "0001"
console.log(formatStudentId("42"));       // "0042"
console.log(formatStudentId("123"));      // "0123"
console.log(formatStudentId("STU-05"));   // "0005"
console.log(formatStudentId("S-2024-1")); // "0001"


// ============================================
// Example 2: Get Next Sequential ID
// ============================================
console.log('\n=== Example 2: Get Next Sequential ID ===');

const mockStudents = [
  { id: '1', full_name: 'Ahmed', student_id: '0001' },
  { id: '2', full_name: 'Fatima', student_id: '0002' },
  { id: '3', full_name: 'Khalid', student_id: '0005' },  // Gap
  { id: '4', full_name: 'Layla', student_id: '1' }      // Different format
];

const nextId = getNextStudentId(mockStudents);
console.log(`Next ID should be: ${nextId}`); // "0006"

// After adding new students:
mockStudents.push({ id: '5', full_name: 'Omar', student_id: '0006' });
console.log(`Next ID after adding: ${getNextStudentId(mockStudents)}`); // "0007"


// ============================================
// Example 3: Validate Student IDs
// ============================================
console.log('\n=== Example 3: Validate Student IDs ===');

console.log(isValidStudentId("0001"));    // true
console.log(isValidStudentId("42"));      // true
console.log(isValidStudentId("1"));       // true
console.log(isValidStudentId("12345"));   // false (too long)
console.log(isValidStudentId(""));        // false (empty)
console.log(isValidStudentId("ABC"));     // false (no numbers)


// ============================================
// Example 4: Display Student IDs
// ============================================
console.log('\n=== Example 4: Display Student IDs ===');

console.log(displayStudentId("1"));       // "0001"
console.log(displayStudentId("42"));      // "0042"
console.log(displayStudentId("0001"));    // "0001"


// ============================================
// Example 5: In React Component
// ============================================
// StudentIDCard Component Usage
// <StudentIDCard 
//   studentId="42" 
//   studentName="أحمد محمد"
//   size="md"
// />

// StudentProfileCard Component Usage
// <StudentProfileCard 
//   student={{
//     id: 'student-123',
//     full_name: 'محمد أحمد',
//     student_id: '0042',
//     grade: '10',
//     section: 'A',
//     photo_url: 'https://...',
//     status: 'active'
//   }}
// />

// StudentForm Component Usage (auto-generates ID)
// const [students] = useQuery({
//   queryKey: ["students"],
//   queryFn: () => entities.Student.list()
// });
// // Auto-generates next ID: 0001, 0002, 0003, etc.


// ============================================
// Example 6: Database Insert
// ============================================
console.log('\n=== Example 6: Database Insert ===');

async function createNewStudent(formData) {
  // Get all existing students
  const existingStudents = await entities.Student.list();
  
  // Calculate next ID
  const studentId = getNextStudentId(existingStudents);
  
  // Create student with auto-generated ID
  const studentData = {
    ...formData,
    student_id: studentId,  // Automatically assigned
    status: 'active'
  };
  
  // Save to database
  const savedStudent = await entities.Student.create(studentData);
  console.log(`Student created with ID: ${savedStudent.student_id}`);
  
  return savedStudent;
}

// Usage:
// const newStudent = await createNewStudent({
//   full_name: 'محمد أحمد علي',
//   grade: '10',
//   section: 'A',
//   portal_password: 'secure123'
// });
// // Returns: { id: 'abc123', student_id: '0001', ... }


// ============================================
// Example 7: Display in Admin Dashboard
// ============================================
console.log('\n=== Example 7: Display in Admin Dashboard ===');

function renderStudentTable(students) {
  return students.map((student, index) => ({
    id: student.id,
    'الرقم المدرسي': displayStudentId(student.student_id),
    'اسم الطالب': student.full_name,
    'الصف': student.grade,
    'الفصل': student.section,
    'الحالة': student.status
  }));
}

// Example output:
// [
//   { 
//     id: '1', 
//     'الرقم المدرسي': '0001',
//     'اسم الطالب': 'أحمد محمد',
//     'الصف': '10',
//     'الفصل': 'A',
//     'الحالة': 'active'
//   },
//   ...
// ]


// ============================================
// Example 8: Search by Student ID
// ============================================
console.log('\n=== Example 8: Search by Student ID ===');

async function findStudentById(searchId) {
  // Format the search ID
  const formattedId = formatStudentId(searchId);
  
  // Search in database
  const results = await entities.Student.filter({
    student_id: formattedId
  });
  
  return results[0]; // Return first match
}

// Usage:
// const student = await findStudentById("42");
// Returns the student with ID "0042"


// ============================================
// Export Examples
// ============================================
export const examples = {
  formatStudentId,
  getNextStudentId,
  isValidStudentId,
  displayStudentId,
  createNewStudent,
  renderStudentTable,
  findStudentById
};
