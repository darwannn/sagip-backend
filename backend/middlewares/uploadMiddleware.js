const multer = require("multer");
const path = require("path");

function uploadMiddleware(url) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, url);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ storage });

  return upload;
}

module.exports = uploadMiddleware;
