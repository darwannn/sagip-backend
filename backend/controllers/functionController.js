const path = require("path");
const Notification = require("../models/Notification");

const fs = require("fs");
const { log } = require("console");
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

const createNotification = async (id, title, message, category) => {
  await Notification.findOneAndUpdate(
    { userId: id },
    {
      $push: {
        notifications: {
          title: title,
          message: message,
          dateSent: Date.now(),
          category: category,
          isRead: false,
        },
      },
    }
  );
};

const createEmptyNotification = async (id) => {
  const notification = await Notification.create({
    userId: id,
    notifications: [],
  });

  return notification;
};
const updateNotification = async () => {
  const notification = await Notification.create({
    userId: user._doc._id,
    notifications: [],
  });
  return notification;
};

const readNotification = async (id) => {
  const notification = await Notification.updateMany(
    { userId: id },
    { $set: { "notifications.$[].isRead": true } }
  );
  return notification;
};

module.exports = {
  isEmpty,
  isImage,
  isLessThanSize,
  createEmptyNotification,
  createNotification,
  readNotification,
  updateNotification,
};
