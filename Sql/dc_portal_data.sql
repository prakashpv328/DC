/*
 Navicat Premium Dump SQL

 Source Server         : local_sql
 Source Server Type    : MySQL
 Source Server Version : 80043 (8.0.43)
 Source Host           : localhost:3306
 Source Schema         : dc_portal

 Target Server Type    : MySQL
 Target Server Version : 80043 (8.0.43)
 File Encoding         : 65001

 Date: 02/04/2026 14:41:00
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for faculty_logger
-- ----------------------------
DROP TABLE IF EXISTS `faculty_logger`;
CREATE TABLE `faculty_logger`  (
  `complaint_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `student_id` int NOT NULL,
  `faculty_id` int NOT NULL,
  `complaint` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `venue` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `date_time` datetime NOT NULL,
  `status` enum('pending','accepted','rejected','resolved') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending',
  `meeting_alloted` enum('yes','no') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `revoke_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  PRIMARY KEY (`complaint_id`) USING BTREE,
  INDEX `student_id`(`student_id` ASC) USING BTREE,
  INDEX `faculty_id`(`faculty_id` ASC) USING BTREE,
  CONSTRAINT `faculty_logger_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `faculty_logger_ibfk_2` FOREIGN KEY (`faculty_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of faculty_logger
-- ----------------------------
INSERT INTO `faculty_logger` VALUES ('CMP-01J3C2', 1, 9, 'Id not wearing ', 'Cafe', '2025-12-23 15:10:11', 'resolved', NULL, NULL);
INSERT INTO `faculty_logger` VALUES ('CMP-2C1ZD3', 7, 9, 'Yes', 'Ib', '2025-12-23 10:14:06', 'rejected', 'yes', 'Yes');
INSERT INTO `faculty_logger` VALUES ('CMP-3KL8VN', 7, 9, 'Asd', 'Dc', '2025-12-24 08:16:51', 'rejected', 'yes', 'Please');
INSERT INTO `faculty_logger` VALUES ('CMP-3L41FN', 7, 9, 'Hnn', 'Uj', '2025-12-23 21:05:56', 'accepted', NULL, 'null');
INSERT INTO `faculty_logger` VALUES ('CMP-57SO1T', 8, 9, 'Ihh', 'Ol', '2025-12-23 10:34:17', 'rejected', 'yes', 'Ni');
INSERT INTO `faculty_logger` VALUES ('CMP-61AK54', 1, 9, 'Erty', 'Lc', '2025-12-26 11:53:53', 'pending', NULL, NULL);
INSERT INTO `faculty_logger` VALUES ('CMP-6248HT', 12, 9, 'Food wasting', 'Mess', '2025-12-26 15:41:12', 'resolved', NULL, NULL);
INSERT INTO `faculty_logger` VALUES ('CMP-763N2R', 12, 9, 'No id', 'Lv', '2025-12-27 15:25:11', 'resolved', 'yes', 'No');
INSERT INTO `faculty_logger` VALUES ('CMP-846V2U', 8, 10, 'Yes', 'As', '2025-12-23 10:11:38', 'rejected', 'yes', 'Nono');
INSERT INTO `faculty_logger` VALUES ('CMP-8G2ECN', 12, 9, 'No id', 'Lc', '2025-12-26 12:21:17', 'accepted', NULL, 'null');
INSERT INTO `faculty_logger` VALUES ('CMP-8WI4T0', 12, 9, 'No id', 'Lc', '2025-12-27 15:33:40', 'rejected', 'yes', 'No');
INSERT INTO `faculty_logger` VALUES ('CMP-9YA45F', 12, 9, 'Bnjsns', 'Jsns', '2025-12-27 08:47:34', 'pending', NULL, NULL);
INSERT INTO `faculty_logger` VALUES ('CMP-BT7310', 7, 9, 'Tth', 'Hj', '2025-12-27 08:47:13', 'pending', NULL, NULL);
INSERT INTO `faculty_logger` VALUES ('CMP-HSGQ41', 12, 9, 'Qet', 'Mech', '2025-12-26 12:21:52', 'resolved', 'yes', 'No I am bot');
INSERT INTO `faculty_logger` VALUES ('CMP-JIW1Z9', 8, 9, 'Fhh', 'Jg', '2025-12-26 15:37:48', 'rejected', 'yes', 'No');
INSERT INTO `faculty_logger` VALUES ('CMP-K0VYA3', 7, 9, 'Tty', 'Rt', '2025-12-23 21:06:36', 'accepted', NULL, 'null');
INSERT INTO `faculty_logger` VALUES ('CMP-MFQH48', 7, 9, 'Qwe', 'K', '2025-12-23 10:18:43', 'rejected', 'yes', 'Yes');
INSERT INTO `faculty_logger` VALUES ('CMP-Q7431Y', 7, 9, 'No id in college', 'Lc', '2025-12-23 09:29:21', 'resolved', NULL, 'null');
INSERT INTO `faculty_logger` VALUES ('CMP-QJR17H', 7, 10, 'Hbgh', 'Uu', '2025-12-23 11:52:37', 'resolved', 'yes', 'Qer');
INSERT INTO `faculty_logger` VALUES ('CMP-S81MI9', 17, 9, 'No id', 'Lc', '2025-12-26 12:12:28', 'pending', NULL, NULL);
INSERT INTO `faculty_logger` VALUES ('CMP-SDM327', 8, 10, 'Wert', 'Ty', '2025-12-23 12:02:00', 'pending', NULL, NULL);
INSERT INTO `faculty_logger` VALUES ('CMP-T5E986', 8, 9, 'No dress code', 'Me', '2025-12-23 09:41:14', 'rejected', 'yes', 'No I am not');

-- ----------------------------
-- Table structure for meetings
-- ----------------------------
DROP TABLE IF EXISTS `meetings`;
CREATE TABLE `meetings`  (
  `meeting_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `complaint_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `admin_id` int NOT NULL,
  `venue` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `date_time` datetime NOT NULL,
  `info` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `attendance` enum('present','absent','scheduled') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'scheduled',
  `faculty_id` int NOT NULL,
  `student_id` int NOT NULL,
  PRIMARY KEY (`meeting_id`) USING BTREE,
  INDEX `complaint_id`(`complaint_id` ASC) USING BTREE,
  INDEX `admin_id`(`admin_id` ASC) USING BTREE,
  INDEX `faculty_id`(`faculty_id` ASC) USING BTREE,
  INDEX `student_id`(`student_id` ASC) USING BTREE,
  CONSTRAINT `meetings_ibfk_1` FOREIGN KEY (`complaint_id`) REFERENCES `faculty_logger` (`complaint_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `meetings_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `meetings_ibfk_3` FOREIGN KEY (`faculty_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `meetings_ibfk_4` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of meetings
-- ----------------------------
INSERT INTO `meetings` VALUES ('MEET-0FYN', 'CMP-3KL8VN', 11, 'Lc', '2025-12-27 09:14:00', 'Wdf', 'absent', 9, 7);
INSERT INTO `meetings` VALUES ('MEET-15GQ', 'CMP-763N2R', 11, 'Lc', '2025-12-27 15:29:00', 'Proof', 'present', 9, 12);
INSERT INTO `meetings` VALUES ('MEET-17QO', 'CMP-8WI4T0', 11, 'Lc', '2025-12-27 15:40:00', 'Proof', 'scheduled', 9, 12);
INSERT INTO `meetings` VALUES ('MEET-6AYS', 'CMP-2C1ZD3', 11, 'Oskns', '2025-12-23 10:17:44', 'Jsjns', 'absent', 9, 7);
INSERT INTO `meetings` VALUES ('MEET-6I57', 'CMP-T5E986', 11, 'Fg', '2025-12-23 10:31:54', 'Gshhs', 'absent', 9, 8);
INSERT INTO `meetings` VALUES ('MEET-90XR', 'CMP-HSGQ41', 11, 'Lc', '2025-12-26 12:22:22', 'Proof', 'present', 9, 12);
INSERT INTO `meetings` VALUES ('MEET-HUS8', 'CMP-846V2U', 11, 'Lc', '2025-12-23 10:12:06', 'Proof', 'absent', 10, 8);
INSERT INTO `meetings` VALUES ('MEET-J0G3', 'CMP-57SO1T', 11, 'Sd', '2025-12-24 10:30:00', 'Asdf', 'absent', 9, 8);
INSERT INTO `meetings` VALUES ('MEET-MZ10', 'CMP-QJR17H', 11, 'Yu', '2025-12-24 10:27:00', 'Qwdg', 'present', 10, 7);
INSERT INTO `meetings` VALUES ('MEET-NVT5', 'CMP-JIW1Z9', 11, 'Gh', '2025-12-26 15:38:07', 'Fgv', 'absent', 9, 8);
INSERT INTO `meetings` VALUES ('MEET-X7YK', 'CMP-MFQH48', 11, 'Lc', '2025-12-23 10:29:05', 'Ksks', 'absent', 9, 7);

-- ----------------------------
-- Table structure for roles
-- ----------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles`  (
  `role_id` int NOT NULL,
  `role_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`role_id`) USING BTREE,
  UNIQUE INDEX `uq_roles_role_name`(`role_name` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of roles
-- ----------------------------
INSERT INTO `roles` VALUES (3, 'admin');
INSERT INTO `roles` VALUES (1, 'student');
INSERT INTO `roles` VALUES (2, 'teacher');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `emailId` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `google_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `reg_num` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `role_id` int NOT NULL,
  `department` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `year` int NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`) USING BTREE,
  UNIQUE INDEX `emailId`(`emailId` ASC) USING BTREE,
  UNIQUE INDEX `google_id`(`google_id` ASC) USING BTREE,
  INDEX `idx_users_role_id`(`role_id` ASC) USING BTREE,
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 18 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'Prakash', 'prakash@student.com', NULL, '123456', '22CS101', 1, 'CSE', 3);
INSERT INTO `users` VALUES (2, 'Arjun', 'arjun@student.com', NULL, '123456', '22CS102', 1, 'CSE', 2);
INSERT INTO `users` VALUES (3, 'Dr. Kumar', 'kumar@faculty.com', NULL, '123456', NULL, 2, 'CSE', NULL);
INSERT INTO `users` VALUES (4, 'Dr. Meena', 'meena@faculty.com', NULL, '123456', NULL, 2, 'ECE', NULL);
INSERT INTO `users` VALUES (5, 'Admin User', 'admin@college.com', NULL, '123456', NULL, 3, 'ADMIN', NULL);
INSERT INTO `users` VALUES (6, 'Rithish', 'rithish@student.com', NULL, '1234', '22CS103', 1, 'CSE', 2);
INSERT INTO `users` VALUES (7, 'Prakash', 'pra', NULL, '1234', '22CS1', 1, 'ECE', 2);
INSERT INTO `users` VALUES (8, 'Rithish', 'rit', NULL, '1234', '22CS2', 1, 'CSE', 3);
INSERT INTO `users` VALUES (9, 'Mathan', 'mat', NULL, '1234', NULL, 2, 'ECE', NULL);
INSERT INTO `users` VALUES (10, 'Rathish', 'rat', NULL, '1234', NULL, 2, 'CSE', NULL);
INSERT INTO `users` VALUES (11, 'Surya', 'sur', NULL, '1234', NULL, 3, 'CSE', NULL);
INSERT INTO `users` VALUES (12, 'PRAKASH P V', 'prakashpv.cs24@bitsathy.ac.in', '108631631653226473811', 'google_auth_108631631653226473811', '7376241CS322', 1, 'CSE', 2);
INSERT INTO `users` VALUES (13, 'RATHISH S', 'rathishs.cs24@bitsathy.ac.in', '104657269095007417988', 'google_auth_104657269095007417988', '1234', 1, 'CSE', 2);
INSERT INTO `users` VALUES (16, 'SURYA G P', 'suryagp.cs24@bitsathy.ac.in', '111379179288133832516', NULL, '1234', 1, 'CSE', 2);
INSERT INTO `users` VALUES (17, 'sanjeevi rajan ramajayam', 'sanjeenrajanramajayam.cs24@bitsathy.ac.in', NULL, NULL, '7376241cs364', 1, 'ECE', 3);

SET FOREIGN_KEY_CHECKS = 1;
