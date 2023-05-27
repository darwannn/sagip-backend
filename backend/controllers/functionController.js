

const path = require("path");
  
  const isEmpty = (value) => {
    if (value == "") {
      return true
    }
  }
  const isImage = (file) => {
    const allowedExtensions = ['.png', '.jpeg', '.jpg'];

    const extname = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(extname)) {
      
        return true;

    }
  }
  const isLessThanSize = (file, maxSize) => {

  if (file.size > maxSize) {
    return true;
  }

  }

module.exports = {isEmpty,isImage,isLessThanSize}