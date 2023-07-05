const authController = require("express").Router();
const User = require("../models/User");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");

const {
  isEmpty,
  isEmailExists,
  isContactNumberExists,
  checkIdentifier,
  isEmail,
  isContactNumber,
  isNumber,
  isLessThanSize,
  isImage,
  generateCode,
  generateToken,
  updateVerificationCode,
  cloudinaryUploader,
} = require("./functionController");
const { createNotification } = require("./notificationController");

const tokenMiddleware = require("../middlewares/tokenMiddleware");
// const isBanned = require('../middlewares/authMiddleware')

/* const currentDate = new Date(); */
const codeExpiration = new Date(new Date().getTime() + 30 * 60000);

const multerMiddleware = require("../middlewares/multerMiddleware");

const folderPath = "sagip/media/user";

const userTypeMiddleware = require("../middlewares/userTypeMiddleware");
const { createPusher } = require("./apiController");

authController.post("/register", async (req, res) => {
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
      confirmPassword,
      profilePicture,
      attempt,
      verificationCode,
    } = req.body;

    /*  if (status === "verified") {
      if (isEmpty(userType)) error["userType"] = "Required field";
    } */

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
        error["password"] = "Password requirement not met";
      }
    } */

    /* if (isEmpty(confirmPassword)) {
      error["confirmPassword"] = "Required field";
    } else {
      if (!isEmpty(password)) {
        if (password !== confirmPassword) {
          error["confirmPassword"] = "Password did not match";
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
        verificationCode,
        codeExpiration,

        userType: "resident",
        status: "unverified",
      });

      /* const notification = await Notification.create({
        userId: user._doc._id,
        notifications: [],
      }); */
      if (user) {
        console.log("success");

        /*   sendSMS(`Your SAGIP verification code is ${verificationCode}`,user.contactNumber) */

        if (verificationCode !== 0) {
          return res.status(200).json({
            success: true,
            message: "A verification has been sent to your contact number",
            user: {
              for: "register",
              id: user._doc._id,
              userType: user._doc.userType,
              status: user._doc.status,
            },
            token: generateToken(user._id),
          });
        } else {
          return res.status(200).json({
            success: true,
            message: "Created Successfully",
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error,
    });
  }
});

authController.put(
  "/contact-verification/:action",
  tokenMiddleware,
  //   userTypeMiddleware([
  //   "resident",
  //   "responder",
  //   "dispatcher",
  //   "admin",
  //   "super-admin",
  // ]),
  async (req, res) => {
    try {
      const error = {};
      const { code } = req.body;
      const userId = req.user.id;
      let action = req.params.action.toLowerCase();

      if (
        action === "register" ||
        action === "forgot-password" ||
        action === "login" ||
        action === "contact"
      ) {
        if (isEmpty(code)) {
          error["code"] = "Required field";
        } else if (isNumber(code)) {
          error["code"] = "Invalid code";
        }

        if (Object.keys(error).length == 0) {
          const user = await User.findById(userId);
          if (user) {
            const currentTimestamp = Date.now();
            if (currentTimestamp > user.codeExpiration) {
              const user = await updateVerificationCode(req.user.id);
              if (user) {
                return res.status(200).json({
                  success: false,
                  message:
                    "Verification code has expired. A new verification code has been sent",
                });
              } else {
                return res.status(200).json({
                  success: false,
                  message: "Verification code has expired.",
                });
              }
            } else {
              console.log("====================================");
              console.log(code);
              console.log(user.verificationCode);
              console.log("====================================");
              if (parseInt(code) === user.verificationCode) {
                if (user.codeExpiration)
                  if (user.status == "unverified") {
                    user.status = "semi-verified";
                  }
                user.attempt = 0;
                user.verificationCode = 0;
                await user.save();

                if (action === "register")
                  return res.status(200).json({
                    success: true,
                    message:
                      "Verified successfully. You can now use your account!",
                    user: {
                      for: "login",
                      id: user._doc._id,
                      userType: user._doc.userType,
                      status: user._doc.status,
                      email: user._doc.email,
                    },
                    token: generateToken(user._id),
                  });

                if (action === "forgot-password")
                  return res.status(200).json({
                    success: true,
                    message: "Enter your new password",
                    user: {
                      for: "new-password",
                      id: user._doc._id,
                      userType: user._doc.userType,
                      status: user._doc.status,
                    },
                    token: generateToken(user._id),
                  });
                if (action === "login")
                  return res.status(200).json({
                    success: true,
                    message:
                      "Verified successfully. You can now use your account!",
                    user: {
                      for: "login",
                      id: user._doc._id,
                      userType: user._doc.userType,
                      status: user._doc.status,
                    },
                    token: generateToken(user._id),
                  });
                if (action === "contact") {
                  /*  return res.status(200).json({
                    success: true,
                    message: "Contact number has been updated successfully",
                  }); */

                  let { contactNumber } = req.body;
                  console.log("====================================");
                  console.log(contactNumber);
                  console.log("====================================");
                  const userContactNumber = await User.findByIdAndUpdate(
                    req.user.id,
                    { contactNumber },
                    {
                      new: true,
                    }
                  );
                  if (userContactNumber) {
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
                }
              } else {
                error["code"] = "Incorrect verification code";
                user.attempt += 1;
                await user.save();
              }
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
/* authController.post(
  "/contact-verification",
  tokenMiddleware,
//   userTypeMiddleware([
//   "resident",
//   "responder",
//   "dispatcher",
//   "admin",
//   "super-admin",
// ]),
  async (req, res) => {
    try {
      const error = {};
      const { code, type } = req.body;
      const userId = req.user.id;

      if (isEmpty(code)) {
        error["code"] = "Required field";
      } else if (isNumber(code)) {
        error["code"] = "Invalid code";
      }

      if (Object.keys(error).length == 0) {
        const user = await User.findById(userId);
        if (user) {
          const currentTimestamp = Date.now();
          if (currentTimestamp > user.codeExpiration) {
            const user = await updateVerificationCode(req.user.id);
            if (user) {
              return res.status(200).json({
                success: false,
                message:
                  "Verification code has expired. A new verification code has been sent",
              });
            } else {
              return res.status(200).json({
                success: false,
                message: "Verification code has expired.",
              });
            }
          } else {
            console.log("====================================");
            console.log(code);
            console.log(user.verificationCode);
            console.log("====================================");
            if (parseInt(code) === user.verificationCode) {
              if (user.codeExpiration)
                if (user.status == "unverified") {
                  user.status = "semi-verified";
                }
              user.attempt = 0;
              user.verificationCode = 0;
              await user.save();

              if (type === "register")
                return res.status(200).json({
                  success: true,
                  message:
                    "Verified successfully. You can now use your account!",
                  user: {
                    for: "login",
                    id: user._doc._id,
                    userType: user._doc.userType,
                    status: user._doc.status,
                    email: user._doc.email,
                  },
                  token: generateToken(user._id),
                });

              if (type === "forgot-password")
                return res.status(200).json({
                  success: true,
                  message: "Enter your new password",
                  user: {
                    for: "new-password",
                    id: user._doc._id,
                    userType: user._doc.userType,
                    status: user._doc.status,
                  },
                  token: generateToken(user._id),
                });
              if (type === "login")
                return res.status(200).json({
                  success: true,
                  message:
                    "Verified successfully. You can now use your account!",
                  user: {
                    for: "login",
                    id: user._doc._id,
                    userType: user._doc.userType,
                    status: user._doc.status,
                  },
                  token: generateToken(user._id),
                });
              if (type === "contact")
                return res.status(200).json({
                  success: true,
                  message: "Contact number has been updated successfully",
                });
            } else {
              error["code"] = "Incorrect verification code";
              user.attempt += 1;
              await user.save();
            }
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
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
      });
    }
  }
); */

authController.post(
  "/password-verification",
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
      const { password } = req.body;

      console.log("req.body");
      if (isEmpty(password)) {
        return res.status(200).json({
          success: true,
          message: "input error",
          password: "Required field",
        });
      } else {
        const user = await User.findOne({
          _id: req.user.id,
        });

        if (user && (await bcrypt.compare(password, user.password))) {
          return res.status(200).json({
            success: true,
            message: "Password Matches",
            for: "edit-password",
          });
        } else {
          return res.status(200).json({
            success: false,
            message: "input error",
            password: "Incorrect Password",
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

authController.post("/login", async (req, res) => {
  try {
    const error = {};
    const { identifier, password } = req.body;
    let user;
    if (isEmpty(identifier)) {
      error["identifier"] = "Required field";
    } else {
      user = await checkIdentifier(identifier);
      if (!user) {
        error["identifier"] = "Account does not exist";
      }
    }
    if (isEmpty(password)) error["password"] = "Required field";

    if (Object.keys(error).length == 0) {
      if (user.attempt >= 100) {
        let generatedCode = await generateCode();
        user.verificationCode = generatedCode;
        await user.save();

        return res.status(500).json({
          success: false,
          message: "Maximum login attempts exceeded",
          attempt: true,
        });
      } else {
        if (user && (await bcrypt.compare(password, user.password))) {
          if (user.isBanned) {
            return res.status(500).json({
              success: false,
              message:
                "Account suspended. Please contact us if you think this isn't right",
            });
          } else {
            // Check if the user has exceeded the maximum number of attempts

            // Reset the attempt number if the password is correct
            user.attempt = 0;
            await user.save();

            return res.status(200).json({
              success: true,
              message: "Login Successfully",
              user: {
                for: "login",
                id: user._doc._id,
                userType: user._doc.userType,
                status: user._doc.status,
              },
              token: generateToken(user._id),
            });
          }
        } else {
          error["password"] = "Incorrect password";
          console.log(user.attempt);
          user.attempt++;
          await user.save();
        }
      }
    }

    if (Object.keys(error).length != 0) {
      error["success"] = false;
      error["message"] = "input error";
      return res.status(500).json(error);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error,
    });
  }
});

authController.post("/forgot-password", async (req, res) => {
  let accountExists;
  try {
    const error = {};
    const identifier = req.body.identifier;

    if (isEmpty(identifier)) {
      error["identifier"] = "Required field";
    } else {
      accountExists = await checkIdentifier(identifier);
      if (!accountExists) {
        error["identifier"] = "Account does not exist";
      }
    }

    if (Object.keys(error).length == 0) {
      let generatedCode = await generateCode();
      console.log(accountExists.id);

      const user = await User.findByIdAndUpdate(accountExists.id, {
        verificationCode: generatedCode,
        codeExpiration: codeExpiration,
      });

      if (user) {
        /*     sendSMS(`Your SAGIP verification code is ${verificationCode}`,user.contactNumber) */
        if (user.isBanned) {
          return res.status(500).json({
            success: false,
            message:
              "Account suspended. Please contact us if you think this isn't right",
          });
        } else {
          //console.log("Current COde: " + generatedCode);
          return res.status(200).json({
            success: true,
            message: `Verification code has been sent to ${user._doc.contactNumber}`,
            user: {
              for: "forgot-password",
              id: user._doc._id,
              userType: user._doc.userType,
              status: user._doc.status,
            },
            token: generateToken(user._id),
          });
        }
      } else {
        error["error"] = "Database Error";
        error["success"] = false;
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
});

authController.put(
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
      const { password, confirmPassword } = req.body;

      /* if (isEmpty(password)) {
      error["password"] = "Required field";
    } else {
      if (verifyPassword(password)) {
        error["password"] = "Password requirement not met";
      }
    } */

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
                "Password has been changed successfully. You can now login with your new password",
            });
          } else {
            return res.status(200).json({
              success: true,
              message: "Password has been changed successfully",
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

//general resend
authController.put(
  "/resend-code",
  tokenMiddleware,
  /* userTypeMiddleware([
  "resident",
  "responder",
  "dispatcher",
  "admin",
  "super-admin",
]), */ async (req, res) => {
    try {
      console.log("====================================");
      console.log("resend");
      console.log("====================================");
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
    } catch (error) {
      // If an exception occurs, respond with an internal server error
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
      });
    }
  }
);

/* -----------------------verification request */

//create verification request
authController.put(
  "/verify-identity",
  tokenMiddleware,
  /* userTypeMiddleware([
  "resident",
  "responder",
  "dispatcher",
  "admin",
  "super-admin",
]), */
  multerMiddleware.single("selfieImage"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(500).json({
          success: false,
          image: "Required field",
          message: "input error",
        });
      } else {
        if (isImage(req.file.originalname)) {
          return res.status(500).json({
            success: false,
            image: "Only PNG, JPEG, and JPG files are allowed",
            message: "input error",
          });
        } else {
          if (isLessThanSize(req.file, 10 * 1024 * 1024)) {
            return res.status(500).json({
              success: false,
              image: "File size should be less than 10MB",
              message: "input error",
            });
          }
        }
      }
      const cloud = await cloudinaryUploader(
        "upload",
        req.file.path,
        "image",
        folderPath,
        req.file.filename
      );

      if (cloud !== "error") {
        const user = await User.findByIdAndUpdate(
          req.user.id,
          {
            $push: {
              verificationPicture: `${cloud.original_filename}.${cloud.format}`,
            },
            $set: {
              verificationRequestDate: Date.now(),
            },
          },
          { new: true }
        );

        if (user) {
          return res.status(200).json({
            success: true,
            message: "Verification Request Submitted Successfully",
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
        }
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

authController.get(
  "/verification-request",
  tokenMiddleware,
  /* userTypeMiddleware([
  
  "super-admin",
]), */
  /*   multerMiddleware.single("image"), */
  async (req, res) => {
    try {
      let user = await User.find({});

      user = user.filter(
        (record) =>
          record.verificationPicture.length !== 0 &&
          record.status === "semi-verified" &&
          record.verificationRequestDate
      );

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
      // If an exception occurs, respond with an internal server error
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
      });
    }
  }
);

authController.get(
  "/verify-identity/request/:id",
  tokenMiddleware,
  /* userTypeMiddleware([
  "resident",
  "responder",
  "dispatcher",
  "admin",
  "super-admin",
]), */
  /*   multerMiddleware.single("image"), */
  async (req, res) => {
    try {
      /*       console.log("====================================");
      console.log(req.params.id);
      console.log("===================================="); */
      const user = await User.findById(req.params.id);
      if (user.verificationRequestDate === undefined) {
        if (
          /* (user.verificationRequestDate === undefined &&
            user.verificationPicture.length <= 0) || */
          user.status === "verified" ||
          user.userType !== "resident"
        ) {
          return res.status(500).json({
            success: false,
            message: "not found",
          });
        } else {
          return res.status(200).json({ success: true, ...user._doc });
        }
      } else {
        return res.status(500).json({
          success: false,
          message: "pending request",
        });
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

// manage detils
authController.get(
  "/verify-identity/:id",
  tokenMiddleware,
  /* userTypeMiddleware([
  "super-admin",
]), */
  /*   multerMiddleware.single("image"), */
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      /*   if (user.verificationRequestDate === undefined) { */
      if (
        (user.verificationRequestDate === undefined &&
          user.verificationPicture.length <= 0) ||
        user.status === "verified" ||
        user.userType !== "resident"
      ) {
        return res.status(500).json({
          success: false,
          message: "not found",
        });
      } else {
        return res.status(200).json({ success: true, ...user._doc });
      }
      /*  } else {
        return res.status(500).json({
          success: false,
          message: "pending request",
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

//manage control reject or verify
/* authController.put(
  "/verification-request/:action/:id",
  tokenMiddleware,
  //   userTypeMiddleware([
  // "super-admin",
  // ]),
  async (req, res) => {
    try {
      let updateFields = {};
      let action = req.params.action.toLowerCase();
      console.log("====================================");
      console.log(action);
      console.log("====================================");
      if (action === "reject" || action === "approve") {
        const user = await User.findByIdAndUpdate(
          req.params.id,
          {
            $unset: {
              verificationRequestDate: Date.now(),
            },
          },
          { new: true }
        );

        if (action === "reject") {
          const cloud = await cloudinaryUploader(
            "destroy",
            "",
            "image",
            folderPath,
            user.verificationPicture[0]
          );

          if (cloud !== "error") {
            user.verificationPicture = [];

            await user.save();
          } else {
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
            });
          }
        } else if (action === "approve") {
          user.status = "verified";
          await user.save();
        }

        if (user) {
          if (action === "reject") {
            //sendSMS(`Verification Request Rejected`, user.contactNumber);

            await createNotification(
              [req.params.id],
              req.params.id,
              "title",
              "message",
              "category"
            );

            return res.status(200).json({
              success: true,
              message: "Verification Request Rejected",
            });
          } else if (action === "approve") {
            await createNotification(
              [req.params.id],
              req.params.id,
              "title",
              "message",
              "category"
            );
            //sendSMS(`Verification Request Approved`, user.contactNumber);

            return res.status(200).json({
              success: true,
              message: "Verification Request Approved",
            });
          }
        } else {
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
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
); */
authController.put(
  "/verification-request/:id",
  //   tokenMiddleware,
  //   userTypeMiddleware([
  // "super-admin",
  // ]),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        {
          $unset: {
            verificationRequestDate: Date.now(),
          },
        },
        { new: true }
      );

      if (req.body.action === "reject") {
        const cloud = await cloudinaryUploader(
          "destroy",
          "",
          "image",
          folderPath,
          user.verificationPicture[0]
        );

        if (cloud !== "error") {
          user.verificationPicture = [];

          await user.save();
        } else {
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
        }
      } else {
        user.status = "verified";
        await user.save();
      }

      if (user) {
        if (req.body.action === "reject") {
          //sendSMS(`Verification Request Rejected`, user.contactNumber);

          await createNotification(
            req.params.id,
            "title",
            "message",
            "category"
          );

          return res.status(200).json({
            success: true,
            message: "Verification Request Rejected",
          });
        } else {
          await createNotification(
            req.params.id,
            "title",
            "message",
            "category"
          );
          //sendSMS(`Verification Request Approved`, user.contactNumber);

          return res.status(200).json({
            success: true,
            message: "Verification Request Approved",
          });
        }
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

module.exports = authController;
