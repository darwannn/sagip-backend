const authController = require("express").Router();
const User = require("../models/User");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isEmpty, isImage, isLessThanSize } = require("./functionController");

const {
  createNotification,
  addNotification,
  updateNotification,
  deleteNotification,
} = require("./notificationController");

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
authController.get("/", async (req, res) => {
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
      userType,
      status,
    } = req.body;

    if (status === "verified") {
      if (isEmpty(userType)) error["userType"] = "Required field";
    }

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
      if (status === "verified") {
        verificationCode = 0;
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

        userType,
        status,
      });

      const notification = await Notification.create({
        userId: user._doc._id,
        notifications: [],
      });
      if (user && notification) {
        console.log("success");

        /*   sendSMS(`Your SAGIP verification code is ${verificationCode}`,user.contactNumber) */

        if (verificationCode !== 0) {
          return res.status(200).json({
            success: true,
            message: "Please verify contact number",
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
            message: "Added",
          });
        }
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

authController.delete("/delete/:id", tokenMiddleware, async (req, res) => {
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

authController.put(
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

authController.post(
  "/contact-verification",
  tokenMiddleware,
  async (req, res) => {
    try {
      const error = {};
      const { code, type } = req.body;
      const userId = req.user.id;

      /*     const userId = "646de7d73b43cfb85af16d77" */
      if (isEmpty(code)) {
        error["code"] = "Required field";
      } else if (isNumber(code)) {
        error["code"] = "Invalid code";
      }

      if (Object.keys(error).length == 0) {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(500).json({
            success: false,
            message: "User Not Found" + error,
          });
        } else {
          if (code == user.verificationCode) {
            // Code matches, update user status to 'semi-verified'

            if (user.status == "unverified") {
              user.status = "semi-verified";
            }
            user.attempt = 0;
            user.verificationCode = 0;
            await user.save();
            console.log("====================================");
            console.log("login");
            console.log("====================================");
            if (type === "register")
              return res.status(200).json({
                success: true,
                message: "Verified successfully. You can now use your account!",
                user: {
                  for: "login",
                  id: user._doc._id,
                  userType: user._doc.userType,
                  status: user._doc.status,
                },
                token: generateToken(user._id),
              });

            if (type === "forgot-password")
              return res.status(200).json({
                success: true,
                message: "Enter your new-password",
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
                message: "Verified successfully ",
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
                message: "Verified successfully",
              });
          } else {
            error["code"] = "Incorrect code";
            user.attempt += 1;
            await user.save();
          }
        }
      }

      if (Object.keys(error).length != 0) {
        //console.log("error");
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

authController.post(
  "/password-verification",
  tokenMiddleware,
  async (req, res) => {
    try {
      const { password } = req.body;

      console.log("req.body");
      if (isEmpty(password)) {
        return res.status(200).json({
          success: true,
          message: "Input error",
          password: "Required field",
        });
      } else {
        const user = await User.findOne({
          _id: req.user.id,
        });

        if (user && (await bcrypt.compare(password, user.password))) {
          return res.status(200).json({
            success: true,
            message: "Password match",
            for: "edit-password",
          });
        } else {
          return res.status(200).json({
            success: false,
            message: "Input error",
            password: "Incorrect Password",
          });
        }
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error" + error,
      });
    }
  }
);

authController.post("/login", async (req, res) => {
  try {
    const error = {};
    const { identifier, password } = req.body;

    if (isEmpty(identifier)) error["identifier"] = "Required field";
    if (isEmpty(password)) error["password"] = "Required field";

    let user = await checkIdentifier(identifier);

    if (!user) {
      error["identifier"] = "Account does not exist";
    }

    if (Object.keys(error).length == 0) {
      if (user.attempt >= 100) {
        let generatedCode = await generateCode();
        user.verificationCode = generatedCode;
        await user.save();

        return res.status(500).json({
          success: false,
          message: "Maximum login attempts exceeded.",
          attempt: true,
        });
      } else {
        if (user && (await bcrypt.compare(password, user.password))) {
          if (user.isBanned) {
            return res.status(500).json({
              success: false,
              message: "Account banned. Please contact the CDRRMO",
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
          error["password"] = "Incorrect";

          console.log(user.attempt);

          user.attempt++;
          await user.save();
        }
      }
    }

    if (Object.keys(error).length != 0) {
      error["success"] = false;
      error["message"] = "Input error";
      return res.status(500).json(error);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error" + error,
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
            message: "Account banned. Please contact the CDRRMO",
          });
        } else {
          console.log("Current COde: " + generatedCode);

          return res.status(200).json({
            success: true,
            message: "Message has been sent to",
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

    // If there are errors, respond with error messages
    if (Object.keys(error).length != 0) {
      error["success"] = false;
      error["message"] = "Input error";
      return res.status(400).json(error);
    }
  } catch (error) {
    // If an exception occurs, respond with an internal server error
    return res.status(500).json({
      success: false,
      message: "Internal Server Error" + error,
    });
  }
});
authController.put("/new-password", tokenMiddleware, async (req, res) => {
  // Variable declaration

  try {
    const error = {};
    const { password, confirmPassword } = req.body;

    /* if (isEmpty(password)) {
      error["password"] = "Required field";
    } else {
      if (verifyPassword(password)) {
        error["password"] = "password requirement did not match";
      }
    } */

    if (isEmpty(confirmPassword)) {
      error["confirmPassword"] = "Required field";
    } else {
      if (!isEmpty(password)) {
        if (password !== confirmPassword) {
          error["confirmPassword"] = "password did not match";
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
            message: "Change Successfully. Login Now",
          });
        } else {
          return res.status(200).json({
            success: true,
            message: "Password change",
          });
        }
      } else {
        error["message"] = "Database Error";
      }
    }

    if (Object.keys(error).length != 0) {
      console.log("error");
      res.status(400).json(error);
    }
  } catch (error) {
    // If an exception occurs, respond with an internal server error
    return res.status(500).json({
      success: false,
      message: "Internal Server Error" + error,
    });
  }
});
authController.put("/reset-password/:id", tokenMiddleware, async (req, res) => {
  // Variable declaration

  try {
    const error = {};
    const password = req.body.password;
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
});

authController.put("/resend-code", tokenMiddleware, async (req, res) => {
  try {
    const codeExpiration = new Date(currentDate.getTime() + 30 * 60000);
    let generatedCode = await generateCode();

    const user = await User.findByIdAndUpdate(req.user.id, {
      verificationCode: generatedCode,
      codeExpiration: codeExpiration,
    });

    if (user) {
      console.log("Current COde: " + generatedCode);

      return res.status(200).json({
        success: true,
        message: "Verification code has been resent.",
        /* user: {
          for: "forgot-password",
          id: user._doc._id,
          userType: user._doc.userType,
          status: user._doc.status,
        },
        token: generateToken(user._id), */
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "DB Error",
      });
    }
  } catch (error) {
    // If an exception occurs, respond with an internal server error
    return res.status(500).json({
      success: false,
      message: "Internal Server Error" + error,
    });
  }
});
authController.put(
  "/verify-identity",
  tokenMiddleware,
  upload.single("selfieImage"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(200).json({
          success: true,
          image: "Required field",
          message: "input error",
        });
      }

      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          $push: {
            verificationPicture: req.file.filename,
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
          message: "Verification Request sent",
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "DB Error",
        });
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

authController.get(
  "/verify-identity/:id",
  tokenMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const safetyTip = await User.findById(req.params.id);
      if (
        (safetyTip.verificationRequestDate === undefined &&
          safetyTip.verificationPicture.length <= 0) ||
        safetyTip.status === "verified" ||
        safetyTip.userType !== "resident"
      ) {
        return res.status(500).json({
          success: false,
          message: "not found",
        });
      }
      return res.status(200).json(safetyTip);
    } catch (error) {
      // If an exception occurs, respond with an internal server error
      return res.status(500).json({
        success: false,
        message: "Internal Server Error" + error,
      });
    }
  }
);

authController.put("/verification-request/:id", async (req, res) => {
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
      user.verificationPicture.map((picture) => {
        const imagePath = `public/images/User/${picture}`;
        fs.unlink(imagePath, (err) => {});
      });
      user.verificationPicture = [];

      await user.save();
    } else {
      user.status = "verified";
      await user.save();
    }

    if (user) {
      if (req.body.action === "reject") {
        /* sendSMS(`Verification Request Rejected`, user.contactNumber); */

        await createNotification(req.params.id, "title", "message", "category");

        return res.status(200).json({
          success: true,
          message: "Verification Request Rejected",
        });
      } else {
        await createNotification(req.params.id, "title", "message", "category");
        /*  sendSMS(`Verification Request Approved`, user.contactNumber); */

        return res.status(200).json({
          success: true,
          message: "Verification Request Approved",
        });
      }
    } else {
      return res.status(500).json({
        success: false,
        message: "DB Error",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error " + error,
    });
  }
});

authController.put(
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
authController.get("/:id", async (req, res) => {
  try {
    const safetyTip = await User.findById(req.params.id);

    /*  safetyTip.views += 1;

    await safetyTip.save(); */
    return res.status(200).json(safetyTip);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "not found",
    });
  }
});

/* functions ---------------------------------------- */

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

/*   
  const isEmpty = (value) => {
    if (value == "") {
      return true
    }
  } */

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

/*   const isUsername =  (value) => {
    const regex = /^[a-zA-Z0-9]+$/; 
    if (!regex.test(value)) {
      return true
    } 
  }
   */

const checkIdentifier = async (identifier) => {
  let identierType;
  if (identifier.includes("@")) {
    identierType = "email";
  } else if (/^09\d{9}$/.test(identifier)) {
    identierType = "contactNumber";
  }
  /* else {
       identierType = 'username';
     } */
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

module.exports = authController;
