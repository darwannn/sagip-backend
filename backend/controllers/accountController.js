const accountController = require("express").Router();
const User = require("../models/User");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
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
} = require("./functionController");

const tokenMiddleware = require("../middlewares/tokenMiddleware");
// const isBanned = require('../middlewares/authMiddleware')
const { sendSMS, apiController } = require("./apiController");

const currentDate = new Date();
const codeExpiration = new Date(currentDate.getTime() + 30 * 60000);
const dateTimeToday = new Date().toLocaleString();

const uploadMiddleware = require("../middlewares/uploadMiddleware");
const upload = uploadMiddleware("public/images/User");

const fs = require("fs");
const { log } = require("console");

/* get all */
accountController.get("/", async (req, res) => {
  try {
    const user = await User.find({});

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error" + error,
    });
  }
});

accountController.post("/create", async (req, res) => {
  try {
    const error = {};
    let {
      firstname,
      middlename,
      lastname,
      contactNumber,
      email,
      region,
      province,
      municipality,
      barangay,
      street,
      birthdate,
      gender,
      password,

      userType,
      profilePicture,
      attempt,
      verificationCode,
    } = req.body;

    if (isEmpty(userType)) error["userType"] = "Required field";

    if (isEmpty(email)) {
      error["email"] = "Required field";
    } else {
      if (isEmail(email)) {
        error["email"] = "not email";
      } else {
        if (await isEmailExists(email)) {
          error["email"] = "email already exists";
        }
      }
    }

    if (isEmpty(contactNumber)) {
      error["contact"] = "Required field";
    } else {
      if (isContactNumber(contactNumber)) {
        error["contact"] = "must be a number";
      } else {
        if (await isContactNumberExists(contactNumber)) {
          error["contact"] = "Contact Number already exists";
        }
      }
    }

    if (isEmpty(firstname)) error["firstname"] = "Required field";
    if (isEmpty(middlename)) error["middlename"] = "Required field";
    if (isEmpty(lastname)) error["lastname"] = "Required field";
    if (isEmpty(birthdate)) error["birthdate"] = "Required field";
    if (isEmpty(gender)) error["gender"] = "Required field";

    /*  if (isResident === "true") {
        region = "Region III";
        province = "Bulacan";
        municipality = "Malolos";
      } else { */
    if (isEmpty(region)) error["region"] = "Required field";
    if (isEmpty(province)) error["province"] = "Required field";
    if (isEmpty(municipality)) error["municipality"] = "Required field";
    /*  } */
    if (isEmpty(barangay)) error["barangay"] = "Required field";
    if (isEmpty(street)) error["street"] = "Required field";

    /* if (isEmpty(password)) {
        error["password"] = "Required field";
      } else {
        if (verifyPassword(password)) {
          error["password"] = "password requirement did not match";
        }
      } */

    /* if (isEmpty(confirmPassword)) {
        error["confirmPassword"] = "Required field";
      } else {
        if (!isEmpty(password)) {
          if (password !== confirmPassword) {
            error["confirmPassword"] = "password did not match";
          }
        }
      } */

    if (Object.keys(error).length == 0) {
      profilePicture = "user_no_image.png";
      attempt = 0;

      if (verificationCode !== 0) {
        verificationCode = await generateCode();
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        email,
        password: hashedPassword,

        region,
        province,
        municipality,
        barangay,
        street,

        firstname,
        middlename,
        lastname,
        gender,
        birthdate,

        contactNumber,

        isOnline: false,
        isBanned: false,

        profilePicture,
        attempt,
        verificationCode: 0,
        codeExpiration,

        userType,
        status: "varified",
      });

      const notification = await Notification.create({
        userId: user._doc._id,
        notifications: [],
      });
      if (user && notification) {
        console.log("success");

        /*   sendSMS(`Your SAGIP verification code is ${verificationCode}`,user.contactNumber) */

        return res.status(200).json({
          success: true,
          message: "Added",
        });
      } else {
        console.log("error");

        error["error"] = "Database Error";
        return res.status(400);
      }
    }

    if (Object.keys(error).length != 0) {
      error["success"] = false;
      error["message"] = "input error";

      return res.status(400).json(error);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error" + error,
    });
  }
});

accountController.delete("/delete/:id", tokenMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (user) {
      if (user.profilePicture == "user_no_image.png") {
        const imagePath = `public/images/User/${user.profilePicture}`;
        fs.unlink(imagePath, (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error deleting the image ",
            });
          } else {
            return res.status(200).json({
              success: true,
              message: "Account deleted successfully",
            });
          }
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Account  deleted successfully",
        });
      }
    } else {
      return res.status(500).json({
        success: false,
        message: "DB Erroree",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error" + error,
    });
  }
});

accountController.put(
  "/update/contact-number",
  tokenMiddleware,
  async (req, res) => {
    try {
      const error = {};
      let { contactNumber } = req.body;

      const contactNumberExists = await User.findOne({
        contactNumber,
      });

      if (isEmpty(contactNumber)) {
        error["contact"] = "Required field";
      } else {
        if (isContactNumber(contactNumber)) {
          error["contact"] = "must be a number";
        } else {
          if (await isContactNumberExists(contactNumber)) {
            if (await isContactNumberOwner(req.user.id, contactNumber)) {
              error["contact"] = "input new contact numebr";
            } else {
              error["contact"] = "Contact Number already exists";
            }
          }
        }
      }

      if (Object.keys(error).length == 0) {
        const updateFields = {
          contactNumber,
        };

        const user = await User.findByIdAndUpdate(req.user.id, updateFields, {
          new: true,
        });

        if (user) {
          return res.status(200).json({
            success: true,
            message: "Contact Number updated successfully",
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "DB Error",
          });
        }
      }

      if (Object.keys(error).length != 0) {
        error["success"] = false;
        error["message"] = "input error";

        return res.status(400).json(error);
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error" + error,
      });
    }
  }
);

accountController.put(
  "/reset-password/:id",
  tokenMiddleware,
  async (req, res) => {
    // Variable declaration

    try {
      const error = {};
      const password = "sagip";
      console.log(password);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      if (Object.keys(error).length == 0) {
        console.log(req.user.id);
        const user = await User.findByIdAndUpdate(req.user.id, {
          attempt: 0,
          password: hashedPassword,
        });

        if (user) {
          return res.status(200).json({
            success: true,
            message: "Password reset successfully",
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "DB Error",
          });
        }
      }
    } catch (error) {
      // If an exception occurs, respond with an internal server error
      return res.status(500).json({
        success: false,
        message: "Internal Server Error" + error,
      });
    }
  }
);

accountController.put(
  "/update/:id",

  upload.single("image"),
  async (req, res) => {
    try {
      const error = {};
      let {
        id,
        firstname,
        middlename,
        lastname,

        email,
        region,
        province,
        municipality,
        barangay,
        street,
        birthdate,
        gender,
        profilePicture,
        attempt,
        verificationCode,
        userType,
        status,

        hasChanged,
      } = req.body;

      if (isEmpty(email)) {
        error["email"] = "Required field";
      } else {
        if (isEmail(email)) {
          error["email"] = "not email";
        } else {
          if (await isEmailExists(email)) {
            if (await isEmailOwner(id, email)) {
              /*   error["email"] = "input new email"; */
            } else {
              error["email"] = "email already exists";
            }
          }
        }
      }

      if (isEmpty(firstname)) error["firstname"] = "Required field";
      if (isEmpty(lastname)) error["lastname"] = "Required field";
      if (isEmpty(birthdate)) error["birthdate"] = "Required field";
      if (isEmpty(gender)) error["gender"] = "Required field";

      /*    if (isResident === "true") {
          region = "Region III";
          province = "Bulacan";
          municipality = "Malolos";
        } else { */
      if (isEmpty(region)) error["region"] = "Required field";
      if (isEmpty(province)) error["province"] = "Required field";
      if (isEmpty(municipality)) error["municipality"] = "Required field";
      /* } */
      if (isEmpty(barangay)) error["barangay"] = "Required field";
      if (isEmpty(street)) error["street"] = "Required field";

      if (hasChanged === "true") {
        if (!req.file) {
          error["image"] = "Required field";
        } else {
          if (isImage(req.file)) {
            error["image"] = "Only PNG, JPEG, and JPG files are allowed";
          } else {
            if (isLessThanSize(req.file, 10 * 1024 * 1024)) {
              error["image"] = "File size should be less than 10MB";
            }
          }
        }
      }

      if (Object.keys(error).length == 0) {
        const updateFields = {
          firstname,
          middlename,
          lastname,

          email,
          region,
          province,
          municipality,
          barangay,
          street,
          birthdate,
          gender,
          profilePicture,
          attempt,
          verificationCode,
          userType,
          status,

          hasChanged,
        };
        let imagePath = "";

        if (hasChanged && req.file) {
          updateFields.profilePicture = req.file.filename;

          const deletedAccount = await User.findById(req.params.id);
          if (deletedAccount) {
            imagePath = `public/images/User/${deletedAccount.profilePicture}`;
          }
        }

        const safetyTip = await User.findByIdAndUpdate(
          req.params.id,
          updateFields,
          {
            new: true,
          }
        );

        if (safetyTip) {
          if (hasChanged && req.file) {
            if (!imagePath.includes("user_no_image")) {
              console.log(imagePath);
              fs.unlink(imagePath, (err) => {
                if (err) {
                  return res.status(500).json({
                    success: false,
                    message: "Error deleting the image",
                  });
                }
              });
            }
          }

          return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            safetyTip,
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "DB Error",
          });
        }
      }

      if (Object.keys(error).length != 0) {
        error["success"] = false;
        error["message"] = "input error";

        return res.status(400).json(error);
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error" + error,
      });
    }
  }
);

/* get specific  */
accountController.get("/:id", async (req, res) => {
  try {
    const safetyTip = await User.findById(req.params.id);

    console.log("====================================");
    console.log("wakj");
    console.log("====================================");
    return res.status(200).json(safetyTip);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "not found",
    });
  }
});

module.exports = accountController;
