const multer = require("multer");

const multerMiddleware = multer({
  storage: multer.diskStorage({
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
      const fileName = uniqueSuffix;
      cb(null, fileName);
    },
  }),
  /*  fileFilter: (req, file, cb) => {
    cb(null, true);
  }, */
});

module.exports = multerMiddleware;
