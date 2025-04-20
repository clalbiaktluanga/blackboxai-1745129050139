const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

const path = require('path');

app.use(cors());
app.use(bodyParser.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../kids-den-school')));

// In-memory data store for demo
const users = [
  { id: 1, username: 'admin1', password: 'adminpass', role: 'admin' },
  { id: 2, username: 'teacher1', password: 'teacherpass', role: 'teacher' },
  { id: 3, username: 'student1', password: 'studentpass', role: 'student' },
];

const {
  students,
  teachers,
  classes,
  subjects,
  attendanceRecords,
  performanceRecords,
} = require('./data');

// Middleware for role-based access
function authorizeRole(role) {
  return (req, res, next) => {
    const user = req.user;
    if (user && user.role === role) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }
  };
}

// Simple authentication middleware (for demo, no JWT)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    // Return user info without password
    const { password, ...userInfo } = user;
    res.json({ success: true, user: userInfo });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Middleware to simulate user authentication from request header (for demo)
app.use((req, res, next) => {
  const username = req.headers['x-username'];
  if (username) {
    const user = users.find(u => u.username === username);
    if (user) {
      req.user = user;
    }
  }
  next();
});

// Admin routes for managing students
app.get('/api/admin/students', authorizeRole('admin'), (req, res) => {
  res.json(students);
});

app.post('/api/admin/students', authorizeRole('admin'), (req, res) => {
  const { name, class: className, subjects: studentSubjects } = req.body;
  if (!name || !className || !studentSubjects) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const newStudent = {
    id: students.length ? students[students.length - 1].id + 1 : 1,
    name,
    class: className,
    subjects: studentSubjects,
  };
  students.push(newStudent);
  res.status(201).json(newStudent);
});

app.put('/api/admin/students/:id', authorizeRole('admin'), (req, res) => {
  const studentId = parseInt(req.params.id);
  const student = students.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }
  const { name, class: className, subjects: studentSubjects } = req.body;
  if (name) student.name = name;
  if (className) student.class = className;
  if (studentSubjects) student.subjects = studentSubjects;
  res.json(student);
});

app.delete('/api/admin/students/:id', authorizeRole('admin'), (req, res) => {
  const studentId = parseInt(req.params.id);
  const index = students.findIndex(s => s.id === studentId);
  if (index === -1) {
    return res.status(404).json({ message: 'Student not found' });
  }
  students.splice(index, 1);
  res.status(204).send();
});

// Teacher routes
app.get('/api/teacher/classes', authorizeRole('teacher'), (req, res) => {
  const teacher = teachers.find(t => t.id === req.user.id);
  if (!teacher) {
    return res.status(404).json({ message: 'Teacher not found' });
  }
  res.json(teacher.assignedClasses);
});

app.get('/api/teacher/students/:classId', authorizeRole('teacher'), (req, res) => {
  const classId = req.params.classId;
  const classStudents = students.filter(s => s.class === classId);
  res.json(classStudents);
});

app.post('/api/teacher/attendance', authorizeRole('teacher'), (req, res) => {
  const { studentId, classId, date, status } = req.body;
  if (!studentId || !classId || !date || !status) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  // Remove existing record for same student, class, date
  const index = attendanceRecords.findIndex(
    r => r.studentId === studentId && r.classId === classId && r.date === date
  );
  if (index !== -1) {
    attendanceRecords.splice(index, 1);
  }
  attendanceRecords.push({ studentId, classId, date, status });
  res.status(201).json({ message: 'Attendance recorded' });
});

app.get('/api/teacher/performance/:studentId', authorizeRole('teacher'), (req, res) => {
  const studentId = parseInt(req.params.studentId);
  const record = performanceRecords.find(r => r.studentId === studentId);
  if (!record) {
    return res.status(404).json({ message: 'Performance record not found' });
  }
  res.json(record);
});

app.post('/api/teacher/performance', authorizeRole('teacher'), (req, res) => {
  const { studentId, term1, term2, term3, periodicTests, feedback } = req.body;
  if (!studentId) {
    return res.status(400).json({ message: 'Missing studentId' });
  }
  let record = performanceRecords.find(r => r.studentId === studentId);
  if (!record) {
    record = { studentId, term1, term2, term3, periodicTests, feedback };
    performanceRecords.push(record);
  } else {
    if (term1 !== undefined) record.term1 = term1;
    if (term2 !== undefined) record.term2 = term2;
    if (term3 !== undefined) record.term3 = term3;
    if (periodicTests !== undefined) record.periodicTests = periodicTests;
    if (feedback !== undefined) record.feedback = feedback;
  }
  res.json(record);
});

app.get('/api/teacher/attendance-report/:classId', authorizeRole('teacher'), (req, res) => {
  const classId = req.params.classId;
  const records = attendanceRecords.filter(r => r.classId === classId);
  res.json(records);
});

// Student routes
app.get('/api/student/academic-records', authorizeRole('student'), (req, res) => {
  const student = students.find(s => s.id === req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }
  const performance = performanceRecords.find(r => r.studentId === student.id) || {};
  res.json({
    student,
    performance,
  });
});

app.get('/api/student/attendance', authorizeRole('student'), (req, res) => {
  const studentId = req.user.id;
  const records = attendanceRecords.filter(r => r.studentId === studentId);
  res.json(records);
});

app.get('/api/student/feedback', authorizeRole('student'), (req, res) => {
  const studentId = req.user.id;
  const performance = performanceRecords.find(r => r.studentId === studentId);
  if (!performance || !performance.feedback) {
    return res.json({ feedback: [] });
  }
  res.json({ feedback: performance.feedback });
});

app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});
