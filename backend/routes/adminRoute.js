const express = require("express");
const router = express.Router();
const admin = require("../controllers/adminController");
const userAuth = require("../middlewares/userAuth");

router.get("/admin/getAllStudentsCounts",userAuth,admin.getAllStudentsCounts);

router.get("/admin/getStudents", userAuth, admin.getStudents);
router.get("/admin/getStudentProfile/:student_id", userAuth, admin.getStudentProfile);
router.get("/admin/getStudentComplaintHistory/:student_id", userAuth, admin.getStudentComplaintHistory); 

router.get("/admin/getfaculty",userAuth,admin.getfaculty);
router.get("/admin/getFacultyProfile/:faculty_id",userAuth, admin.getFacultyProfile);
router.get("/admin/getFacultyComplaintHistory/:faculty_id", userAuth, admin.getFacultyComplaintHistory);


router.get("/admin/get_complaints",userAuth,admin.get_complaints);


router.get("/admin/get_rejected_complaints",userAuth,admin.get_rejected_complaints);
router.get("/admin/download_complaints_excel", userAuth, admin.download_complaints_excel);
router.get("/admin/download_meetings_excel", userAuth, admin.download_meetings_excel);
router.post("/admin/schedule_meetings/:complaint_id/:admin_id",userAuth,admin.schedule_meeting);


router.get("/admin/get_schedule_meetings/:admin_id",userAuth,admin.get_schedule_meetings); // admin id
router.post("/admin/post_attendance",userAuth,admin.post_attendance);
router.post("/admin/post_accept_or_resolve",userAuth,admin.post_acceptorresolve);    


router.get("/admin/meeting_alloted/:complaintId", userAuth, admin.getMeetingAlloted);


router.get("/admin/get_complaints_summary",userAuth,admin.get_complaints_summary);
module.exports = router