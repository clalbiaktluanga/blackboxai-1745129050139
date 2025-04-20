// In-memory data store for demo purposes

const students = [
  { id: 1, name: 'Student A', class: 'Class 1', subjects: ['Mathematics', 'Science'] },
  { id: 2, name: 'Student B', class: 'Class 1', subjects: ['Mathematics', 'Science'] },
];

const teachers = [
  { id: 1, name: 'Teacher One', assignedClasses: ['Class 1'] },
];

const classes = [
  { id: 'Class 1', teacherId: 1 },
  { id: 'Class 2', teacherId: null },
];

const subjects = [
  { id: 1, name: 'Mathematics' },
  { id: 2, name: 'Science' },
];

const attendanceRecords = [
  // { studentId, classId, date, status: 'present' | 'absent' }
];

const performanceRecords = [
  // { studentId, term1, term2, term3, periodicTests, feedback }
];

module.exports = {
  students,
  teachers,
  classes,
  subjects,
  attendanceRecords,
  performanceRecords,
};
