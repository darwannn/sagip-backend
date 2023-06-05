const notificationController = require("express").Router();

const Notification = require("../models/Notification");

const tokenMiddleware = require("../middlewares/tokenMiddleware");
const { sendSMS, apiController } = require("./apiController");

const currentDate = new Date();

const uploadMiddleware = require("../middlewares/uploadMiddleware");

const fs = require("fs");
const { log } = require("console");

/* get all */

/* get specific  */
notificationController.get("/", tokenMiddleware, async (req, res) => {
  try {
    console.log(req.user.id);
    const notification = await Notification.findOne({ userId: req.user.id });
    return res.status(200).json(notification);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "not found",
    });
  }
});

notificationController.put("/read", tokenMiddleware, async (req, res) => {
  try {
    const notification = await Notification.updateMany(
      { userId: req.user.id },
      { $set: { "notifications.$[].isRead": true } }
    );
    return res.status(200).json({
      success: true,
      message: "",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error" + error,
    });
  }
});
notificationController.put("/delete", tokenMiddleware, async (req, res) => {
  try {
    console.log(req.body.notificationId);
    console.log(req.user.id);
    const notification = await Notification.updateOne(
      { userId: req.user.id },
      { $pull: { notifications: { _id: req.body.notificationId } } }
    );
    return res.status(200).json({
      success: false,
      message: "deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error" + error,
    });
  }
});

module.exports = notificationController;
