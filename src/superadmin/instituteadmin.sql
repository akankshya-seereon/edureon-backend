USE institute_db;

CREATE TABLE IF NOT EXISTS institute_admins (
  id             INT          NOT NULL AUTO_INCREMENT,
  institute_id   INT          NOT NULL,
  name           VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password       VARCHAR(255) NOT NULL,
  phone          VARCHAR(20)           DEFAULT NULL,
  role           VARCHAR(30)  NOT NULL DEFAULT 'institute_admin',
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  login_attempts INT          NOT NULL DEFAULT 0,
  lock_until     DATETIME              DEFAULT NULL,
  last_login     DATETIME              DEFAULT NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;