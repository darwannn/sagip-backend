const authController = require("express").Router();
const User = require("../models/User");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isEmpty, isImage, isLessThanSize } = require("./functionController");

const tokenMiddleware = require("../middlewares/tokenMiddleware");
const { sendSMS, apiController } = require("./apiController");
// const isBanned = require('../middlewares/authMiddleware')

const currentDate = new Date();
const codeExpiration = new Date(currentDate.getTime() + 30 * 60000);
const dateTimeToday = new Date().toLocaleString();

const uploadMiddleware = require("../middlewares/uploadMiddleware");
const upload = uploadMiddleware("public/images/User");

const fs = require("fs");
const { log } = require("console");

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

const deleteNotification = async (userId, notificationId) => {
  console.log("====================================");
  console.log(userId);
  console.log("====================================");
  console.log(notificationId);
  const notification = await Notification.updateOne(
    { userId: userId },
    { $pull: { notifications: { _id: notificationId } } }
  );
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
  createEmptyNotification,
  createNotification,
  readNotification,
  updateNotification,
  deleteNotification,
};
