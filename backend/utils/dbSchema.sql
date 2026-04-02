DROP TABLE IF EXISTS `faculty_logger`;

CREATE TABLE `faculty_logger` (
  `complaint_id` varchar(50) NOT NULL,
  `student_id` int NOT NULL,
  `faculty_id` int NOT NULL,
  `complaint` text NOT NULL,
  `venue` varchar(100) DEFAULT NULL,
  `date_time` datetime NOT NULL,
  `status` enum('pending','accepted','rejected','resolved') DEFAULT 'pending',
  `meeting_alloted` enum('yes','no') DEFAULT NULL,
  `revoke_message` text,
  PRIMARY KEY (`complaint_id`),
  KEY `student_id` (`student_id`),
  KEY `faculty_id` (`faculty_id`),
  CONSTRAINT `faculty_logger_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `faculty_logger_ibfk_2` FOREIGN KEY (`faculty_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



LOCK TABLES `faculty_logger` WRITE;

INSERT INTO `faculty_logger` VALUES ('CMP-01J3C2',1,9,'Id not wearing ','Cafe','2025-12-23 15:10:11','resolved',NULL,NULL),('CMP-2C1ZD3',7,9,'Yes','Ib','2025-12-23 10:14:06','rejected','yes','Yes'),('CMP-3KL8VN',7,9,'Asd','Dc','2025-12-24 08:16:51','rejected','yes','Please'),('CMP-3L41FN',7,9,'Hnn','Uj','2025-12-23 21:05:56','accepted',NULL,'null'),('CMP-57SO1T',8,9,'Ihh','Ol','2025-12-23 10:34:17','rejected','yes','Ni'),('CMP-61AK54',1,9,'Erty','Lc','2025-12-26 11:53:53','pending',NULL,NULL),('CMP-6248HT',12,9,'Food wasting','Mess','2025-12-26 15:41:12','resolved',NULL,NULL),('CMP-846V2U',8,10,'Yes','As','2025-12-23 10:11:38','rejected','yes','Nono'),('CMP-8G2ECN',12,9,'No id','Lc','2025-12-26 12:21:17','accepted',NULL,'null'),('CMP-9YA45F',12,9,'Bn','Jsns','2025-12-27 08:47:34','pending',NULL,NULL),('CMP-BT7310',7,9,'Tth','Hj','2025-12-27 08:47:13','pending',NULL,NULL),('CMP-HSGQ41',12,9,'Qet','Mech','2025-12-26 12:21:52','resolved','yes','No I am bot'),('CMP-JIW1Z9',8,9,'Fhh','Jg','2025-12-26 15:37:48','rejected','yes','No'),('CMP-K0VYA3',7,9,'Tty','Rt','2025-12-23 21:06:36','accepted',NULL,'null'),('CMP-MFQH48',7,9,'Qwe','K','2025-12-23 10:18:43','rejected','yes','Yes'),('CMP-Q7431Y',7,9,'No id in college','Lc','2025-12-23 09:29:21','resolved',NULL,'null'),('CMP-QJR17H',7,10,'Hbgh','Uu','2025-12-23 11:52:37','resolved','yes','Qer'),('CMP-S81MI9',17,9,'No id','Lc','2025-12-26 12:12:28','pending',NULL,NULL),('CMP-SDM327',8,10,'Wert','Ty','2025-12-23 12:02:00','pending',NULL,NULL),('CMP-T5E986',8,9,'No dress code','Me','2025-12-23 09:41:14','rejected','yes','No I am not');

UNLOCK TABLES;



DROP TABLE IF EXISTS `meetings`;

CREATE TABLE `meetings` (
  `meeting_id` varchar(50) NOT NULL,
  `complaint_id` varchar(50) NOT NULL,
  `admin_id` int NOT NULL,
  `venue` varchar(100) DEFAULT NULL,
  `date_time` datetime NOT NULL,
  `info` text,
  `attendance` enum('present','absent','scheduled') DEFAULT 'scheduled',
  `faculty_id` int NOT NULL,
  `student_id` int NOT NULL,
  PRIMARY KEY (`meeting_id`),
  KEY `complaint_id` (`complaint_id`),
  KEY `admin_id` (`admin_id`),
  KEY `faculty_id` (`faculty_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `meetings_ibfk_1` FOREIGN KEY (`complaint_id`) REFERENCES `faculty_logger` (`complaint_id`),
  CONSTRAINT `meetings_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `meetings_ibfk_3` FOREIGN KEY (`faculty_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `meetings_ibfk_4` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;




LOCK TABLES `meetings` WRITE;

INSERT INTO `meetings` VALUES ('MEET-0FYN','CMP-3KL8VN',11,'Lc','2025-12-27 09:14:00','Wdf','absent',9,7),('MEET-6AYS','CMP-2C1ZD3',11,'Oskns','2025-12-23 10:17:44','Jsjns','absent',9,7),('MEET-6I57','CMP-T5E986',11,'Fg','2025-12-23 10:31:54','Gshhs','absent',9,8),('MEET-90XR','CMP-HSGQ41',11,'Lc','2025-12-26 12:22:22','Proof','present',9,12),('MEET-HUS8','CMP-846V2U',11,'Lc','2025-12-23 10:12:06','Proof','absent',10,8),('MEET-J0G3','CMP-57SO1T',11,'Sd','2025-12-24 10:30:00','Asdf','absent',9,8),('MEET-MZ10','CMP-QJR17H',11,'Yu','2025-12-24 10:27:00','Qwdg','present',10,7),('MEET-NVT5','CMP-JIW1Z9',11,'Gh','2025-12-26 15:38:07','Fgv','absent',9,8),('MEET-X7YK','CMP-MFQH48',11,'Lc','2025-12-23 10:29:05','Ksks','absent',9,7);

UNLOCK TABLES;


DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `emailId` varchar(100) NOT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `reg_num` varchar(50) DEFAULT NULL,
  `role_id` int NOT NULL,
  `department` varchar(50) DEFAULT NULL,
  `year` int DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `emailId` (`emailId`),
  UNIQUE KEY `google_id` (`google_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `users` WRITE;

INSERT INTO `users` VALUES (1,'Prakash','prakash@student.com',NULL,'123456','22CS101',1,'CSE',3),(2,'Arjun','arjun@student.com',NULL,'123456','22CS102',1,'CSE',2),(3,'Dr. Kumar','kumar@faculty.com',NULL,'123456',NULL,2,'CSE',NULL),(4,'Dr. Meena','meena@faculty.com',NULL,'123456',NULL,2,'ECE',NULL),(5,'Admin User','admin@college.com',NULL,'123456',NULL,3,'ADMIN',NULL),(6,'Rithish','rithish@student.com',NULL,'1234','22CS103',1,'CSE',2),(7,'Prakash','pra',NULL,'1234','22CS1',1,'ECE',2),(8,'Rithish','rit',NULL,'1234','22CS2',1,'CSE',3),(9,'Mathan','mat',NULL,'1234',NULL,2,'ECE',NULL),(10,'Rathish','rat',NULL,'1234',NULL,2,'CSE',NULL),(11,'Surya','sur',NULL,'1234',NULL,3,'CSE',NULL),(12,'PRAKASH P V','prakashpv.cs24@bitsathy.ac.in','108631631653226473811','google_auth_108631631653226473811','7376241CS322',1,'CSE',2),(13,'RATHISH S','rathishs.cs24@bitsathy.ac.in','104657269095007417988','google_auth_104657269095007417988','1234',1,'CSE',2),(16,'SURYA G P','suryagp.cs24@bitsathy.ac.in','111379179288133832516',NULL,'1234',1,'CSE',2),(17,'sanjeevi rajan ramajayam','sanjeenrajanramajayam.cs24@bitsathy.ac.in',NULL,NULL,'7376241cs364',1,'ECE',3);




