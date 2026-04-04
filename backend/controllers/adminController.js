const db = require("../config/db");
const createError = require("http-errors");
const { meeting_id } = require("../utils/id_generation");
const XLSX = require("xlsx");

const ALLOWED_COMPLAINT_STATUSES = ["accepted", "rejected", "resolved", "pending", "all"];
const ALLOWED_MEETING_ALLOTED = ["yes", "no", "all"];

const getNormalizedStatusFilter = (rawStatus) => {
  const status = (rawStatus || "all").toString().trim().toLowerCase();
  if (!ALLOWED_COMPLAINT_STATUSES.includes(status)) {
    return null;
  }
  return status;
};

const getNormalizedMeetingAllotedFilter = (rawValue) => {
  const value = (rawValue || "all").toString().trim().toLowerCase();
  if (!ALLOWED_MEETING_ALLOTED.includes(value)) {
    return null;
  }
  return value;
};

const addExportFilters = ({ reqQuery, conditions, values, columns }) => {
  const {
    statusColumn,
    studentIdColumn,
    studentNameColumn,
    facultyIdColumn,
    facultyNameColumn,
    meetingAllotedColumn,
    dateTimeColumn,
  } = columns;

  if (reqQuery.status) {
    const statusFilter = getNormalizedStatusFilter(reqQuery.status);
    if (!statusFilter) {
      return "Invalid status filter";
    }
    if (statusFilter !== "all") {
      conditions.push(`${statusColumn} = ?`);
      values.push(statusFilter);
    }
  }

  if (reqQuery.meeting_alloted) {
    const meetingAllotedFilter = getNormalizedMeetingAllotedFilter(reqQuery.meeting_alloted);
    if (!meetingAllotedFilter) {
      return "Invalid meeting_alloted filter";
    }
    if (meetingAllotedFilter !== "all") {
      conditions.push(`${meetingAllotedColumn} = ?`);
      values.push(meetingAllotedFilter);
    }
  }

  if (reqQuery.student_id) {
    conditions.push(`${studentIdColumn} = ?`);
    values.push(reqQuery.student_id);
  }

  if (reqQuery.student_name) {
    conditions.push(`${studentNameColumn} LIKE ?`);
    values.push(`%${reqQuery.student_name.trim()}%`);
  }

  if (reqQuery.faculty_id) {
    conditions.push(`${facultyIdColumn} = ?`);
    values.push(reqQuery.faculty_id);
  }

  if (reqQuery.faculty_name) {
    conditions.push(`${facultyNameColumn} LIKE ?`);
    values.push(`%${reqQuery.faculty_name.trim()}%`);
  }

  const fromDateTime = reqQuery.from_date_time || reqQuery.from;
  const toDateTime = reqQuery.to_date_time || reqQuery.to;
  const fromDate = reqQuery.from_date;
  const toDate = reqQuery.to_date;
  const fromTime = reqQuery.from_time;
  const toTime = reqQuery.to_time;

  if (fromDateTime) {
    conditions.push(`${dateTimeColumn} >= ?`);
    values.push(fromDateTime);
  }

  if (toDateTime) {
    conditions.push(`${dateTimeColumn} <= ?`);
    values.push(toDateTime);
  }

  if (fromDate) {
    conditions.push(`DATE(${dateTimeColumn}) >= ?`);
    values.push(fromDate);
  }

  if (toDate) {
    conditions.push(`DATE(${dateTimeColumn}) <= ?`);
    values.push(toDate);
  }

  if (fromTime) {
    conditions.push(`TIME(${dateTimeColumn}) >= ?`);
    values.push(fromTime);
  }

  if (toTime) {
    conditions.push(`TIME(${dateTimeColumn}) <= ?`);
    values.push(toTime);
  }

  return null;
};

exports.getAllStudentsCounts = async (req, res, next) => {
  try {
    const countSql = `
      SELECT 
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
      FROM faculty_logger`;

    db.query(countSql, (err, countResult) => {
      if (err) return next(err);
      // 

      res.status(200).json({
        success: true,
        type: 'all_students',
        counts: {
          accepted_count: countResult[0].accepted_count || 0,
          rejected_count: countResult[0].rejected_count || 0,
          resolved_count: countResult[0].resolved_count || 0,
          pending_count: countResult[0].pending_count || 0
        }
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.getStudents = (req, res, next) => {
  try {
    // ✅ Include user_id in the SELECT query
    const sql = `SELECT user_id, name, reg_num FROM users WHERE role_id = 1 ORDER BY name ASC`;

    db.query(sql, (err, results) => {
      if (err) return next(err);

      if (results.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No users found with role_id = 1",
          data: [],
        });
      }

      res.status(200).json({
        success: true,
        data: results, // ✅ Now includes user_id, name, reg_num
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.getStudentProfile = async (req, res, next) => {
  try {
    const { student_id } = req.params;

    if (!student_id) {
      return next(createError. BadRequest("Student ID is required"));
    }

    const studentIdNum = Number(student_id);
    if (isNaN(studentIdNum)) {
      return next(createError.BadRequest("Invalid Student ID"));
    }

    // ✅ Verify the user exists and has role_id = 1
    const userCheckSql = `SELECT user_id, name, reg_num FROM users WHERE user_id = ? AND role_id = 1 LIMIT 1`;
    
    db.query(userCheckSql, [studentIdNum], (err, userResult) => {
      if (err) return next(err);
      
      if (userResult. length === 0) {
        return res.status(404).json({
          success: false,
          message: "Student not found or invalid student ID"
        });
      }

      const student = userResult[0];

      // ✅ Fetch the counts from faculty_logger
      const countSql = `
        SELECT 
          SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_count,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
        FROM faculty_logger 
        WHERE student_id = ? `;

      db.query(countSql, [studentIdNum], (err2, countResult) => {
        if (err2) return next(err2);

        const accepted = countResult[0].accepted_count || 0;
        const rejected = countResult[0].rejected_count || 0;
        const resolved = countResult[0].resolved_count || 0;
        const pending = countResult[0].pending_count || 0;

        const totalRecords = accepted + rejected + resolved + pending;

        if (totalRecords === 0) {
          return res.json({
            success: true,
            type: 'specific_student',
            student_id: studentIdNum,
            student_name: student.name,
            student_reg_num: student.reg_num,
            message: 'No records found for this student',
            counts: {
              accepted_count: 0,
              rejected_count:  0,
              resolved_count: 0,
              pending_count: 0
            }
          });
        }

        res.json({
          success: true,
          type: 'specific_student',
          student_id: studentIdNum,
          student_name: student.name,
          student_reg_num: student.reg_num,
          counts: {
            accepted_count:  accepted,
            rejected_count:  rejected,
            resolved_count:  resolved,
            pending_count:  pending
          }
        });
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.getStudentComplaintHistory = async (req, res, next) => {
  try {
    const { student_id } = req.params;

    if (!student_id) {
      return next(createError. BadRequest("Student ID is required"));
    }

    const studentIdNum = Number(student_id);
    if (isNaN(studentIdNum)) {
      return next(createError.BadRequest("Invalid Student ID"));
    }

    // ✅ Using your existing query structure
    const sql = `
      SELECT 
        fl.student_id,
        fl.complaint_id,
        fl.faculty_id,
        fl.date_time,
        fl.venue,
        fl. complaint,
        fl.status,
        fl.revoke_message,
        fl. meeting_alloted,
        
        -- student info
        s. name AS student_name,
        s.reg_num AS student_reg_num,
        s. emailId AS student_email,
        s.department AS student_department,
        s.year AS student_year,
        
        -- faculty info
        f.name AS faculty_name,
        f. emailId AS faculty_email,
        f.department AS faculty_department

      FROM faculty_logger fl
      -- join users table for student info
      LEFT JOIN users s ON s.user_id = fl.student_id
      -- join users table for faculty info
      LEFT JOIN users f ON f.user_id = fl.faculty_id
      
      -- ✅ Filter by specific student
      WHERE fl.student_id = ? 
      
      ORDER BY fl.date_time DESC
    `;

    db.query(sql, [studentIdNum], (err, result) => {
      if (err) return next(err);

      if (!result || result.length === 0) {
        return res.json({
          success: true,
          message: "No complaints found for this student",
          student_info: {
            user_id: studentIdNum
          },
          complaints: []
        });
      }

      // Extract student info from first record
      const studentInfo = {
        user_id: result[0].student_id,
        name: result[0].student_name,
        reg_num: result[0].student_reg_num,
        email: result[0].student_email,
        department: result[0].student_department,
        year: result[0].student_year
      };

      return res.json({ 
        success: true, 
        student_info: studentInfo,
        complaints: result 
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.getfaculty = (req, res, next) => {
  try {
    const sql = `SELECT user_id, name FROM users WHERE role_id = 2 ORDER BY name ASC`;

    db.query(sql, (err, results) => {
      if (err) return next(err);

      if (results.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No users found with role_id = 2",
          data: [],
        });
      }

      res.status(200).json({
        success: true,
        data: results,
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.getFacultyProfile = async (req, res, next) => {
  try {
    const { faculty_id } = req.params;

    if (!faculty_id) {
      return next(createError. BadRequest("Faculty ID is required"));
    }

    const facultyIdNum = Number(faculty_id);
    if (isNaN(facultyIdNum)) {
      return next(createError.BadRequest("Invalid Faculty ID"));
    }

    // ✅ FIX 1: Remove space in "user_id " (you had extra space)
    const findUserSql = `SELECT user_id, name FROM users WHERE user_id = ?  AND role_id = 2 LIMIT 1`;

    db.query(findUserSql, [facultyIdNum], (err, userResult) => {
      if (err) return next(err);
      
      if (userResult.length === 0) {
        return res.status(404).json({ // ✅ FIX 2: Use 404 instead of 200
          success: false,
          message: "No faculty found with provided ID"
        });
      }

      const faculty = userResult[0];

      const countSql = `
        SELECT 
          SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_count,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
        FROM faculty_logger 
        WHERE faculty_id = ? `;

      db.query(countSql, [facultyIdNum], (err2, countResult) => {
        if (err2) return next(err2);

        const accepted = countResult[0].accepted_count || 0;
        const rejected = countResult[0].rejected_count || 0;
        const resolved = countResult[0].resolved_count || 0;
        const pending = countResult[0].pending_count || 0;

        const totalRecords = accepted + rejected + resolved + pending;

        if (totalRecords === 0) {
          return res.json({
            success: true,
            type: 'specific_faculty', // ✅ FIX 3: Change from 'specific_student'
            faculty_id: facultyIdNum,
            faculty_name: faculty.name,
            message: 'No records found for this faculty',
            counts: {
              accepted_count: 0,
              rejected_count:  0,
              resolved_count: 0,
              pending_count: 0
            }
          });
        }

        res.json({
          success: true,
          type: 'specific_faculty', // ✅ FIX 3: Change from 'specific_student'
          faculty_id: facultyIdNum,
          faculty_name: faculty.name,
          counts: {
            accepted_count:  accepted,
            rejected_count:  rejected,
            resolved_count:  resolved,
            pending_count:  pending
          }
        });
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.getFacultyComplaintHistory = async (req, res, next) => {
  try {
    const { faculty_id } = req.params;

    if (!faculty_id) {
      return next(createError.BadRequest("Faculty ID is required"));
    }

    const facultyIdNum = Number(faculty_id);
    if (isNaN(facultyIdNum)) {
      return next(createError.BadRequest("Invalid Faculty ID"));
    }

    // ✅ Using your existing query structure
    const sql = `
      SELECT 
        fl.student_id,
        fl.complaint_id,
        fl.faculty_id,
        fl.date_time,
        fl.venue,
        fl. complaint,
        fl.status,
     
        fl.revoke_message,
        fl.meeting_alloted,
        
        -- student info
        s.name AS student_name,
        s. reg_num AS student_reg_num,
        s.emailId AS student_email,
        s.department AS student_department,
        s.year AS student_year,
        
        -- faculty info
        f.name AS faculty_name,
        f.emailId AS faculty_email,
        f.department AS faculty_department

      FROM faculty_logger fl
      -- join users table for student info
      LEFT JOIN users s ON s.user_id = fl.student_id
      -- join users table for faculty info
      LEFT JOIN users f ON f.user_id = fl. faculty_id
      
      -- ✅ Filter by specific faculty
      WHERE fl.faculty_id = ?
      
      ORDER BY fl.date_time DESC
    `;

    db.query(sql, [facultyIdNum], (err, result) => {
      if (err) return next(err);

      if (!result || result.length === 0) {
        return res.json({
          success: true,
          message: "No complaints found for this faculty",
          faculty_info: {
            user_id: facultyIdNum
          },
          complaints: []
        });
      }

      // Extract faculty info from first record
      const facultyInfo = {
        user_id: result[0].faculty_id,
        name: result[0].faculty_name,
        email: result[0].faculty_email,
        department: result[0].faculty_department
      };

      return res.json({ 
        success: true, 
        faculty_info: facultyInfo,
        complaints: result 
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.get_complaints = (req, res, next) => {
  try {
    const sql = `SELECT 
    fl.student_id,
    fl.complaint_id,
    fl.faculty_id,
    fl.date_time,
    fl.venue,
    fl.complaint,
    fl.status,
    fl.revoke_message,
    fl.meeting_alloted,
    
    -- student info
    s.name AS student_name,
    s.reg_num AS student_reg_num,
    s.emailId AS student_email,
    s.department AS student_department,
    s.year AS student_year,
    
    -- faculty info
    f.name AS faculty_name,
    f.emailId AS faculty_email,
    f.department AS faculty_department

FROM faculty_logger fl
-- join users table for student info
LEFT JOIN users s ON s.user_id = fl.student_id
-- join users table for faculty info
LEFT JOIN users f ON f.user_id = fl.faculty_id

ORDER BY fl.date_time DESC;
`;

    db.query(sql, (err, result) => {
      if (err) return next(err);

      if (!result || result.length === 0) {
        return res.json({
          success: true,
          message: "No complaints found",
          data: []
        });
      }

      return res.json({ success: true, data: result });
      
    });
  } catch (error) {
    next(error);
  }
};

exports.download_complaints_excel = (req, res, next) => {
  try {
    let sql = `SELECT 
    fl.student_id,
    fl.complaint_id,
    fl.faculty_id,
    DATE_FORMAT(fl.date_time, '%Y-%m-%d %H:%i:%s') AS date_time,
    fl.venue,
    fl.complaint,
    fl.status,
    fl.revoke_message,
    fl.meeting_alloted,
    
    -- student info
    s.name AS student_name,
    s.reg_num AS student_reg_num,
    s.emailId AS student_email,
    s.department AS student_department,
    s.year AS student_year,
    
    -- faculty info
    f.name AS faculty_name,
    f.emailId AS faculty_email,
    f.department AS faculty_department

FROM faculty_logger fl
LEFT JOIN users s ON s.user_id = fl.student_id
LEFT JOIN users f ON f.user_id = fl.faculty_id
`;

    const conditions = [];
    const values = [];
    const filterError = addExportFilters({
      reqQuery: req.query,
      conditions,
      values,
      columns: {
        statusColumn: "fl.status",
        studentIdColumn: "fl.student_id",
        studentNameColumn: "s.name",
        facultyIdColumn: "fl.faculty_id",
        facultyNameColumn: "f.name",
        meetingAllotedColumn: "fl.meeting_alloted",
        dateTimeColumn: "fl.date_time",
      },
    });

    if (filterError) {
      return next(createError.BadRequest(filterError));
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    sql += " ORDER BY fl.date_time DESC;";

    db.query(sql, values, (err, result) => {
      if (err) return next(err);

      const rows = (result || []).map((item) => ({
        Complaint_ID: item.complaint_id,
        Student_ID: item.student_id,
        Student_Name: item.student_name,
        Student_Reg_No: item.student_reg_num,
        Student_Email: item.student_email,
        Student_Department: item.student_department,
        Student_Year: item.student_year,
        Faculty_ID: item.faculty_id,
        Faculty_Name: item.faculty_name,
        Faculty_Email: item.faculty_email,
        Faculty_Department: item.faculty_department,
        Date_Time: item.date_time,
        Venue: item.venue,
        Complaint: item.complaint,
        Status: item.status,
        Meeting_Alloted: item.meeting_alloted,
        Revoke_Message: item.revoke_message,
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);

      if (rows.length > 0) {
        worksheet['!cols'] = [
          { wch: 16 },
          { wch: 12 },
          { wch: 24 },
          { wch: 18 },
          { wch: 28 },
          { wch: 22 },
          { wch: 14 },
          { wch: 12 },
          { wch: 24 },
          { wch: 28 },
          { wch: 22 },
          { wch: 20 },
          { wch: 18 },
          { wch: 40 },
          { wch: 14 },
          { wch: 16 },
          { wch: 30 },
        ];
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Complaints');

      const workbookBase64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });

      return res.json({
        success: true,
        fileName: `dc_portal_complaints_${Date.now()}.xlsx`,
        fileBase64: workbookBase64,
        message: rows.length === 0 ? 'No complaints found to export' : 'Excel file generated successfully',
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.download_meetings_excel = (req, res, next) => {
  try {
    let sql = `
      SELECT
        m.meeting_id,
        m.complaint_id,
        m.admin_id,
        m.venue AS meeting_venue,
        DATE_FORMAT(m.date_time, '%Y-%m-%d %H:%i:%s') AS meeting_date_time,
        m.info,
        m.attendance,
        fl.status AS complaint_status,
        fl.meeting_alloted,
        fl.revoke_message,
        s.user_id AS student_id,
        s.name AS student_name,
        s.reg_num AS student_reg_num,
        s.emailId AS student_email,
        s.department AS student_department,
        s.year AS student_year,
        f.user_id AS faculty_id,
        f.name AS faculty_name,
        f.emailId AS faculty_email,
        f.department AS faculty_department
      FROM meetings m
      JOIN faculty_logger fl ON fl.complaint_id = m.complaint_id
      JOIN users s ON s.user_id = fl.student_id
      JOIN users f ON f.user_id = fl.faculty_id
    `;

    const conditions = [];
    const values = [];
    const filterError = addExportFilters({
      reqQuery: req.query,
      conditions,
      values,
      columns: {
        statusColumn: "fl.status",
        studentIdColumn: "s.user_id",
        studentNameColumn: "s.name",
        facultyIdColumn: "f.user_id",
        facultyNameColumn: "f.name",
        meetingAllotedColumn: "fl.meeting_alloted",
        dateTimeColumn: "m.date_time",
      },
    });

    if (filterError) {
      return next(createError.BadRequest(filterError));
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    sql += " ORDER BY m.date_time DESC";

    db.query(sql, values, (err, result) => {
      if (err) return next(err);

      const rows = (result || []).map((item) => ({
        Meeting_ID: item.meeting_id,
        Complaint_ID: item.complaint_id,
        Admin_ID: item.admin_id,
        Meeting_Date_Time: item.meeting_date_time,
        Meeting_Venue: item.meeting_venue,
        Meeting_Info: item.info,
        Attendance: item.attendance,
        Complaint_Status: item.complaint_status,
        Meeting_Alloted: item.meeting_alloted,
        Revoke_Message: item.revoke_message,
        Student_ID: item.student_id,
        Student_Name: item.student_name,
        Student_Reg_No: item.student_reg_num,
        Student_Email: item.student_email,
        Student_Department: item.student_department,
        Student_Year: item.student_year,
        Faculty_ID: item.faculty_id,
        Faculty_Name: item.faculty_name,
        Faculty_Email: item.faculty_email,
        Faculty_Department: item.faculty_department,
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);

      if (rows.length > 0) {
        worksheet['!cols'] = [
          { wch: 18 },
          { wch: 16 },
          { wch: 12 },
          { wch: 20 },
          { wch: 20 },
          { wch: 35 },
          { wch: 12 },
          { wch: 14 },
          { wch: 16 },
          { wch: 24 },
          { wch: 12 },
          { wch: 24 },
          { wch: 18 },
          { wch: 28 },
          { wch: 22 },
          { wch: 12 },
          { wch: 12 },
          { wch: 24 },
          { wch: 28 },
          { wch: 22 },
        ];
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Meetings');

      const workbookBase64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });

      return res.json({
        success: true,
        fileName: `dc_portal_meetings_${Date.now()}.xlsx`,
        fileBase64: workbookBase64,
        message: rows.length === 0 ? 'No meetings found to export' : 'Excel file generated successfully',
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.get_rejected_complaints = (req, res, next) => {
  try {
    const sql = `SELECT 
    fl.student_id,
    fl.complaint_id,
    fl.faculty_id,
    fl.date_time,
    fl.venue,
    fl.complaint,
    fl.status,
    fl.meeting_alloted,
    fl.revoke_message,
    
    -- student info
    s.name AS student_name,
    s.reg_num AS student_reg_num,
    s.emailId AS student_email,
    s.department AS student_department,
    s.year AS student_year,
    
    -- faculty info
    f.name AS faculty_name,
    f.emailId AS faculty_email,
    f.department AS faculty_department

FROM faculty_logger fl
-- join users table for student info
LEFT JOIN users s ON s.user_id = fl.student_id
-- join users table for faculty info
LEFT JOIN users f ON f.user_id = fl.faculty_id

WHERE fl.status = 'rejected'  ORDER BY fl.date_time DESC;
`;

    db.query(sql, (err, result) => {
      if (err) return next(err);

      if (!result || result.length === 0) {
        return res.json({
          success: true,
          message: "No complaints found",
          data: []
        });
      }

      return res.json({ success: true, data: result });
      
    });
  } catch (error) {
    next(error);
  }
};

exports.schedule_meeting = async (req, res, next) => {
  try {
    const { complaint_id, admin_id } = req.params;
    const { venue, info, date_time, faculty_id, student_id } = req.body;
    console.log(req.body,req.params);

    const meet_id = await meeting_id();
    if (
      !complaint_id?.trim() ||
      !admin_id?.trim() ||
      !venue?.trim() ||
      !info?.trim() ||
      !date_time?.trim() ||
      !meet_id?.trim() ||
      !faculty_id ||
      !student_id
    ) {
      return next(createError.BadRequest("Request body is missing"));
    }

    // First insert meeting
    const insertSql = `
      INSERT INTO meetings(meeting_id, complaint_id, admin_id, venue, date_time, info, faculty_id, student_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [meet_id, complaint_id, admin_id, venue, date_time, info, faculty_id, student_id];

    db.query(insertSql, values, (err, result) => {
      if (err) return next(err);
      if (result.affectedRows === 0) return next(createError(400));

      // Now update the faculty_logger table (or whichever table has complaint_id)
      const updateSql = `UPDATE faculty_logger SET meeting_alloted = 'yes' WHERE complaint_id = ?`;

      db.query(updateSql, [complaint_id], (err2, updateResult) => {
        if (err2) return next(err2);

        return res.json({
          success: true,
          message: "Meeting scheduled and complaint updated successfully",
          meeting_id: meet_id,
          updatedRows: updateResult.affectedRows
        });
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.get_schedule_meetings = (req, res, next) => {
  try {
    const sql = `
      SELECT 
        m.meeting_id,
        m.complaint_id,
        m.admin_id,
        m.venue           AS meeting_venue,
        m.date_time       AS meeting_date_time,
        m.info,
        m.attendance,
        fl.venue          AS fl_venue,
        fl.date_time      AS fl_date_time,
        fl.complaint      AS fl_complaint,
        fl.status         AS fl_status,
        fl.meeting_alloted,
        fl.revoke_message,
        s.user_id         AS student_id,
        s.name            AS student_name,
        s.emailId         AS student_email,
        s.reg_num         AS student_reg_num,
        s.department      AS student_department,
        s.year            AS student_year,
        f.user_id         AS faculty_id,
        f.name            AS faculty_name,
        f.emailId         AS faculty_email,
        f.department      AS faculty_department
      FROM meetings m
      JOIN faculty_logger fl 
        ON fl.complaint_id = m.complaint_id
      JOIN users s 
        ON s.user_id = fl.student_id
      JOIN users f 
        ON f.user_id = fl.faculty_id
      WHERE m.admin_id = ?
      ORDER BY m.date_time DESC
    `;

    db.query(sql, [req.params.admin_id], (err, result) => {
      if (err) return next(err);
      if (result.length === 0) {
        return res.json({ success: true, message: "No meetings found", data: [] });
      }
      return res.json({ success: true, data: result });
    });
  } catch (error) {
    next(error);
  }
};

exports.post_attendance = (req, res, next) => {
  try {
    const { meeting_id, attendance } = req.body;
    
    if (!meeting_id || !attendance) {
      return next(createError.BadRequest("meeting_id and attendance are required"));
    }

    const sql = `UPDATE meetings SET attendance = ? WHERE meeting_id = ?`;

    db.query(sql, [attendance, meeting_id], (err, result) => {
      if (err) return next(err);
      if (result.affectedRows === 0) {
        return next(createError.NotFound("Meeting not found"));
      }

      return res.json({
        success: true,
        message: "Attendance updated successfully"
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.post_acceptorresolve=(req,res,next)=>{
  try{
    const {complaint_id,status}=req.body;
    if(!complaint_id || !status){
      return next (createError.BadRequest("complaint_id and status are required"));
    }
    const sql=`UPDATE faculty_logger SET status=? WHERE complaint_id=?`;
    db.query (sql,[status,complaint_id],(err,result)=>{
      if(err) return next (err);
      if(result.affectedRows===0){
        return next (createError.NotFound("Complaint not found"));
      }
      return res.json({
        success:true,
        message:"Complaint status updated successfully"
      });
    });
  }catch(error){
    next (error);
  }
};








exports.get_complaints_summary = (req, res, next) => {
  try {
    const sql = `
      SELECT 
        COUNT(*) AS total_complaints,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_complaints,
        SUM(CASE WHEN status IN ('accepted', 'rejected') THEN 1 ELSE 0 END) AS resolved_complaints
      FROM faculty_logger;
    `;

    db.query(sql, (err, result) => {
      if (err) return next(err);

      if (!result || result.length === 0) {
        return res.json({
          success: true,
          message: "No complaints found",
          data: { total: 0, pending: 0, resolved: 0 }
        });
      }

      const summary = {
        total: result[0].total_complaints,
        pending: result[0].pending_complaints,
        resolved: result[0].resolved_complaints
      };

      return res.json({ success: true, data: summary });
    });
  } catch (error) {
    next(error);
  }
};

exports.getMeetingAlloted = (req, res, next) => {
  const { complaintId } = req.params;

  if (!complaintId || String(complaintId).trim() === "") {
    return next(createError.BadRequest("complaintId is required"));
  }

  const sql = `
    SELECT 
      m.meeting_id,
      m.complaint_id,
      m.admin_id,
      m.venue,
      m.date_time,
      m.info,
      m.attendance,
      m.faculty_id,
      m.student_id
    FROM meetings m
    WHERE complaint_id = ?
    ORDER BY m.date_time DESC
  `;

  db.query(sql, [complaintId], (err, results) => {
    if (err) {
      console.error('Error fetching meeting_alloted:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Frontend expects an array and handles empty state itself.
    res.status(200).json(results);
  });
};
