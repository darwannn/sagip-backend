const User = require("../models/User");

const userTypeMiddleware = (allowedUserTypes) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (allowedUserTypes.includes(user.userType)) {
        next();
      } else {
        return res
          .status(403)
          .json({ success: false, message: "Access denied" });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error: " + error });
    }
  };
};

module.exports = userTypeMiddleware;
