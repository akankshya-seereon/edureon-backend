-- 1. Departments (The parent)
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_code VARCHAR(50) NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(20),
    head VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Courses (Linked to Department)
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_code VARCHAR(50) NOT NULL,
    department_id INT NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    course_code VARCHAR(20),
    type VARCHAR(20),
    duration VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- 3. Syllabi (Linked to Course)
CREATE TABLE syllabi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_code VARCHAR(50) NOT NULL,
    course_id INT NOT NULL,
    syllabus_name VARCHAR(100) NOT NULL,
    semester INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 4. Subjects (Linked to Syllabus)
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institute_code VARCHAR(50) NOT NULL,
    syllabus_id INT NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(50),
    credits INT,
    topics JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (syllabus_id) REFERENCES syllabi(id) ON DELETE CASCADE
);