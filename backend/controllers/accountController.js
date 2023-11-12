const accountController = require("express").Router();
const User = require("../models/User");

const bcrypt = require("bcryptjs");

const {
  isEmpty,
  isImage,
  isLessThanSize,
  isEmailExists,
  isEmailOwner,
  isContactNumberOwner,
  isContactNumberExists,
  checkIdentifierType,
  isEmail,
  isContactNumber,
  generateCode,
  updateVerificationCode,
  cloudinaryUploader,
  handleArchive,
  verifyPassword,
  generateToken,
} = require("./functionController");

const tokenMiddleware = require("../middlewares/tokenMiddleware");
const { createAuditTrail } = require("./auditTrailController");
const currentDate = new Date();

const multerMiddleware = require("../middlewares/multerMiddleware");

const folderPath = "sagip/media/user";

const userTypeMiddleware = require("../middlewares/userTypeMiddleware");

const { sendSMS, sendEmail } = require("./apiController");
const {
  createNotification,
  createNotificationAll,
} = require("./notificationController");
const moment = require("moment");
const { create } = require("../models/AuditTrail");
accountController.get("/", async (req, res) => {
  try {
    const user = await User.find({});

    if (user) {
      return res.status(200).json(user);
    } else {
      return res.status(200).json({
        success: false,
        message: "not found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error,
    });
  }
});

accountController.post(
  "/add",
  /*  tokenMiddleware,
  userTypeMiddleware([
    
    "admin",
  ]), */
  async (req, res) => {
    try {
      const codeExpiration = moment().add(15, "minutes");
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

        userType,
        profilePicture,
        attempt,
        verificationCode,
      } = req.body;
      let password = "sagip";
      if (typeof status === "string") userType = userType.toLowerCase();

      if (isEmpty(userType)) error["userType"] = "Required field";

      if (isEmpty(email)) {
        error["email"] = "Required field";
      } else {
        if (isEmail(email)) {
          error["email"] = "Invalid email address";
        } else {
          if (await isEmailExists(email)) {
            error["email"] = "Email address already taken";
          }
        }
      }

      if (isEmpty(contactNumber)) {
        error["contactNumber"] = "Required field";
      } else {
        if (isContactNumber(contactNumber)) {
          error["contactNumber"] = "Invalid contact number";
        } else {
          if (await isContactNumberExists(contactNumber)) {
            error["contactNumber"] = "Contact number already taken";
          }
        }
      }

      if (isEmpty(firstname)) error["firstname"] = "Required field";
      if (isEmpty(middlename)) error["middlename"] = "Required field";
      if (isEmpty(lastname)) error["lastname"] = "Required field";

      if (Object.keys(error).length == 0) {
        profilePicture = "default.jpg";
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
          emailStatus: "verified",
          isBanned: false,
          profilePicture,
          attempt,
          verificationCode: 0,
          codeExpiration,
          userType,
          status: "verified",
          isOnline: false,
        });

        if (user) {
          req.io.emit("user");
          createAuditTrail(
            req.user.id,
            user._id,
            "User",
            "User",
            "Add",
            `Added a new ${userType}, ${user.firstname} ${user.lastname}`
          );
          return res.status(200).json({
            success: true,
            message: "Created Successfully",
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
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
        message: "Internal Server Error: " + error,
      });
    }
  }
);

accountController.put(
  "/reactivate",
  tokenMiddleware,
  //   userTypeMiddleware([
  //       "responder",
  //   "dispatcher",
  //   "employee",
  //   "admin",
  // ]),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          isArchived: false,
          $unset: { archivedDate: Date.now() },
        },
        { new: true }
      );
      if (user) {
        createAuditTrail(
          req.user.id,
          user._id,
          "User",
          "User",
          "Reactivate",
          `Reactivated ${user.firstname} ${user.lastname}'s account`
        );
        return res.status(200).json({
          success: true,
          message: "Account Reactivated",
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

accountController.delete(
  "/delete/:id",
  tokenMiddleware,
  /* userTypeMiddleware(["admin"]), */
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      await user.remove();

      if (user) {
        if (user.profilePicture !== "default.jpg") {
          await cloudinaryUploader(
            "destroy",
            "",
            "image",
            folderPath,
            user.profilePicture
          );
        }

        user.verificationPicture.map(async (picture) => {
          await cloudinaryUploader(
            "destroy",
            "",
            "image",
            "sagip/media/verification-request",
            picture
          );
        });

        req.io.emit(`${user._id}`);

        req.io.emit("user");
        createAuditTrail(
          req.user.id,
          user._id,
          "User",
          "User",
          "Delete",
          `Deleted ${user.firstname} ${user.lastname}'s account`
        );
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

accountController.put(
  "/update/:action/send-code",
  tokenMiddleware,
  /*  userTypeMiddleware([
    "resident",
    "responder",
    "dispatcher",
    "employee",
    "admin",
  ]), */
  async (req, res) => {
    try {
      const error = {};

      let action = req.params.action.toLowerCase();

      let contactNumber;
      let email;
      if (
        action === "contact-number" ||
        action === "email" ||
        action === "verify-email"
      ) {
        if (action === "contact-number") {
          contactNumber = req.body.contactNumber;

          if (isEmpty(contactNumber)) {
            error["contactNumber"] = "Required field";
          } else {
            if (isContactNumber(contactNumber)) {
              error["contactNumber"] = "Invalid contact number";
            } else {
              if (await isContactNumberExists(contactNumber)) {
                if (await isContactNumberOwner(req.user.id, contactNumber)) {
                  error["contactNumber"] = "Input a new contact numebr";
                } else {
                  error["contactNumber"] = "Contact number already taken";
                }
              }
            }
          }
        }
        if (action === "email" || action === "verify-email") {
          email = req.body.email;

          if (isEmpty(email)) {
            error["email"] = "Required field";
          } else {
            if (isEmail(email)) {
              error["email"] = "Invalid email address";
            } else {
              if (await isEmailExists(email)) {
                if (await isEmailOwner(req.user.id, email)) {
                  if (action !== "verify-email")
                    error["email"] = "input a new email address";
                } else {
                  error["email"] = "Email address already taken";
                }
              }
            }
          }
        }
        if (Object.keys(error).length == 0) {
          const user = await updateVerificationCode(req.user.id);
          if (action === "contact-number") {
            console.log("send sms");
            sendSMS(contactNumber, "sms-verification", user.verificationCode);
          }

          if (action === "email" || action === "verify-email") {
            console.log("send email");
            sendEmail(email, "email-verification", user.verificationCode);
          }
          if (user) {
            if (action === "contact-number") {
              return res.status(200).json({
                success: true,
                message: `Verification code has been sent to ${contactNumber}`,
                user: {
                  target: "login",
                  id: user._doc._id,
                  userType: user._doc.userType,
                  status: user._doc.status,
                },
                token: generateToken(
                  "new-password",
                  user._doc._id,
                  user._doc.userType,
                  user._doc.status,
                  "7d",
                  contactNumber
                ),
              });
            }
            if (action === "email" || action === "verify-email") {
              return res.status(200).json({
                success: true,
                message: `Verification code has been sent to ${email}`,
                user: {
                  target: "login",
                  id: user._doc._id,
                  userType: user._doc.userType,
                  status: user._doc.status,
                },
                token: generateToken(
                  "new-password",
                  user._doc._id,
                  user._doc.userType,
                  user._doc.status,
                  "7d",
                  email
                ),
              });
            }
          } else {
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
            });
          }
        }

        if (Object.keys(error).length != 0) {
          error["success"] = false;
          error["message"] = "input error";

          return res.status(400).json(error);
        }
      } else {
        return res.status(500).json({
          success: false,
          message: "Error 404: Not Found" + error,
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

accountController.put(
  "/reset-password/:id",
  tokenMiddleware,
  /*  userTypeMiddleware([
    "resident",
    "responder",
    "dispatcher",
    "employee",
    "admin",
  ]), */
  async (req, res) => {
    try {
      const error = {};

      const password = "sagip";

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      if (Object.keys(error).length == 0) {
        const user = await User.findByIdAndUpdate(req.params.id, {
          attempt: 0,
          password: hashedPassword,
        });

        if (user) {
          createAuditTrail(
            req.user.id,
            user._id,
            "User",
            "User",
            "Reset Password",
            `Reset the password of ${user.firstname} ${user.lastname}`
          );
          return res.status(200).json({
            success: true,
            message: "Password has been reset successfullyy",
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
        }
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
      });
    }
  }
);

accountController.put(
  "/:action/update/:id",
  /*  userTypeMiddleware([
    "resident",
    "responder",
    "dispatcher",
    "employee",
    "admin",
  ]), */

  multerMiddleware.single("image"),
  async (req, res) => {
    try {
      const error = {};
      let {
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

        isBanned,
        isArchived,
        hasChanged,
      } = req.body;

      if (req.params.action === "info") {
        if (isEmpty(userType)) error["userType"] = "Required field";
        if (isEmpty(email)) {
          error["email"] = "Required field";
        } else {
          if (isEmail(email)) {
            error["email"] = "Invalid email address";
          } else {
            if (await isEmailExists(email)) {
              if (await isEmailOwner(req.params.id, email)) {
                /*   error["email"] = "input a new email address"; */
              } else {
                error["email"] = "Email address already taken";
              }
            }
          }
        }
      }

      if (req.params.action === "profile") {
        if (isEmpty(firstname)) error["firstname"] = "Required field";
        if (isEmpty(lastname)) error["lastname"] = "Required field";
        if (isEmpty(middlename)) error["middlename"] = "Required field";

        if (isEmpty(birthdate)) error["birthdate"] = "Required field";
        if (isEmpty(gender)) error["gender"] = "Required field";

        if (isEmpty(region)) error["region"] = "Required field";
        if (isEmpty(province)) error["province"] = "Required field";
        if (isEmpty(municipality)) error["municipality"] = "Required field";

        if (isEmpty(barangay)) error["barangay"] = "Required field";
        if (isEmpty(street)) error["street"] = "Required field";
      }

      if (hasChanged === "true") {
        if (!req.file) {
          error["profilePicture"] = "Required field";
        } else {
          if (isImage(req.file.originalname)) {
            error["profilePicture"] =
              "Only PNG, JPEG, and JPG files are allowed";
          } else {
            if (isLessThanSize(req.file, 10 * 1024 * 1024)) {
              error["profilePicture"] = "File size should be less than 10MB";
            }
          }
        }
      }

      if (Object.keys(error).length == 0) {
        const updateFields = {
          firstname,
          middlename,
          lastname,
          isBanned,
          isArchived,
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

          hasChanged,
        };

        if (!isBanned) {
          updateFields.dismissedRequestCount = 0;
        }
        if (isArchived === true || isArchived === "true") {
          updateFields.archivedDate = Date.now();
        } else {
          updateFields.$unset = { archivedDate: Date.now() };
        }

        if (hasChanged && req.file) {
          const userImage = await User.findById(req.params.id);
          if (!userImage.profilePicture.includes("default")) {
            await cloudinaryUploader(
              "destroy",
              "",
              "image",
              folderPath,
              userImage.profilePicture
            );
          }

          const cloud = await cloudinaryUploader(
            "upload",
            req.file.path,
            "image",
            folderPath,
            req.file.filename
          );
          updateFields.profilePicture = `${cloud.original_filename}.${cloud.format}`;
          if (cloud !== "error") {
            /*  safetyTip.image = `${cloud.public_id.split("/").pop()}.${
                cloud.format
              }`; */
          } else {
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
            });
          }
        }

        const user = await User.findByIdAndUpdate(req.params.id, updateFields, {
          new: true,
        });

        if (user) {
          if (!(user.userType === "resident")) {
            if (action === "info") {
              createAuditTrail(
                req.user.id,
                user._id,
                "User",
                "User",
                "Update",
                `Updated ${user.firstname} ${user.lastname}'s account`
              );
            } else {
              createAuditTrail(
                req.user.id,
                user._id,
                "User",
                "User",
                "Update",
                `Updated its account profile`
              );
            }
          }
          req.io.emit("user");
          req.io.emit(`${req.params.id}`);

          if (isBanned) {
            req.io.emit(`logout-${req.params.id}`, {
              message:
                "You have been logged out as your account has been suspended. Please contact us if you think this isn't right.",
            });
          }

          return res.status(200).json({
            success: true,
            message: "Profile Updated Successfully",
            user,
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
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
        message: "Internal Server Error: " + error,
      });
    }
  }
);
accountController.put(
  "/update/profile-picture/",

  /*  userTypeMiddleware([
    "resident",
    "responder",
    "dispatcher",
    "employee",
    "admin",
  ]), */
  tokenMiddleware,
  multerMiddleware.single("image"),
  async (req, res) => {
    try {
      const error = {};

      if (!req.file) {
        error["profilePicture"] = "Required field";
      } else {
        if (isImage(req.file.originalname)) {
          error["profilePicture"] = "Only PNG, JPEG, and JPG files are allowed";
        } else {
          if (isLessThanSize(req.file, 10 * 1024 * 1024)) {
            error["profilePicture"] = "File size should be less than 10MB";
          }
        }
      }

      if (Object.keys(error).length == 0) {
        const updateFields = {};

        if (req.file) {
          const userImage = await User.findById(req.user.id);
          if (!userImage.profilePicture.includes("default")) {
            await cloudinaryUploader(
              "destroy",
              "",
              "image",
              folderPath,
              userImage.profilePicture
            );
          }

          const cloud = await cloudinaryUploader(
            "upload",
            req.file.path,
            "image",
            folderPath,
            req.file.filename
          );
          updateFields.profilePicture = `${cloud.original_filename}.${cloud.format}`;
          if (cloud !== "error") {
          } else {
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
            });
          }
        }

        const user = await User.findByIdAndUpdate(req.user.id, updateFields, {
          new: true,
        });

        if (user) {
          req.io.emit(`${req.user.id}`);
          req.io.emit("user");
          if (!(user.userType === "resident")) {
            createAuditTrail(
              req.user.id,
              user._id,
              "User",
              "User",
              "Update",
              `Updated its account profile`
            );
          }
          return res.status(200).json({
            success: true,
            message: "Profile Picture Updated Successfully",
            user,
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
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
        message: "Internal Server Error: " + error,
      });
    }
  }
);

accountController.put(
  "/myaccount/:action",
  tokenMiddleware,
  /* userTypeMiddleware([
  "resident",
  "responder",
  "dispatcher",
  "employee",
  "admin",
]), */
  async (req, res) => {
    await handleArchive(req.params.action, req.user.id, req, res);
  }
);

accountController.put(
  "/:action/:id",
  tokenMiddleware,
  /* userTypeMiddleware([
  "resident",
  "responder",
  "dispatcher",
  "employee",
  "admin",
]), */
  async (req, res) => {
    await handleArchive(req.params.action, req.params.id, req, res);
  }
);

accountController.put("/fcm", async (req, res) => {
  try {
    const { identifier, fcmToken } = req.body;

    let userIdentifierType = await checkIdentifierType(identifier);

    if (!userIdentifierType) {
      error["identifier"] = "not found";
    } else {
      let query;
      if (userIdentifierType === "contactNumber") {
        query = {
          contactNumber: identifier,
        };
      } else if (userIdentifierType === "email") {
        query = {
          email: identifier,
        };
      }

      const user = await User.findOne(query);

      if (user) {
        const existingUser = await User.findOne({ fcmToken: fcmToken });

        if (existingUser) {
          existingUser.fcmToken = existingUser.fcmToken.filter(
            (token) => token !== fcmToken
          );
          await existingUser.save();
        }

        user.fcmToken.push(fcmToken);
        await user.save();

        return res.status(200).json({
          success: true,
          message: "Updated Successfully",
        });
      } else {
        return res.status(400).json({
          success: true,
          message: "Internal Server Error1",
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error,
    });
  }
});
accountController.put("/remove-fcm", async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const result = await User.updateMany({ $pull: { fcmToken: fcmToken } });

    if (result.nModified > 0) {
      return res.status(200).json({
        success: true,
        message: "Removed Successfully",
      });
    } else {
      return res.status(400).json({
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

accountController.put(
  "/new-password",
  tokenMiddleware,
  /* userTypeMiddleware([
  "resident",
  "responder",
  "dispatcher",
  "employee",
  "admin",
]), */ async (req, res) => {
    try {
      const error = {};
      const { password, confirmPassword, oldPassword } = req.body;
      const oldUserPassword = await User.findOne({
        _id: req.user.id,
      });

      if (isEmpty(oldPassword)) {
        error["oldPassword"] = "Required field";
      } else {
        if (
          !(
            oldUserPassword &&
            (await bcrypt.compare(oldPassword, oldUserPassword.password))
          )
        ) {
          error["oldPassword"] = "Incorrect password";
        }
      }
      if (isEmpty(password)) {
        error["password"] = "Required field";
      } else {
        if (verifyPassword(password)) {
          error["password"] = "";
        } else {
          if (await bcrypt.compare(password, oldUserPassword.password)) {
            error["password"] =
              "Password must not be the same as the old password";
          }
        }
      }

      if (isEmpty(confirmPassword)) {
        error["confirmPassword"] = "Required field";
      } else {
        if (!isEmpty(password)) {
          if (password !== confirmPassword) {
            error["confirmPassword"] = "Password did not match";
          }
        }
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      if (Object.keys(error).length == 0) {
        const user = await User.findByIdAndUpdate(req.user.id, {
          verificationCode: 0,
          password: hashedPassword,
        });

        if (user) {
          if (req.body.for) {
            if (!(user.userType === "resident")) {
              createAuditTrail(
                req.user.id,
                user._id,
                "User",
                "User",
                "Update",
                `Updated its account password`
              );
            }
            return res.status(200).json({
              success: true,
              message:
                "Your password has been changed successfully. You can now login with your new password",
            });
          } else {
            /* createNotification(
              req,
              [req.user.id],
              req.user.id,
              "Password Changed!",
              "Your password has been changed successfully.",
              "info"
            ); */
            return res.status(200).json({
              success: true,
              message: "Your password has been changed successfully",
            });
          }
        } else {
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
        }
      }

      if (Object.keys(error).length != 0) {
        console.log("error");
        error["message"] = "input error";
        res.status(400).json(error);
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
      });
    }
  }
);

accountController.get("/myprofile", tokenMiddleware, async (req, res) => {
  getUserInfo(req.user.id, res);
});
accountController.get("/:id", async (req, res) => {
  getUserInfo(req.params.id, res);
});

const getUserInfo = async (id, res) => {
  try {
    const user = await User.findById(id);

    if (user) {
      return res.status(200).json({
        success: true,
        message: "found",
        ...user._doc,
      });
    } else {
      return res.status(200).json({
        success: false,
        message: "not found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "not found",
    });
  }
};

module.exports = accountController;
