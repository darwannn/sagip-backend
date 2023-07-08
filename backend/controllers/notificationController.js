const notificationController = require("express").Router();

const User = require("../models/User");
const Notification = require("../models/Notification");

const tokenMiddleware = require("../middlewares/tokenMiddleware");
/* const {
  createPushNotificationTopic,
  createPushNotificationToken,
} = require("./apiController"); */

notificationController.get("/", tokenMiddleware, async (req, res) => {
  try {
    const notification = await Notification.find({ userId: req.user.id });

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

const createNotification = async (ids, linkId, title, message, type) => {
  /* createPushNotificationToken(title, message, [
    "fgmqtj5qS1KbZldJHq6Hm1:APA91bE9Z4Q8u0rZYtqkS4habfNGaSdZvJNwvANWJg0pO_ZVo3SHSK8Bm-8rteFHe9ec9YvzBHoa7zYM5esenHeLw-QXTSZj8Ief88W7_YidTytICqRIgkw0-rXtanfUBkk30NZfvA7Q",
  ]); */
  const notifications = ids.map(async (id) => {
    await Notification.create({
      userId: id,
      title,
      message,
      type,
      linkId,
    });
  });

  await Promise.all(notifications);

  console.log("notifications created");
};

const createNotificationAll = async (linkId, title, message, type) => {
  /*  createPushNotificationTopic(title, message, "sagip"); */
  const users = await User.find({});
  if (users) {
    users.map(async (user) => {
      const notification = new Notification({
        userId: user._id,
        title,
        message,
        type,
        linkId,
      });
      await notification.save();
    });
  }
  console.log("notification created all");
};

module.exports = {
  notificationController,
  createNotificationAll,
  createNotification,
};
