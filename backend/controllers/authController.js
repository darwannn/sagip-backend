const authController = require("express").Router();
const User = require("../models/User");

const bcrypt = require("bcryptjs");
const moment = require("moment");

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

  getUsersId,
  handleArchive,
  verifyPassword,
} = require("./functionController");

const tokenMiddleware = require("../middlewares/tokenMiddleware");

const multerMiddleware = require("../middlewares/multerMiddleware");
const folderPath = "sagip/media/verification-request";

const userTypeMiddleware = require("../middlewares/userTypeMiddleware");
const { sendSMS, sendEmail } = require("./apiController");
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

      if (user) {
        req.io.emit("user");

        sendSMS(user.contactNumber, "register", verificationCode);
        // sendEmail(user.email, "register", verificationCode);

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
  //   "employee",
  //   "admin",
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
              if (parseInt(code) === user.verificationCode) {
                if (user.codeExpiration)
                  if (user.status == "unverified") {
                    user.status = "semi-verified";
                  }
                user.attempt = 0;
                user.verificationCode = 0;
                await user.save();
                req.io.emit("user");
                if (action === "register") {
                  createNotification(
                    req,
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
                  let { contactNumber } = req.body;

                  const userContactNumber = await User.findByIdAndUpdate(
                    req.user.id,
                    { contactNumber },
                    {
                      new: true,
                    }
                  );
                  if (userContactNumber) {
                    /* createNotification(req,
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
                  let { email } = req.body;

                  const userEmail = await User.findByIdAndUpdate(
                    req.user.id,
                    { email, emailStatus: "verified" },
                    {
                      new: true,
                    }
                  );
                  if (userEmail) {
                    /* createNotification(req,
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

authController.post(
  "/password-verification/:action",
  tokenMiddleware,
  /* userTypeMiddleware([
  "resident",
  "responder",
  "dispatcher",
  "employee",
  "admin",
]), */
  async (req, res) => {
    try {
      const { password } = req.body;

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
        user.codeExpiration = moment().add(15, "minutes");
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
            if (user.isArchived) {
              return res.status(403).json({
                success: false,
                message:
                  "Your account is disabled. Please contact us if you think this isn't right.",
              });
            } else {
              if (!(user.status === "unverified")) {
                /*    if (!user.isArchived) { */
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
                /*   } else {
                //  const data = calculateArchivedDate();
                if (data) {
                    //  const { daysLeft, deletionDate } = data;
                  return res.status(200).json({
                    isArchived: true,
                    success: false,
                  //   daysLeft,
                  // deletionDate,
                  // message: `Your account is scheduled for Deltetion on ${deletionDate}. 
                  // To keep your account deletion scheduled in ${daysLeft}, you can simply log out.`,
                    message: `Your account is disabled`,
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
                  console.log("Code: " + userVerificationCode.verificationCode);
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
          }
        } else {
          error["password"] = "Incorrect password";

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
      let identifierType = await checkIdentifierType(identifier);

      const user = await updateVerificationCode(accountExists.id);
      if (user) {
        if (user.isBanned) {
          return res.status(500).json({
            success: false,
            message:
              "Account suspended. Please contact us if you think this isn't right",
          });
        } else {
          if (user.isArchived) {
            return res.status(403).json({
              success: false,
              message:
                "Your account is disabled. Please contact us if you think this isn't right.",
            });
          } else {
            if (identifierType === "email") {
              sendEmail(user.email, "forgot-password", user.verificationCode);
            } else if (identifierType === "contactNumber") {
              sendSMS(
                user.contactNumber,
                "forgot-password",
                user.verificationCode
              );
            }
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
          }
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
  "employee",
  "admin",
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
            return res.status(200).json({
              success: true,
              message:
                "Password has been changed successfully. You can now login with your new password",
            });
          } else {
            /* createNotification(req,
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
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
        }
      }

      if (Object.keys(error).length != 0) {
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

authController.put(
  "/resend-code/",
  tokenMiddleware,
  /* userTypeMiddleware([
  "resident",
  "responder",
  "dispatcher",
  "employee",
  "admin",
]), */ async (req, res) => {
    try {
      const { identifier, action } = req.body;

      const user = await updateVerificationCode(req.user.id);

      if (user) {
        console.log("Code: " + user.verificationCode);
        let identifierType = await checkIdentifierType(identifier);

        if (identifierType === "email") {
          console.log("Email");
          if (action === "forgot-password") {
            sendEmail(identifier, "forgot-password", user.verificationCode);
          } else if (action === "attempt") {
            sendEmail(identifier, "attempt", user.verificationCode);
          } else {
            sendEmail(identifier, "email-verification", user.verificationCode);
          }
        } else if (identifierType === "contactNumber") {
          console.log("SMS");
          if (action === "forgot-password") {
            sendSMS(identifier, "forgot-password", user.verificationCode);
          } else if (action === "attempt") {
            sendSMS(identifier, "attempt", user.verificationCode);
          } else if (action === "register") {
            sendSMS(identifier, "register", user.verificationCode);
          } else {
            sendSMS(identifier, "sms-verification", user.verificationCode);
          }
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
    } catch (error) {
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
  "employee",
  "admin",
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

authController.put(
  "/verify-identity",
  tokenMiddleware,
  /* userTypeMiddleware([
  "resident",
  "responder",
  "dispatcher",
  "employee",
  "admin",
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
          const userIds = await getUsersId("admin");

          req.io.emit("verification-request");
          createNotification(
            req,
            userIds,
            req.user.id,
            "New Verification Request",
            `${user.firstname} ${user.lastname} has submitted  a verification request.`,
            "info"
          );

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

  async (req, res) => {
    try {
      let user = await User.find({
        archivedDate: { $exists: false },
        isArchived: false,
      });

      /* user.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); */
      user = user.filter(
        (record) =>
          record.verificationPicture.length !== 0 &&
          record.status === "semi-verified" &&
          record.verificationRequestDate
      );

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
  }
);

authController.get(
  "/verify-identity/request/",
  tokenMiddleware,
  /* userTypeMiddleware([
  "resident",
  "responder",
  "dispatcher",
  "employee",
  "admin",
]), */
  /*   multerMiddleware.single("image"), */
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (user.verificationRequestDate === undefined) {
        if (user.status === "verified" || user.userType !== "resident") {
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
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
      });
    }
  }
);

authController.get(
  "/verify-identity/:id",
  tokenMiddleware,
  /* userTypeMiddleware([
  "admin",
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

authController.put(
  "/verification-request/:action/:id",
  tokenMiddleware,
  //   userTypeMiddleware([
  // "admin",
  // ]),
  async (req, res) => {
    const error = {};
    try {
      let action = req.params.action.toLowerCase();

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

            user.verificationPicture = [];

            await user.save();
          } else if (action === "approve") {
            user.status = "verified";
            await user.save();
          }

          if (user) {
            if (action === "reject") {
              req.io.emit(user._id);
              req.io.emit("verification-request");
              /* createNotification(
                req,
                [user._id],
                user._id,
                "Verification Request Rejected",
                `We regret to inform you that your verification request has been rejected due to: ${reason}${
                  isEmpty(note) ? "" : `<br><br>${note}`
                }.`,
                "error"
              ); */
              createNotification(
                req,
                [user._id],
                user._id,
                "Verification Request Rejected",
                `We regret to inform you that your verification request has been rejected. If you have any questions or need further assistance, please don't hesitate to reach out.`,
                "error"
              );

              return res.status(200).json({
                success: true,
                message: "Verification Request Rejected",
              });
            } else if (action === "approve") {
              /* sms uncomment */
              /*  sendSMS(
                user.contactNumber,
                "verification-request",
                "Good news! Your account has been fully activated. You now have access to all app functionalities, including hazard reporting and emergency requests.",
                ""
              ); */

              req.io.emit("verification-request");
              createNotification(
                req,
                [user._id],
                user._id,
                "Your account has been fully activated",
                `Good news! Your account has been fully activated. You now have access to all app functionalities, including hazard reporting and emergency requests.`,
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

module.exports = authController;
