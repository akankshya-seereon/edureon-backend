const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const dotenv       = require('dotenv');

dotenv.config();

// Initialize Database Connection
require('./src/config/db');
 
const app = express();

app.use(helmet());
app.use(cors({
  //  FIXED: Changed fallback to 5173 to match your Vite frontend!
  origin:      process.env.CLIENT_URL || 'http://localhost:5173', 
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ==========================================
// 2. IMPORT ROUTES
// ==========================================

// --- SuperAdmin ---
const superAdminRoutes = require('./src/superadmin/routes/superAdminRoutes');
const superAdminAuthRoutes = require('./src/superadmin/routes/authRoutes');
// const superAdminInstituteRoutes = require('./src/superadmin/routes/instituteRoutes');
const instituteRoutes = require('./src/superadmin/routes/instituteRoutes'); // 🚀 Added Institute Management for SuperAdmin

// --- Institute Admin & Staff ---
const adminAuthRoutes = require('./src/instituteadmin/routes/authRoutes');
const dashboardRoutes = require('./src/instituteadmin/routes/dashboardRoutes');
const principalRoutes = require('./src/instituteadmin/routes/principalRoutes');
const infrastructureRoutes = require('./src/instituteadmin/routes/infrastructureRoutes'); // 🚀 Infrastructure
const adminAttendanceRoutes = require('./src/instituteadmin/routes/attendanceRoutes'); 
const adminFacultyRoutes = require('./src/instituteadmin/routes/facultyRoutes');
const studentRoutes = require('./src/instituteadmin/routes/studentRoutes');
const adminExamRoutes = require('./src/instituteadmin/routes/examRoutes'); 
const batchRoutes = require('./src/instituteadmin/routes/batchRoutes');
const expenseRoutes = require('./src/instituteadmin/routes/expenseRoutes');
const salaryRoutes = require('./src/instituteadmin/routes/salaryRoutes');
const feeRoutes = require('./src/instituteadmin/routes/feeRoutes');
const notificationRoutes = require('./src/instituteadmin/routes/notificationRoutes');
const reportRoutes = require('./src/instituteadmin/routes/reportRoutes');
const settingRoutes = require('./src/instituteadmin/routes/settingRoutes');
const certificateRoutes = require('./src/instituteadmin/routes/certificateRoutes');
const academicprogramRoutes = require('./src/instituteadmin/routes/academicprogramRoutes');
const departmentRoutes = require('./src/instituteadmin/routes/departmentRoutes');
const employeeRoutes = require('./src/instituteadmin/routes/employeeRoutes'); // 🚀 Added Employee
const syllabusRoutes = require('./src/instituteadmin/routes/SyllabusRoutes'); // 🚀 Added Syllabus
const classlistRoutes = require('./src/instituteadmin/routes/classlistRoutes'); // 🚀 Added ClassList
// const instituteRoutes = require('./src/superadmin/routes/instituteRoutes'); // 🚀 Added Institute Management for SuperAdmin
// --- Faculty Portal ---
const facultyAuthRoutes = require('./src/faculty/routes/authRoutes');
const profileRoutes = require('./src/faculty/routes/profileRoutes');
const facultyClassRoutes = require('./src/faculty/routes/classRoutes');
const facultyAttendanceRoute = require('./src/faculty/routes/attendanceRoute');
const facultyRoutes = require('./src/faculty/routes/facultyRoutes'); 
const facultyExamRoutes = require('./src/faculty/routes/examRoutes'); 
const facultyNotificationRoutes = require('./src/faculty/routes/notificationRoutes'); 

// --- Student Portal ---
const studentAuthRoutes = require('./src/student/routes/authRoutes');
const studentDashboardRoutes = require('./src/student/routes/dashboardRoutes'); 
const studentProfileRoutes = require('./src/student/routes/profileRoutes');
const courseRoutes = require('./src/student/routes/courseRoutes'); 
const studentAttendanceRoutes = require('./src/student/routes/attendanceRoutes');
const studentAssignmentRoutes = require('./src/student/routes/assignmentRoutes');
const studentExamRoutes = require('./src/student/routes/examRoutes'); 
const studentFeeRoutes = require('./src/student/routes/feeRoutes');
const studentCertificateRoutes = require('./src/student/routes/certificateRoutes');


// ==========================================
// 3. MOUNT ROUTES
// ==========================================

// --- SuperAdmin Mounting ---
app.use('/api/superadmin/auth', superAdminAuthRoutes);
app.use('/api/superadmin', superAdminRoutes);
// app.use('/api/superadmin/institutes', superAdminInstituteRoutes);
app.use('/api/superadmin/institutes', instituteRoutes); // 🚀 Mounted Institute Management for SuperAdmin
// --- Admin / Staff Mounting ---
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/dashboard', dashboardRoutes); 
app.use('/api/admin/institutes', instituteRoutes);
app.use('/api/admin/principal', principalRoutes);
app.use('/api/admin/infrastructure', infrastructureRoutes); // 🚀 Infrastructure Mount
app.use('/api/admin/attendance', adminAttendanceRoutes);
app.use('/api/admin/faculty', adminFacultyRoutes);
app.use('/api/admin/students', studentRoutes);
app.use('/api/admin/batches', batchRoutes);
app.use('/api/admin/expenses', expenseRoutes);
app.use('/api/admin/salary', salaryRoutes);
app.use('/api/admin/fees', feeRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/admin/reports', reportRoutes);
app.use('/api/admin/settings', settingRoutes);
app.use('/api/admin/exams', adminExamRoutes);
app.use('/api/admin/certificates', certificateRoutes);
app.use('/api/admin/classes', classlistRoutes); // 🚀 Mounted ClassLis            t
app.use('/api/admin/programs', academicprogramRoutes);
app.use('/api/admin/departments', departmentRoutes);
app.use('/api/admin/employees', employeeRoutes); // 🚀 Mounted Employee
app.use('/api/admin/syllabus', syllabusRoutes); // 🚀 Mounted Syllabus

// --- Faculty Mounting ---
app.use('/api/faculty/auth', facultyAuthRoutes);
app.use('/api/faculty/profile', profileRoutes);
app.use('/api/faculty/classes', facultyClassRoutes); 
app.use('/api/faculty/attendance', facultyAttendanceRoute);
app.use('/api/faculty/exams', facultyExamRoutes); 
app.use('/api/faculty/notifications', facultyNotificationRoutes); 
app.use('/api/faculty', facultyRoutes);

// --- Student Mounting ---
app.use('/api/student/auth', studentAuthRoutes);
app.use('/api/student/profile', studentProfileRoutes);     
app.use('/api/student/dashboard', studentDashboardRoutes);
app.use('/api/student/courses', courseRoutes);
app.use('/api/student/assignments', studentAssignmentRoutes);
app.use('/api/student/exams', studentExamRoutes); 
app.use('/api/student/fees', studentFeeRoutes);
app.use('/api/student/certificates', studentCertificateRoutes);
app.use('/api/attendance', studentAttendanceRoutes); // Note: Shared path logic

app.use('/uploads', express.static('uploads'));

// ==========================================
// 4. UTILITY ROUTES
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success:     true,
    message:     'LMS API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp:   new Date().toISOString(),
  });
});

// 404 Route Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error Stack:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});


// ==========================================
// 5. START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n Server successfully launched on http://localhost:${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Database connected to: institute_db\n`);
});