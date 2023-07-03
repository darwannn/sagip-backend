const notificationController = require("express").Router();

const Notification = require("../models/Notification");

const tokenMiddleware = require("../middlewares/tokenMiddleware");

notificationController.get("/", tokenMiddleware, async (req, res) => {
  try {
    console.log(req.user.id);
    const notification = await Notification.findOne({ userId: req.user.id });
    if (notification) {
      // console.log(notification._doc);
      return res.status(200).json(notification._doc.notifications);
      return res.status(200).json({
        /* success: true,
        message: "found", 
        notification,*/
        ...notification,
      });
    } else {
      return res.status(200).json({
        success: false,
        message: "not found",
      });
    }
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

    if (notification) {
      return res.status(200).json({
        success: true,
        message: "Updated Successfully",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error,
    });
  }
});
notificationController.put("/delete", tokenMiddleware, async (req, res) => {
  try {
    const notification = await Notification.updateOne(
      { userId: req.user.id },
      { $pull: { notifications: { _id: req.body.notificationId } } }
    );

    if (notification) {
      return res.status(200).json({
        success: true,
        message: "Deleted Successfully",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error,
    });
  }
});

module.exports = notificationController;
