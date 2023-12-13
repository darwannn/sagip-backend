const jwt = require("jsonwebtoken");

const tokenMiddleware = (req, res, next) => {
  if (!req.headers.authorization)
    return res
      .status(403)
      .json({ success: false, message: "Not authorized. No token" });

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
      if (err)
        return res.status(403).json({
          success: false,
          message:
            "Expired token. Please refresh the page or click the logout buton then login.",
        });
      else {
        req.user = data;
        next();
      }
    });
  }
};

module.exports = tokenMiddleware;
