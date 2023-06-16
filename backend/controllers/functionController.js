const path = require("path");
const Notification = require("../models/Notification");

const jwt = require("jsonwebtoken");
const User = require("../models/User");

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
  if (file.size > maxSize) {
    return true;
  }
};

const generateCode = async () => {
  let codeTaken, code;
  do {
    code = Math.floor(100000 + Math.random() * 900000);
    codeTaken = await User.findOne({
      verificationCode: code,
    });
  } while (codeTaken);
  return code;
};

const verifyPassword = (password, field) => {
  const passwordRequirements =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&,*.])(?=.*\d).{8,16}$/;
  if (!passwordRequirements.test(password)) {
    return true;
  }
};

const isNumber = (value) => {
  if (isNaN(Number(value))) {
    return true;
  }
};
const isContactNumber = (value) => {
  if (!/^09\d{9}$/.test(value)) {
    return true;
  }
};

const isEmail = (value) => {
  if (!value.includes("@")) {
    return true;
  }
};

const checkIdentifier = async (identifier) => {
  let identierType;
  if (identifier.includes("@")) {
    identierType = "email";
  } else if (/^09\d{9}$/.test(identifier)) {
    identierType = "contactNumber";
  } else {
    /*   return res.status(400).json({
      success: true,
      message: "Invalid Email or Contact NUmber",
    }); */
  }
  const accountExists = await User.findOne({
    [identierType]: identifier,
  });
  return accountExists;
};

const isContactNumberExists = async (contactNumber) => {
  const user = await User.findOne({
    contactNumber,
  });

  return user;
};

const isContactNumberOwner = async (id, contactNumber) => {
  const user = await User.findOne({
    _id: id,
  });

  if (user.contactNumber === contactNumber) {
    return true;
  }
};

const isEmailExists = async (email) => {
  const user = await User.findOne({
    email,
  });

  return user;
};

const isEmailOwner = async (id, email) => {
  const user = await User.findOne({
    _id: id,
  });

  if (user.email === email) {
    return true;
  }
};

const generateToken = (id) => {
  return jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
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
  isEmailExists,
  isEmailOwner,
  isContactNumberOwner,
  isContactNumberExists,
  checkIdentifier,
  isEmail,
  isContactNumber,
  isNumber,
  verifyPassword,
  generateCode,
  generateToken,
};
