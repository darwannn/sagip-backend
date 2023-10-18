const accountController = require("express").Router();
const User = require("../models/User");
const Notification = require("../models/Notification");
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

const currentDate = new Date();

const multerMiddleware = require("../middlewares/multerMiddleware");

const folderPath = "sagip/media/user";

const userTypeMiddleware = require("../middlewares/userTypeMiddleware");

const { createPusher, sendSMS, sendEmail } = require("./apiController");
const {
  createNotification,
  createNotificationAll,
} = require("./notificationController");
const moment = require("moment");
accountController.get("/", async (req, res) => {
  try {
    const user = await User.find({});
    /* const user = await User.find({
      archivedDate: { $exists: false },
      isArchived: false,
    }); */

    if (user) {
      return res.status(200).json(user);
      return res.status(200).json({
        /* success: true,
        message: "found", 
        emergencyFacility,*/
        ...user,
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
      message: "Internal Server Error: " + error,
    });
  }
});

accountController.post(
  "/add",
  /*  tokenMiddleware,
  userTypeMiddleware([
    
    "super-admin",
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
      /* if (isEmpty(birthdate)) error["birthdate"] = "Required field";
      if (isEmpty(gender)) error["gender"] = "Required field";

      //  if (isResident === "true") {
      //   region = "Region III";
      //   province = "Bulacan";
      //   municipality = "Malolos";
      // } else {
      if (isEmpty(region)) error["region"] = "Required field";
      if (isEmpty(province)) error["province"] = "Required field";
      if (isEmpty(municipality)) error["municipality"] = "Required field";
      //  }
      if (isEmpty(barangay)) error["barangay"] = "Required field";
      if (isEmpty(street)) error["street"] = "Required field"; */

      /* if (isEmpty(password)) {
        error["password"] = "Required field";
      } else {
        if (verifyPassword(password)) {
          error["password"] = "Password requirement not met";
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
          /*  lastOnlineDate: Date.now, */
        });

        /* const notification = await Notification.create({
        userId: user._doc._id,
        notifications: [],
      }); */

        if (user) {
          req.io.emit("user");
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

accountController.delete(
  "/delete/:id",
  tokenMiddleware,
  /* userTypeMiddleware(["super-admin"]), */
  async (req, res) => {
    try {
      /*  const userImage = await User.findById(req.params.id);
    const cloud = await cloudinaryUploader(
      "destroy",
      "",
      "image",
      folderPath,
      userImage.image
    );
    if (cloud !== "error") { */
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
        /*  await createPusher(`${user._id}`, "reload", {}); */

        req.io.emit(`${user._id}`);
        /*  createNotification(req,
            req.params.id,
            req.params.id,
            "Account Deleted",
            `Your account has been deleted.`,
            "info"
          ); */
        req.io.emit("user");
        /*  await createPusher("user", "reload", {}); */
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
      /* } else {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    } */
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
      });
    }
  }
);

//ito yung endpoint para magsend ng verification code sa contact number, para mavalidate din yung contact number
accountController.put(
  "/update/:action/send-code",
  tokenMiddleware,
  /*  userTypeMiddleware([
    "resident",
    "responder",
    "dispatcher",
    "admin",
    "super-admin",
  ]), */
  async (req, res) => {
    try {
      /* const codeExpiration = moment().add(15, 'minutes'); */
      const error = {};
      console.log("====================================");
      let action = req.params.action.toLowerCase();
      console.log("action");
      console.log(action);
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
          console.log("====================================");
          console.log(user._doc.email);
          console.log(user.verificationCode);
          console.log("====================================");
          if (action === "email" || action === "verify-email") {
            console.log("send email");
            sendEmail(email, "email-verification", user.verificationCode);
          }
          if (user) {
            //console.log("Current COde: " + generatedCode);
            if (action === "contact-number") {
              /* return res.status(200).json({
                success: true,
                message: `Verification code has been sent to ${contactNumber}`,
              }); */
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
              /*  return res.status(200).json({
                success: true,
                message: `Verification code has been sent to ${email}`,
              }); */
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
    "admin",
    "super-admin",
  ]), */
  async (req, res) => {
    // Variable declaration

    try {
      const error = {};

      const password = "sagip";
      console.log(password);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      console.log(req.params.id);
      if (Object.keys(error).length == 0) {
        const user = await User.findByIdAndUpdate(req.params.id, {
          attempt: 0,
          password: hashedPassword,
        });

        if (user) {
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

//personal profile
accountController.put(
  "/:action/update/:id",
  /*  userTypeMiddleware([
    "resident",
    "responder",
    "dispatcher",
    "admin",
    "super-admin",
  ]), */

  multerMiddleware.single("image"),
  async (req, res) => {
    try {
      console.log("=================ss==================");

      console.log(req.params.action);
      console.log("====================================");
      const error = {};
      let {
        firstname,
        middlename,
        lastname,
        email,
        /*   contactNumber, */
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
        // dismissedRequestCount,
        userType,
        //status,
        isBanned,
        isArchived,
        hasChanged,
      } = req.body;
      // if (typeof status === "string") {
      //   userType = userType.toLowerCase();
      //   status = status.toLowerCase();
      // }
      // if (isEmpty(status)) error["status"] = "Required field";
      console.log("=======hasChanged=============================");

      /*   console.log(req.file.originalname); */
      console.log(region);
      console.log(province);
      console.log(municipality);
      console.log(barangay);
      console.log(hasChanged);
      console.log("====================================");

      /*  if (isEmpty(dismissedRequestCount))
        error["dismissedRequestCount"] = "Required field"; */
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
      /* if (isEmpty(contactNumber)) {
        error["contactNumber"] = "Required field";
      } else {
        if (isContactNumber(contactNumber)) {
          error["contactNumber"] = "Invalid contact number";
        } else {
          if (await isContactNumberExists(contactNumber)) {
            if (await isContactNumberOwner(req.params.id, contactNumber)) {
                // error["email"] = "input a new email address";
            } else {
              error["contactNumber"] = "Contact number already taken";
            }
          }
        }
      } */

      if (req.params.action === "profile") {
        if (isEmpty(firstname)) error["firstname"] = "Required field";
        if (isEmpty(lastname)) error["lastname"] = "Required field";
        if (isEmpty(middlename)) error["middlename"] = "Required field";

        if (isEmpty(birthdate)) error["birthdate"] = "Required field";
        if (isEmpty(gender)) error["gender"] = "Required field";

        //  if (isResident === "true") {
        //   region = "Region III";
        //   province = "Bulacan";
        //   municipality = "Malolos";
        // } else {
        if (isEmpty(region)) error["region"] = "Required field";
        if (isEmpty(province)) error["province"] = "Required field";
        if (isEmpty(municipality)) error["municipality"] = "Required field";
        // }
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
          // dismissedRequestCount,
          firstname,
          middlename,
          lastname,
          isBanned,
          isArchived,
          email,
          //contactNumber,
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
          // status,
          hasChanged,
        };
        console.log("isArchived");
        //console.log(status);
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
          /* await createPusher(`${req.params.id}`, "reload", {}); */
          req.io.emit("user");
          req.io.emit(`${req.params.id}`);
          /* await createPusher("user", "reload", {});  */

          if (isBanned) {
            req.io.emit("banned", { receiver: `${req.params.id}` });
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
    "admin",
    "super-admin",
  ]), */
  tokenMiddleware,
  multerMiddleware.single("image"),
  async (req, res) => {
    try {
      const error = {};
      /*  let { profilePicture } = req.body; */

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
          console.log("1");
          const userImage = await User.findById(req.user.id);
          if (!userImage.profilePicture.includes("default")) {
            console.log("2");
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
            console.log("3");
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

        const user = await User.findByIdAndUpdate(req.user.id, updateFields, {
          new: true,
        });

        if (user) {
          /* await createPusher(`${req.user.id}`, "reload", {}); */
          req.io.emit(`${req.user.id}`);
          req.io.emit("user");
          /* await createPusher("user", "reload", {});  */
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
  "admin",
  "super-admin",
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
  "admin",
  "super-admin",
]), */
  async (req, res) => {
    await handleArchive(req.params.action, req.params.id, req, res);
  }
);

accountController.put("/fcm", async (req, res) => {
  try {
    const { identifier, fcmToken } = req.body;

    let userIdentifierType = await checkIdentifierType(identifier);
    console.log("token");
    console.log(identifier);
    console.log(fcmToken);
    console.log(userIdentifierType);
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
        /*    console.log("existingUser");
        console.log(user); */
        if (existingUser) {
          /*     console.log(existingUser.fcmToken); */
          existingUser.fcmToken = existingUser.fcmToken.filter(
            (token) => token !== fcmToken
          );
          await existingUser.save();
        }
        /*   console.log(user.fcmToken); */
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
  "admin",
  "super-admin",
]), */ async (req, res) => {
    try {
      const error = {};
      const { password, confirmPassword, oldPassword } = req.body;
      const oldUserPassword = await User.findOne({
        _id: req.user.id,
      });
      console.log(password);
      console.log(confirmPassword);
      console.log(oldPassword);

      if (isEmpty(oldPassword)) {
        error["oldPassword"] = "Required field";
      } else {
        /* if (verifyPassword(password)) {
          error["password"] = "Password requirement not met";
        } */

        if (
          !(
            oldUserPassword &&
            (await bcrypt.compare(oldPassword, oldUserPassword.password))
          )
        ) {
          error["oldPassword"] = "Incorrect password";
        }
        console.log("====================================");
        console.log(await bcrypt.compare(password, oldUserPassword.password));
        console.log("====================================");
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
        console.log(req.user);
        const user = await User.findByIdAndUpdate(req.user.id, {
          verificationCode: 0,
          password: hashedPassword,
        });

        if (user) {
          if (req.body.for) {
            return res.status(200).json({
              success: true,
              message:
                "Your password has been changed successfully. You can now login with your new password",
            });
          } else {
            createNotification(
              req,
              [req.user.id],
              req.user.id,
              "Password Changed!",
              "Your password has been changed successfully.",
              "info"
            );
            return res.status(200).json({
              success: true,
              message: "Your password has been changed successfully",
            });
          }
        } else {
          /* error["message"] = "Database Error"; */
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
      // If an exception occurs, respond with an internal server error
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
  /* try {
      const user = await User.findOne({
        _id: req.params.id,
        archivedDate: { $exists: false },
        isArchived: false,
      });
      //const user = await User.findById(req.params.id);

      if (user) {
      //   console.log("====================================");
      // console.log(user._doc._id);
      // console.log(req.user.id);
      // console.log(user._doc.archivedDate);
      // console.log("====================================");
      // if (
      //   req.user.id === user._doc._id.toString() &&
      //   user._doc.archivedDate !== null
      // ) {
      //   return res.status(200).json({
      //     success: false,
      //     message: "account archived",
      //   });
      // } else {
        return res.status(200).json({
          success: true,
          message: "found",
          ...user._doc,
        });
         //}
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
    }*/
  getUserInfo(req.params.id, res);
});

const getUserInfo = async (id, res) => {
  try {
    /* const user = await User.findOne({
      _id: id,
      archivedDate: { $exists: false },
      isArchived: false,
    }); */
    const user = await User.findById(id);

    if (user) {
      /* console.log("====================================");
    console.log(user._doc._id);
    console.log(id);
    console.log(user._doc.archivedDate);
    console.log("====================================");
    if (
      id === user._doc._id.toString() &&
      user._doc.archivedDate !== null
    ) {
      return res.status(200).json({
        success: false,
        message: "account archived",
      });
    } else { */
      return res.status(200).json({
        success: true,
        message: "found",
        ...user._doc,
      });
      /*  } */
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
