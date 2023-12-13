const notificationController = require("express").Router();

const User = require("../models/User");
const Notification = require("../models/Notification");

const tokenMiddleware = require("../middlewares/tokenMiddleware");
const { firebase } = require("../utils/config");
notificationController.get("/", tokenMiddleware, async (req, res) => {
  try {
    const notification = await Notification.find({ userId: req.user.id });

    if (notification) {
      return res.status(200).json(notification);
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

const createNotification = async (req, ids, linkId, title, message, type) => {
  const notifications = ids.map(async (id) => {
    req.io.emit(`notification-${id}`);
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

  createPushNotificationToken(title, message, fcmTokens, linkId);
};

const createNotificationAll = async (
  req,
  linkId,
  title,
  message,
  type,
  sendAllPushNotif
) => {
  if (sendAllPushNotif) {
    createPushNotificationTopic(title, message, "sagip", linkId);
  } else {
    const users = await User.find({
      userType: "resident",
    });
    const fcmTokens = users.flatMap((user) => user.fcmToken);
    createPushNotificationToken(title, message, fcmTokens, linkId);
  }
  let userTypes = {};
  if (sendAllPushNotif) {
    userTypes = { userType: { $in: ["resident", "responder"] } };
  } else {
    userTypes = { userType: "resident" };
  }

  const users = await User.find(userTypes);
  if (users) {
    users.map(async (user) => {
      req.io.emit(`notification-${user._id}`);
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
};

const createPushNotificationToken = (title, body, tokens, linkId) => {
  title = title.replace(/<br>/g, "\n");
  body = body.replace(/<br>/g, "\n");
  if (tokens.length !== 0) {
    const message = {
      notification: {
        title: title,
        body: body,
      },

      data: {
        linkId: String(linkId),
        tag: createRandomTag(),
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
          console.log("List of tokens that caused failures:", failedTokens);
        }
      })
      .catch((error) => {
        return "Internal Server Error: " + error;
      });
  }
};

const createPushNotificationTopic = (title, body, topic, linkId) => {
  title = title.replace(/<br>/g, "\n");
  body = body.replace(/<br>/g, "\n");
  const message = {
    notification: {
      title: title,
      body: body,
    },
    data: {
      linkId: String(linkId),
      tag: createRandomTag(),
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

const createRandomTag = () => {
  const randomTag = Math.floor(Math.random() * 1000000).toString();
  return randomTag;
};

module.exports = {
  notificationController,
  createNotificationAll,
  createNotification,
  createPushNotificationTopic,
  createPushNotificationToken,
};
