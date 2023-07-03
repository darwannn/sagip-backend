const notificationController = require("express").Router();

const User = require("../models/User");
const Notification = require("../models/Notification");

const tokenMiddleware = require("../middlewares/tokenMiddleware");

notificationController.get("/", tokenMiddleware, async (req, res) => {
  try {
    console.log(req.user.id);
    const notification = await Notification.find({ userId: req.user.id });
    console.log(notification);
    if (notification) {
      // console.log(notification._doc);
      return res.status(200).json(notification);
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
      { $set: { isRead: true } }
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
notificationController.delete(
  "/delete/:id",
  tokenMiddleware,
  async (req, res) => {
    try {
      const notification = await Notification.findByIdAndDelete(req.params.id);
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
  }
);

const createNotification = async (id, title, message, category) => {
  await Notification.create({
    userId: id,
    title: title,
    message: message,
    category: category,
  });
  console.log("notification created");
};

const createNotificationAll = async (title, message, category) => {
  const users = await User.find({});
  if (users) {
    users.map(async (user) => {
      const notification = new Notification({
        userId: user._id,
        title: title,
        message: message,
        category: category,
      });
      await notification.save();
    });
  }
  console.log("notification created all");
};

/* const updateNotification = async () => {
  const notification = await Notification.create({
    userId: user._doc._id,
    notifications: [],
  });
  return notification;
};
 */
module.exports = {
  createNotificationAll,
  createNotification,
  /*   updateNotification, */
  notificationController,
};
