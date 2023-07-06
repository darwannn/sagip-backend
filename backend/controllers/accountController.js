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
  checkIdentifier,
  isEmail,
  isContactNumber,
  generateCode,
  updateVerificationCode,
  cloudinaryUploader,
} = require("./functionController");

const tokenMiddleware = require("../middlewares/tokenMiddleware");

const currentDate = new Date();
const codeExpiration = new Date(currentDate.getTime() + 30 * 60000);

const multerMiddleware = require("../middlewares/multerMiddleware");

const folderPath = "sagip/media/user";

const userTypeMiddleware = require("../middlewares/userTypeMiddleware");
const { createPusher } = require("./apiController");

accountController.get("/", async (req, res) => {
  try {
    const user = await User.find({});

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
  "/create",
  /*  tokenMiddleware,
  userTypeMiddleware([
    
    "super-admin",
  ]), */
  async (req, res) => {
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
        error["contact"] = "Required field";
      } else {
        if (isContactNumber(contactNumber)) {
          error["contact"] = "Invalid Contact Number";
        } else {
          if (await isContactNumberExists(contactNumber)) {
            error["contact"] = "Contact number already taken";
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
        profilePicture = "default.png";
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
          status: "verified",
        });

        /* const notification = await Notification.create({
        userId: user._doc._id,
        notifications: [],
      }); */

        if (user) {
          /*   sendSMS(`Your SAGIP verification code is ${verificationCode}`,user.contactNumber) */
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
        if (user.profilePicture !== "default.png") {
          const cloud = await cloudinaryUploader(
            "destroy",
            "",
            "image",
            folderPath,
            user.profilePicture
          );
        }
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

accountController.put(
  "/update/contact-number",
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
      let { contactNumber } = req.body;

      const updateFields = {
        contactNumber,
      };

      const user = await User.findByIdAndUpdate(req.user.id, updateFields, {
        new: true,
      });

      if (user) {
        return res.status(200).json({
          success: true,
          message: "Contact Number Updated Successfully",
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
      const error = {};

      let action = req.params.action.toLowerCase();
      if (action === "contact-number") {
        console.log("====================================");
        console.log(action);
        console.log("====================================");
        let { contactNumber } = req.body;

        if (isEmpty(contactNumber)) {
          error["contact"] = "Required field";
        } else {
          if (isContactNumber(contactNumber)) {
            error["contact"] = "Invalid contact number";
          } else {
            if (await isContactNumberExists(contactNumber)) {
              if (await isContactNumberOwner(req.user.id, contactNumber)) {
                error["contact"] = "Input a new contact numebr";
              } else {
                error["contact"] = "Contact number already taken";
              }
            }
          }
        }

        if (Object.keys(error).length == 0) {
          const user = await updateVerificationCode(req.user.id);

          if (user) {
            //console.log("Current COde: " + generatedCode);

            return res.status(200).json({
              success: true,
              message: "Verification code has been resent",
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
      //default password
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
            message: "Password has been reset successfully",
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
  "/update/:id",
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
        isBanned,
        isArchived,
        hasChanged,
      } = req.body;
      if (typeof status === "string") {
        userType = userType.toLowerCase();
        status = status.toLowerCase();
      }
      if (isEmpty(status)) error["status"] = "Required field";
      if (isEmpty(userType)) error["userType"] = "Required field";
      if (isEmpty(email)) {
        error["email"] = "Required field";
      } else {
        if (isEmail(email)) {
          error["email"] = "Invalid email address";
        } else {
          if (await isEmailExists(email)) {
            if (await isEmailOwner(id, email)) {
              /*   error["email"] = "input a new email address"; */
            } else {
              error["email"] = "Email address already taken";
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
          if (isImage(req.file.originalname)) {
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
          status,
          hasChanged,
        };
        console.log("isArchived");
        console.log(isArchived);
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
          updateFields.profilePicture = req.file.filename;

          const cloud = await cloudinaryUploader(
            "upload",
            req.file.path,
            "image",
            folderPath,
            req.file.filename
          );
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
          /* await createPusher("user", "reload", {});  */
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
    try {
      let updateFields = {};
      let action = req.params.action.toLowerCase();
      if (action === "unarchive" || action === "archive") {
        console.log(action);
        if (action === "archive") {
          updateFields = {
            isArchived: true,
            archivedDate: Date.now(),
            status: "inactive",
          };
        } else if (action === "unarchive") {
          updateFields = {
            isArchived: false,
            $unset: { archivedDate: Date.now() },
          };
        }
        const user = await User.findByIdAndUpdate(
          req.params.id,
          updateFields,

          { new: true }
        );
        if (user) {
          /* await createPusher("user", "reload", {}); */
          if (action === "archive") {
            return res.status(200).json({
              success: true,
              message: "Archived Successfully",
            });
          } else if (action === "unarchive") {
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
  }
);

accountController.put("/fcm", async (req, res) => {
  try {
    const { identifier, fcmToken } = req.body;

    let userIdentifier = await checkIdentifier(identifier);

    if (!userIdentifier) {
      error["identifier"] = "not found";
    } else {
      let query;
      if (userIdentifier === "contactNumber") {
        query = {
          contactNumber: identifier,
        };
      } else if (userIdentifier === "email") {
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

accountController.get(
  "/:id",
  /* tokenMiddleware, */ async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (user) {
        /* console.log("====================================");
      console.log(user._doc._id);
      console.log(req.user.id);
      console.log(user._doc.archivedDate);
      console.log("====================================");
      if (
        req.user.id === user._doc._id.toString() &&
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
  }
);

module.exports = accountController;
