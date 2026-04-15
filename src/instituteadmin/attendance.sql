CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_code VARCHAR(50) NOT NULL,
    user_id INT NOT NULL,
    user_type ENUM('institute_admin', 'faculty', 'student') NOT NULL,
    date DATE NOT NULL,
    punch_in VARCHAR(5) DEFAULT NULL,    -- Stores time like '09:30'
    punch_out VARCHAR(5) DEFAULT NULL,   -- Stores time like '18:30'
    status VARCHAR(20) DEFAULT 'Absent', -- Pending, Present, Late, Absent, Rejected
    approved_by VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- This ensures a user only has ONE attendance record per day
    UNIQUE KEY unique_attendance_per_day (institute_code, user_id, user_type, date)
);