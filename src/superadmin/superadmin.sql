USE institute_db;

CREATE TABLE IF NOT EXISTS superadmins (
  id             INT          NOT NULL AUTO_INCREMENT,
  name           VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password       VARCHAR(255) NOT NULL,
  role           VARCHAR(20)  NOT NULL DEFAULT 'superadmin',
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  login_attempts INT          NOT NULL DEFAULT 0,
  lock_until     DATETIME              DEFAULT NULL,
  last_login     DATETIME              DEFAULT NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;