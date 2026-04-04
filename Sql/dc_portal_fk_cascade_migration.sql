-- DC Portal foreign key migration
-- 1) Cleans orphan rows that would block foreign key creation
-- 2) Adds CASCADE delete/update rules to the existing relationships

SET FOREIGN_KEY_CHECKS = 0;

START TRANSACTION;

-- Remove orphan rows from faculty_logger where the referenced user no longer exists
DELETE fl
FROM faculty_logger fl
LEFT JOIN users s ON s.user_id = fl.student_id
WHERE s.user_id IS NULL;

DELETE fl
FROM faculty_logger fl
LEFT JOIN users f ON f.user_id = fl.faculty_id
WHERE f.user_id IS NULL;

-- Remove orphan rows from meetings where the referenced rows no longer exist
DELETE m
FROM meetings m
LEFT JOIN faculty_logger fl ON fl.complaint_id = m.complaint_id
WHERE fl.complaint_id IS NULL;

DELETE m
FROM meetings m
LEFT JOIN users a ON a.user_id = m.admin_id
WHERE a.user_id IS NULL;

DELETE m
FROM meetings m
LEFT JOIN users f ON f.user_id = m.faculty_id
WHERE f.user_id IS NULL;

DELETE m
FROM meetings m
LEFT JOIN users s ON s.user_id = m.student_id
WHERE s.user_id IS NULL;

-- Optional cleanup for users.role_id if role rows were removed
DELETE u
FROM users u
LEFT JOIN roles r ON r.role_id = u.role_id
WHERE r.role_id IS NULL;

-- Drop existing foreign keys only if they exist
SET @schema_name = DATABASE();

SELECT CONCAT('ALTER TABLE `faculty_logger` ', GROUP_CONCAT(CONCAT('DROP FOREIGN KEY `', constraint_name, '`') SEPARATOR ', '), ';')
INTO @sql_fk
FROM information_schema.table_constraints
WHERE table_schema = @schema_name
  AND table_name = 'faculty_logger'
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name IN ('faculty_logger_ibfk_1', 'faculty_logger_ibfk_2');

SET @sql_fk = IFNULL(@sql_fk, 'SELECT 1;');
PREPARE stmt FROM @sql_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT CONCAT('ALTER TABLE `meetings` ', GROUP_CONCAT(CONCAT('DROP FOREIGN KEY `', constraint_name, '`') SEPARATOR ', '), ';')
INTO @sql_fk
FROM information_schema.table_constraints
WHERE table_schema = @schema_name
  AND table_name = 'meetings'
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name IN ('meetings_ibfk_1', 'meetings_ibfk_2', 'meetings_ibfk_3', 'meetings_ibfk_4');

SET @sql_fk = IFNULL(@sql_fk, 'SELECT 1;');
PREPARE stmt FROM @sql_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT CONCAT('ALTER TABLE `users` ', GROUP_CONCAT(CONCAT('DROP FOREIGN KEY `', constraint_name, '`') SEPARATOR ', '), ';')
INTO @sql_fk
FROM information_schema.table_constraints
WHERE table_schema = @schema_name
  AND table_name = 'users'
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name = 'fk_users_role';

SET @sql_fk = IFNULL(@sql_fk, 'SELECT 1;');
PREPARE stmt FROM @sql_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Recreate foreign keys with cascade rules
ALTER TABLE faculty_logger
  ADD CONSTRAINT faculty_logger_ibfk_1
    FOREIGN KEY (student_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT faculty_logger_ibfk_2
    FOREIGN KEY (faculty_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE meetings
  ADD CONSTRAINT meetings_ibfk_1
    FOREIGN KEY (complaint_id) REFERENCES faculty_logger(complaint_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT meetings_ibfk_2
    FOREIGN KEY (admin_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT meetings_ibfk_3
    FOREIGN KEY (faculty_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT meetings_ibfk_4
    FOREIGN KEY (student_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE users
  ADD CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
    ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
