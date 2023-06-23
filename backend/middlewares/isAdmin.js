const User = require("../models/User");

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.userType === "admin" || user.userType === "super-admin") {
      next();
    } else {
      return res.status(403).json({ success: false, message: "access denied" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error: " + error });
  }
};

module.exports = isAdmin;
