const authController = require("express").Router();
const User = require("../models/User");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const nodemailer = require("nodemailer");
const {
  isEmpty,
  isEmailExists,
  isContactNumberExists,
  checkIdentifier,
  checkIdentifierType,
  isEmail,
  isContactNumber,
  isNumber,
  isLessThanSize,
  isImage,
  generateCode,
  generateToken,
  updateVerificationCode,
  cloudinaryUploader,
  calculateArchivedDate,
  getUsersId,
  handleArchive,
  verifyPassword,
} = require("./functionController");

const tokenMiddleware = require("../middlewares/tokenMiddleware");

const multerMiddleware = require("../middlewares/multerMiddleware");
const folderPath = "sagip/media/verification-request";

const userTypeMiddleware = require("../middlewares/userTypeMiddleware");
const { createPusher, sendSMS, sendEmail } = require("./apiController");
const {
  createNotification,
  createNotificationAll,
} = require("./notificationController");
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

    if (isEmpty(password)) {
      error["password"] = "Required field";
    } else {
      if (verifyPassword(password)) {
        error["password"] = "Password requirement not met";
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

    if (Object.keys(error).length == 0) {
      profilePicture = "default.jpg";
      attempt = 0;

      if (verificationCode !== 0) {
        verificationCode = await generateCode();
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const codeExpiration = moment().add(15, "minutes");
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
        isOnline: true,
        /*      lastOnlineDate: Date.now, */
      });

      /* const notification = await Notification.create({
        userId: user._doc._id,
        notifications: [],
      }); */
      if (user) {
        console.log("success");

        sendSMS(user.contactNumber, "register", verificationCode);
        sendEmail(user.email, "register", verificationCode);

        /*  if (verificationCode !== 0) { */
        return res.status(200).json({
          success: true,
          message: "A verification has been sent to your contact number",
          user: {
            target: "register",
            id: user._doc._id,
            userType: user._doc.userType,
            status: user._doc.status,
          },
          token: generateToken(
            "register",
            user._doc._id,
            user._doc.userType,
            user._doc.status,
            "7d",
            user._doc.contactNumber
          ),
        });
        /* } else {
          return res.status(200).json({
            success: true,
            message: "Created Successfully",
          });
        } */
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
authController.post("/validate/:action", async (req, res) => {
  try {
    const error = {};
    let action = req.params.action.toLowerCase();

    if (action === "email") {
      let email = req.body.email;
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
    }
    if (action === "contact") {
      let contactNumber = req.body.contactNumber;
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
    }

    if (action === "password") {
      let { password, confirmPassword } = req.body;
      if (isEmpty(password)) {
        error["password"] = "Required field";
      } else {
        if (verifyPassword(password)) {
          error["password"] = "Password requirement not met";
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
    }

    if (Object.keys(error).length == 0) {
      if (action === "email") {
        return res.status(200).json({
          success: true,
          message: "valid email address",
        });
      }
      if (action === "contact") {
        return res.status(200).json({
          success: true,
          message: "valid contact",
        });
      }
      if (action === "password") {
        return res.status(200).json({
          success: true,
          message: "valid password",
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
  "/verification-code/:action",
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
      console.log(code);
      if (
        action === "register" ||
        action === "forgot-password" ||
        action === "login" ||
        action === "contact" ||
        action === "email" ||
        action === "attempt"
      ) {
        if (isEmpty(code)) {
          error["verificationCode"] = "Required field";
        } else if (isNumber(code)) {
          error["verificationCode"] = "Invalid code";
        }

        if (Object.keys(error).length == 0) {
          const user = await User.findById(userId);
          if (user) {
            const currentMoment = moment();
            const codeExpirationMoment = moment(user.codeExpiration);
            const currentTimestamp = Date.now();
            console.log(user.codeExpiration);
            console.log(currentMoment);
            console.log(moment.utc(currentMoment).local().format());
            console.log(codeExpirationMoment);
            console.log(moment.utc(codeExpirationMoment).local().format());
            console.log(currentMoment.isAfter(codeExpirationMoment));
            if (!codeExpirationMoment.isAfter(currentMoment)) {
              const user = await updateVerificationCode(req.user.id);
              /*  if (user) { */
              sendSMS(user.contactNumber, "register", user.verificationCode);
              sendEmail(user.email, "register", user.verificationCode);

              return res.status(400).json({
                success: false,
                verificationCode:
                  "Verification code has expired. A new verification code has been sent",
                message: "input error",
              });
              /* } else {
                return res.status(200).json({
                  success: false,
                  message: "Internal Server Error",
                });
              } */
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

                if (action === "register") {
                  createNotification(
                    [req.user.id],
                    req.user.id,
                    "Welcome to SAGIP",
                    "Feel free to explore and reach out if you have any questions.",
                    "info"
                  );

                  return res.status(200).json({
                    success: true,
                    message:
                      "Verified successfully. You can now use your account!",
                    user: {
                      target: "login",
                      id: user._doc._id,
                      userType: user._doc.userType,
                      status: user._doc.status,
                      /* email: user._doc.email, */
                    },
                    token: generateToken(
                      "login",
                      user._doc._id,
                      user._doc.userType,
                      user._doc.status,
                      "7d",
                      ""
                    ),
                  });
                }
                if (action === "forgot-password")
                  return res.status(200).json({
                    success: true,
                    message: "Enter your new password",
                    user: {
                      target: "new-password",
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
                      ""
                    ),
                  });
                if (action === "login" || action === "attempt")
                  return res.status(200).json({
                    success: true,
                    message:
                      "Verified successfully. You can now use your account!",
                    user: {
                      target: "login",
                      id: user._doc._id,
                      userType: user._doc.userType,
                      status: user._doc.status,
                    },
                    token: generateToken(
                      "login",
                      user._doc._id,
                      user._doc.userType,
                      user._doc.status,
                      "7d",
                      ""
                    ),
                  });
                if (action === "contact") {
                  /*  return res.status(200).json({
                    success: true,
                    message: "Contact number has been updated successfully",
                  }); */
                  console.log("update contact");
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
                    /* createNotification(
                      [req.user.id],
                      req.user.id,
                      "Contact Number Updated",
                      "Your contact number has been updated.",
                      "info"
                    ); */
                    return res.status(200).json({
                      success: true,
                      message: "Contact Number Updated Successfully",
                      user: {
                        target: "login",
                        id: user._doc._id,
                        userType: user._doc.userType,
                        status: user._doc.status,
                        /*     email: user._doc.email, */
                      },
                      token: generateToken(
                        "login",
                        user._doc._id,
                        user._doc.userType,
                        user._doc.status,
                        "7d",
                        ""
                      ),
                    });
                  } else {
                    return res.status(500).json({
                      success: false,
                      message: "Internal Server Error",
                    });
                  }
                }
                if (action === "email") {
                  console.log("email");
                  let { email } = req.body;
                  console.log("====================================");
                  console.log(email);
                  console.log("====================================");
                  const userEmail = await User.findByIdAndUpdate(
                    req.user.id,
                    { email, emailStatus: "verified" },
                    {
                      new: true,
                    }
                  );
                  if (userEmail) {
                    /* createNotification(
                      [req.user.id],
                      req.user.id,
                      "Email Updated",
                      "Your email has been updated.",
                      "info"
                    ); */
                    return res.status(200).json({
                      success: true,
                      message: "Email Updated Successfully",
                      user: {
                        target: "login",
                        id: user._doc._id,
                        userType: user._doc.userType,
                        status: user._doc.status,
                        /*     email: user._doc.email, */
                      },
                      token: generateToken(
                        "login",
                        user._doc._id,
                        user._doc.userType,
                        user._doc.status,
                        "7d",
                        ""
                      ),
                    });
                  } else {
                    return res.status(500).json({
                      success: false,
                      message: "Internal Server Error",
                    });
                  }
                }
              } else {
                error["verificationCode"] = "Incorrect verification code";
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
        error["verificationCode"] = "Required field";
      } else if (isNumber(code)) {
        error["verificationCode"] = "Invalid code";
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
                    target: "login",
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
                    target: "new-password",
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
                    target: "login",
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
              error["verificationCode"] = "Incorrect verification code";
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

/* check or archive */
authController.post(
  "/password-verification/:action",
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
          if (req.params.action === "check") {
            return res.status(200).json({
              success: true,
              message: "Password Matches",
              /*  target: "edit-password", */
            });
          } else {
            handleArchive(req.params.action, req.user.id, req, res);
          }
        } else {
          return res.status(500).json({
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
      if (user.attempt >= 5) {
        let generatedCode = await generateCode();
        user.verificationCode = generatedCode;
        await user.save();
        let identifierType = await checkIdentifierType(identifier);
        // let generatedCode = await generateCode();
        // console.log(accountExists.id);

        // const user = await User.findByIdAndUpdate(accountExists.id, {
        //   verificationCode: generatedCode,
        //   codeExpiration: codeExpiration,
        // });

        if (user) {
          if (identifierType === "email") {
            sendEmail(user.email, "attempt", generatedCode);
          } else if (identifierType === "contactNumber") {
            sendSMS(user.contactNumber, "attempt", generatedCode);
          }
        }
        return res.status(200).json({
          success: false,
          message: "Maximum login attempts exceeded",
          user: {
            target: "attempt",
            id: user._doc._id,
            userType: user._doc.userType,
            status: user._doc.status,
          },
          token: generateToken(
            "attempt",
            user._doc._id,
            user._doc.userType,
            user._doc.status,
            "7d",
            identifier
          ),
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
            console.log("====================================");
            console.log(user.status);
            console.log("====================================");
            if (!(user.status === "unverified")) {
              // Check if the user has exceeded the maximum number of attempts

              // Reset the attempt number if the password is correct
              /* if (!user.archivedDate) { */
              user.attempt = 0;
              user.isOnline = true;
              user.lastOnlineDate = Date.now();
              await user.save();

              return res.status(200).json({
                success: true,
                message: "Login Successfully",
                userType: user._doc.userType,
                user: {
                  target: "login",
                  id: user._doc._id,
                  userType: user._doc.userType,
                  status: user._doc.status,
                },
                token: generateToken(
                  "login",
                  user._doc._id,
                  user._doc.userType,
                  user._doc.status,
                  "7d",
                  ""
                ),
              });
              /* } else {
              const data = calculateArchivedDate();
              if (data) {
                const { daysLeft, deletionDate } = data;
                return res.status(200).json({
                  isArchived: true,
                  success: false,
                  daysLeft,
                  deletionDate,
                  message: `Your account is scheduled for Deltetion on ${deletionDate}. 
                  To keep your account deletion scheduled in ${daysLeft}, you can simply log out.`,
                });
              }
            } */
            } else {
              /* return res.status(500).json({
                success: false,
                message: "Internal Server Error: " + error,
              }); */
              const userVerificationCode = await updateVerificationCode(
                user._id
              );
              sendSMS(
                userVerificationCode.contactNumber,
                "register",
                userVerificationCode.verificationCode
              );

              if (userVerificationCode) {
                console.log(
                  "Current COde: " + userVerificationCode.verificationCode
                );
                return res.status(200).json({
                  success: false,
                  message: `Please verify your contact number.Verification code has been send to ${userVerificationCode.contactNumber}`,
                  user: {
                    target: "register",
                    id: userVerificationCode._doc._id,
                    userType: userVerificationCode._doc.userType,
                    status: userVerificationCode._doc.status,
                  },
                  token: generateToken(
                    "register",
                    user._doc._id,
                    user._doc.userType,
                    user._doc.status,
                    "7d",
                    user.contactNumber
                  ),
                });
              }
            }
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

    console.log(accountExists);

    if (Object.keys(error).length == 0) {
      let identifierType = await checkIdentifierType(identifier);
      // let generatedCode = await generateCode();
      // console.log(accountExists.id);

      // const user = await User.findByIdAndUpdate(accountExists.id, {
      //   verificationCode: generatedCode,
      //   codeExpiration: codeExpiration,
      // });
      const user = await updateVerificationCode(accountExists.id);
      if (user) {
        if (identifierType === "email") {
          sendEmail(user.email, "forgot-password", user.verificationCode);
        } else if (identifierType === "contactNumber") {
          sendSMS(user.contactNumber, "forgot-password", user.verificationCode);
        }
        if (user.isBanned) {
          return res.status(500).json({
            success: false,
            message:
              "Account suspended. Please contact us if you think this isn't right",
          });
        } else {
          /* if (!user.archivedDate) { */
          //console.log("Current COde: " + generatedCode);

          if (identifierType === "email") {
            return res.status(200).json({
              success: true,
              message: `Verification code has been sent to ${user._doc.email}`,
              user: {
                target: "forgot-password",
                id: user._doc._id,
                userType: user._doc.userType,
                status: user._doc.status,
                identifier: identifier,
              },
              token: generateToken(
                "forgot-password",
                user._doc._id,
                user._doc.userType,
                user._doc.status,
                "7d",

                identifier
              ),
            });
          } else if (identifierType === "contactNumber") {
            return res.status(200).json({
              success: true,
              message: `Verification code has been sent to ${user._doc.contactNumber}`,
              user: {
                target: "forgot-password",
                id: user._doc._id,
                userType: user._doc.userType,
                status: user._doc.status,
              },
              token: generateToken(
                "forgot-password",
                user._doc._id,
                user._doc.userType,
                user._doc.status,
                "7d",
                identifier
              ),
            });
          }
          /* } else {
            const data = calculateArchivedDate();
            if (data) {
              const { daysLeft, deletionDate } = data;
              return res.status(200).json({
                isArchived: true,
                success: false,
                daysLeft,
                deletionDate,
                message: `Your account is scheduled for Deltetion on ${deletionDate}. 
              To keep your account deletion scheduled in ${daysLeft}, you can simply log out.`,
              });
            }
          } */
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
      const oldUserPassword = await User.findOne({
        _id: req.user.id,
      });
      if (isEmpty(password)) {
        error["password"] = "Required field";
      } else {
        if (verifyPassword(password)) {
          error["password"] = "";
        } else {
          console.log("====================================");
          console.log(password);
          console.log("====================================");
          console.log(await bcrypt.compare(password, oldUserPassword.password));
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
                "Password has been changed successfully. You can now login with your new password",
            });
          } else {
            /* createNotification(
              [req.user.id],
              req.user.id,
              "Password has been changed",
              "Your password has been changed.",
              "info"
            ); */
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
  "/resend-code/",
  tokenMiddleware,
  /* userTypeMiddleware([
  "resident",
  "responder",
  "dispatcher",
  "admin",
  "super-admin",
]), */ async (req, res) => {
    try {
      // let action = req.params.action.toLowerCase();
      // if (
      //   action === "register" ||
      //   action === "forgot-password" ||
      //   action === "login" ||
      //   action === "contact" ||
      //   action === "email"
      // ) {
      const { identifier, action } = req.body;

      // if (action === "register") {
      // }
      // if (action === "forgot-password") {
      // }

      // if (action === "login") {
      // }

      // if (action === "contact") {
      // }
      // if (action === "email") {
      // }
      console.log("====================================");
      console.log(identifier);
      console.log("====================================");
      const user = await updateVerificationCode(req.user.id);

      if (user) {
        console.log("Current COde: " + user.verificationCode);
        let identifierType = await checkIdentifierType(identifier);

        if (identifierType === "email") {
          console.log("send email");

          sendEmail(identifier, action, user.verificationCode);
        } else if (identifierType === "contactNumber") {
          console.log("send sms");
          sendSMS(identifier, action, user.verificationCode);
          /*  return res.status(200).json({
            success: true,
            message: `Verification code has been resent to ${identifier}`,
          }); */
        }
        return res.status(200).json({
          success: true,
          message: `Verification code has been resent to ${identifier}`,
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }
      // } else {
      //   return res.status(500).json({
      //     success: false,
      //     message: "Error 404: Not Found",
      //   });
      // }
    } catch (error) {
      // If an exception occurs, respond with an internal server error
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
      });
    }
  }
);
authController.post(
  "/logout",
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
      const user = await User.findByIdAndUpdate(req.user.id, {
        isOnline: false,
        lastOnlineDate: Date.now(),
      });

      if (user) {
        return res.status(200).json({
          success: true,
          message: "Logout Successfully",
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
          verificationPicture: "Required field",
          message: "input error",
        });
      } else {
        if (isImage(req.file.originalname)) {
          return res.status(500).json({
            success: false,
            verificationPicture: "Only PNG, JPEG, and JPG files are allowed",
            message: "input error",
          });
        } else {
          if (isLessThanSize(req.file, 10 * 1024 * 1024)) {
            return res.status(500).json({
              success: false,
              verificationPicture: "File size should be less than 10MB",
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
          const userIds = await getUsersId("super-admin");
          /* await createPusher("verification-request-web", "reload", {}); */
          req.io.emit("verification-request");
          createNotification(
            userIds,
            req.user.id,
            "New Verification Request",
            `${user.firstname} ${user.lastname} has submitted  a verification request.`,
            "info"
          );
          console.log("====================================");
          console.log(userIds);
          console.log("====================================");
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
      let user = await User.find({
        archivedDate: { $exists: false },
        isArchived: false,
      });

      /* let user = await User.find({}); */
      /* sort */
      /* user.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); */
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
  "/verify-identity/request/",
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
      console.log(req.user.id);
      console.log("===================================="); */
      const user = await User.findById(req.user.id);
      if (user.verificationRequestDate === undefined) {
        if (
          /* (user.verificationRequestDate === undefined &&
            user.verificationPicture.length <= 0) || */
          user.status === "verified" ||
          user.userType !== "resident"
        ) {
          return res.status(200).json({
            success: false,
            message: "not found",
          });
        } else {
          return res.status(200).json({ success: true, ...user._doc });
        }
      } else {
        return res.status(200).json({
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
authController.put(
  "/verification-request/:action/:id",
  tokenMiddleware,
  //   userTypeMiddleware([
  // "super-admin",
  // ]),
  async (req, res) => {
    const error = {};
    try {
      let updateFields = {};
      let action = req.params.action.toLowerCase();
      console.log("====================================");
      console.log(action);
      console.log("====================================");
      if (action === "reject" || action === "approve") {
        if (Object.keys(error).length === 0) {
          const user = await User.findByIdAndUpdate(
            req.params.id,
            {
              $unset: {
                verificationRequestDate: Date.now(),
              },
            },
            { new: true }
          );

          const { reason, note } = req.body;
          if (action === "reject") {
            /* if (isEmpty(reason)) error["reason"] = "Required field"; */
            const cloud = await cloudinaryUploader(
              "destroy",
              "",
              "image",
              folderPath,
              user.verificationPicture[0]
            );
            user.verificationPicture.map(async (picture) => {
              await cloudinaryUploader(
                "destroy",
                "",
                "image",
                folderPath,
                picture
              );
            });

            /*  if (cloud !== "error") { */
            user.verificationPicture = [];

            await user.save();
            /* } else {
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
            });
          } */
          } else if (action === "approve") {
            user.status = "verified";
            await user.save();
          }

          if (user) {
            if (action === "reject") {
              /* sendSMS(
                user.contactNumber,
                "verification-request",
                `We regret to inform you that your verification request has been rejected. If you have any questions or need further assistance, please don't hesitate to reach out.`,
                ""
              );
            
              req.io.emit("verification-request");
              createNotification(
                [user._id],
                user._id,
                "Verification Request Rejected",
                `We regret to inform you that your verification request has been rejected. If you have any questions or need further assistance, please don't hesitate to reach out.`,
                "error"
              ); */
              sendSMS(
                user.contactNumber,
                "verification-request",
                `We regret to inform you that your verification request has been rejected due to: \n\n${reason}${
                  isEmpty(note) ? "" : `\n\n${note}`
                }.`,
                ""
              );

              req.io.emit("verification-request");
              createNotification(
                [user._id],
                user._id,
                "Verification Request Rejected",
                `We regret to inform you that your verification request has been rejected due to: \n\n${reason}${
                  isEmpty(note) ? "" : `\n\n${note}`
                }.`,
                "error"
              );

              return res.status(200).json({
                success: true,
                message: "Verification Request Rejected",
              });
            } else if (action === "approve") {
              sendSMS(
                user.contactNumber,
                "verification-request",
                "Congratulations! Your account has been fully activated. You now have access to all app functionalities, including hazard reporting and assistance requests.",
                ""
              );

              /* await createPusher("verification-request-mobile", "reload", {}); */
              req.io.emit("verification-request");
              createNotification(
                [user._id],
                user._id,
                "Verification Request Approved",
                `Congratulations! Your account has been fully activated. You now have access to all app functionalities, including hazard reporting and assistance requests.`,
                "success"
              );

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
        }
        if (Object.keys(error).length !== 0) {
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
/* authController.put(
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
          //sendSMS(`Verification Request Rejected`, user.contactNumber,"");

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
          //sendSMS(`Verification Request Approved`, user.contactNumber,"");

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
 */
module.exports = authController;
