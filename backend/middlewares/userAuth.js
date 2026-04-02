const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const db = require("../config/db");

const userAuth = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return next(createError.Unauthorized("Authentication token is missing"));
  }

  try {
    const decodedMessage = jwt.verify(token, process.env.JWT_SECRET);

    db.query(
      "SELECT * FROM users WHERE user_id = ?",   // ✅ FIXED
      [decodedMessage.id],
      (error, result) => {
        if (error) return next(createError.BadRequest(error));

        if (result.length === 0) {
          return next(createError.NotFound("User not found"));
        }

        req.user = result[0];   // ✅ store full user object
        next();
      }
    );
  } catch (error) {
    return next(createError.Unauthorized("Invalid or expired token"));
  }
};

module.exports = userAuth;
