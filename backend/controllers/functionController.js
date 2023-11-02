const path = require("path");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Team = require("../models/Team");

const { sendSMS, sendEmail } = require("./apiController");

const { cloudinary } = require("../utils/config");

const isEmpty = (value) => {
  if (value === "" || value === null || value === undefined) {
    return true;
  }
  if (typeof value === "string" && value.trim() === "") {
    return true;
  }
  return false;
};

const isImage = (file) => {
  const allowedExtensions = [".png", ".jpeg", ".jpg"];
  const extname = path.extname(file).toLowerCase();

  if (!allowedExtensions.includes(extname)) {
    return true;
  }
};
const isValidExtensions = (file, extensions) => {
  const extname = path.extname(file.originalname).toLowerCase();

  if (!extensions.includes(extname)) {
    return true;
  }
};
const isVideo = (file) => {
  const allowedExtensions = [".mp4"];
  const extname = path.extname(file).toLowerCase();

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
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&,*._])(?=.*\d).{8,16}$/;
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
  const trimmedValue = value.replace(/\s+/g, "");
  if (!/^09\d{9}$/.test(trimmedValue)) {
    return true;
  }
};
const isContactOrTeleNumber = (value) => {
  const trimmedValue = value.replace(/\s+/g, "");
  if (!/^\d+$/.test(trimmedValue)) {
    return true;
  }

  if (
    trimmedValue.length !== 11 &&
    trimmedValue.length !== 10 &&
    trimmedValue.length !== 7
  ) {
    return true;
  }
  if (trimmedValue.length === 11) {
    if (!trimmedValue.startsWith("09")) return true;
  } else if (trimmedValue.length === 10) {
    if (!trimmedValue.startsWith("04479")) return true;
  } else if (trimmedValue.length === 7 && !trimmedValue.startsWith("0")) {
    if (!trimmedValue.startsWith("79")) return true;
  }
};

const isEmail = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return !emailRegex.test(value);
};

const checkIdentifierType = async (identifier) => {
  let identierType;
  if (identifier.includes("@")) {
    identierType = "email";
  } else if (/^09\d{9}$/.test(identifier)) {
    identierType = "contactNumber";
  }
  return identierType;
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

const generateToken = (purpose, id, userType, status, days, identifier) => {
  return jwt.sign(
    {
      target: purpose,
      id,
      userType,
      status,
      identifier,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: days,
    }
  );
};

const calculateArchivedDate = (date) => {
  const archivedDate = moment(date);
  const daysUntilArchive = 30;
  const targetDate = moment(archivedDate).add(daysUntilArchive, "days");
  const currentDate = moment();
  const daysLeft = targetDate.diff(currentDate, "days");
  const deletionDate = targetDate.format("MMMM DD, YYYY");
  return { daysLeft, deletionDate };
};

const updateVerificationCode = async (id) => {
  const codeExpiration = moment().add(15, "minutes");
  let generatedCode = await generateCode();
  const user = await User.findByIdAndUpdate(
    id,
    {
      verificationCode: generatedCode,
      codeExpiration,
    },
    { new: true }
  );

  return user;
};

const cloudinaryUploader = async (
  action,
  filePath,
  resource_type,
  folderPath,
  public_id
) => {
  let cloudinaryResult, fileFormat;

  try {
    if (action === "upload") {
      if (resource_type === "image") {
        fileFormat = "jpeg";
      } else if (resource_type === "video") {
        fileFormat = "mp4";
      }
      await cloudinary.uploader
        .upload(filePath, {
          resource_type: resource_type,
          folder: folderPath,
          public_id: public_id.replace(/\.[^/.]+$/, ""),
          format: fileFormat,
        })
        .then(async (result) => {
          cloudinaryResult = result;
        });
    } else if (action === "destroy") {
      await cloudinary.uploader
        .destroy(`${folderPath}/${public_id.replace(/\.[^/.]+$/, "")}`, {
          type: "upload",
          resource_type: resource_type,
        })
        .then(async (result) => {
          cloudinaryResult = result;
        });
    }
  } catch (error) {
    cloudinaryResult = "error";
  }

  return cloudinaryResult;
};

const getTeamMembersId = async (id) => {
  try {
    let userIds = [];
    const teams = await Team.findOne({ _id: id });
    userIds = [teams.head, ...teams.members];

    return userIds;
  } catch (error) {
    console.error("Internal Server Error: " + error);
    throw error;
  }
};
const getUsersId = async (userType) => {
  try {
    let userIds = [];
    const users = await User.find({ userType });
    userIds = users.map((user) => user._id);

    return userIds;
  } catch (error) {
    console.error("Internal Server Error: " + error);
    throw error;
  }
};

const dismissedRequestCount = async (action, userId, req) => {
  let updateFields;

  if (action === "unarchive") {
    updateFields = {
      $inc: { dismissedRequestCount: -1 },
    };
  } else {
    updateFields = {
      lastDismissedRequestDate: Date.now(),
      $inc: { dismissedRequestCount: 1 },
    };
  }
  const user = await User.findByIdAndUpdate(userId, updateFields, {
    new: true,
  });
  if (user.dismissedRequestCount >= 2) {
    user.isBanned = true;

    req.io.emit(`logout-${userId}`);
  } else {
    user.isBanned = false;
  }
  user.save();
};

const handleArchive = async (action, id, req, res) => {
  try {
    let updateFields = {};
    if (action === "unarchive" || action === "archive") {
      if (action === "archive") {
        updateFields = {
          isArchived: true,
          archivedDate: Date.now(),
        };
      } else if (action === "unarchive") {
        updateFields = {
          isArchived: false,
          $unset: { archivedDate: Date.now() },
        };
      }
      const user = await User.findByIdAndUpdate(
        id,
        updateFields,

        { new: true }
      );
      if (user) {
        if (action === "archive") {
          req.io.emit(`${id}`);
          return res.status(200).json({
            success: true,
            message: "Archived Successfully",
          });
        } else if (action === "unarchive") {
          req.io.emit(`${id}`);
          return res.status(200).json({
            success: true,
            message: "Unrchived Successfully",
          });
        }
      } else {
        return res.status(500).json({
          success: false,
          message: "not found",
        });
      }
    } else {
      return res.status(500).json({
        success: false,
        message: "Error 404: Not Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error,
    });
  }
};

module.exports = {
  isEmpty,
  isImage,
  isLessThanSize,

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
  updateVerificationCode,
  isVideo,
  isValidExtensions,
  cloudinaryUploader,
  calculateArchivedDate,
  getUsersId,
  getTeamMembersId,
  checkIdentifierType,
  dismissedRequestCount,
  handleArchive,
  isContactOrTeleNumber,
};
