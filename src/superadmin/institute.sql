USE institute_db;

CREATE TABLE IF NOT EXISTS institutes (
  id             INT           NOT NULL AUTO_INCREMENT,
  name           VARCHAR(200)  NOT NULL,
  email          VARCHAR(150)  NOT NULL UNIQUE,
  phone          VARCHAR(20)   NOT NULL,
  address        TEXT          NOT NULL,
  city           VARCHAR(100)  NOT NULL,
  state          VARCHAR(100)  NOT NULL,
  pincode        VARCHAR(10)   NOT NULL,
  website        VARCHAR(255)  DEFAULT NULL,
  logo           VARCHAR(255)  DEFAULT NULL,
  principal_name VARCHAR(150)  NOT NULL,
  is_active      TINYINT(1)    NOT NULL DEFAULT 1,
  created_by     INT           NOT NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (created_by) REFERENCES superadmins(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;