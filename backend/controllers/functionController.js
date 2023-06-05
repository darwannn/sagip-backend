const path = require("path");
const Notification = require("../models/Notification");

const isEmpty = (value) => {
  if (value == "") {
    return true;
  }
};
const isImage = (file) => {
  const allowedExtensions = [".png", ".jpeg", ".jpg"];
  const extname = path.extname(file.originalname).toLowerCase();
  console.log("ssss");
  console.log("s" + extname);
  if (!allowedExtensions.includes(extname)) {
    return true;
  }
};
const isLessThanSize = (file, maxSize) => {
  /*    console.log(file);
    console.log("sizs+"+ file.size); */
  if (file.size > maxSize) {
    return true;
  }
};

module.exports = { isEmpty, isImage, isLessThanSize };
