const notificationController = require("express").Router();

const User = require("../models/User");
const Notification = require("../models/Notification");

const tokenMiddleware = require("../middlewares/tokenMiddleware");
const { firebase } = require("../utils/config");
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

  const users = await User.find({ _id: { $in: ids } }, { fcmToken: 1 });
  const fcmTokens = users.map((user) => user.fcmToken).flat();

  createPushNotificationToken(title, message, fcmTokens);
  console.log("notifications created");
};

const createNotificationAll = async (linkId, title, message, type) => {
  /*  createPushNotificationTopic(title, message, "sagip"); */
  const users = await User.find({
    userType: "resident",
  });
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

const createPushNotificationToken = (title, body, tokens) => {
  if (tokens.length !== 0) {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      tokens: tokens,
    };

    firebase
      .messaging()
      .sendMulticast(message)
      .then((response) => {
        if (response.failureCount > 0) {
          const failedTokens = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push(tokens[idx]);
            }
          });
          console.log("List of tokens that caused failures: " + failedTokens);
        }
      })
      .catch((error) => {
        return "Internal Server Error: " + error;
      });
  }
  console.log("====================================");
  console.log("ahhhhhh");
  console.log("====================================");
};

const createPushNotificationTopic = (title, body, topic) => {
  /* if (tokens.length !== 0) { */
  const message = {
    notification: {
      title: title,
      body: body,
    },
    topic: topic,
  };

  firebase
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Notification sent successfully:", response);
    })
    .catch((error) => {
      console.log("Failed to send notification:", error);
    });
};
/* }; */

module.exports = {
  notificationController,
  createNotificationAll,
  createNotification,
  createPushNotificationTopic,
  createPushNotificationToken,
};
