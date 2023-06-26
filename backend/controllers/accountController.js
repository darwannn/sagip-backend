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
} = require("./functionController");

const tokenMiddleware = require("../middlewares/tokenMiddleware");

const currentDate = new Date();
const codeExpiration = new Date(currentDate.getTime() + 30 * 60000);

const uploadMiddleware = require("../middlewares/uploadMiddleware");
/* const upload = uploadMiddleware("assets/images/User"); */

const fs = require("fs");

/* get all */
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
});

accountController.delete("/delete/:id", tokenMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (user) {
      if (user.profilePicture !== "user_no_image.png") {
        const imagePath = `assets/images/User/${user.profilePicture}`;
        fs.unlink(imagePath, (err) => {
          /* if (err) {
            return res.status(500).json({
              success: false,
              message: "Error deleting the image ",
            });
          } else { */
          return res.status(200).json({
            success: true,
            message: "Deleted Successfully",
          });
          /* } */
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Deleted Successfully",
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
});

accountController.put(
  "/update/contact-number",
  tokenMiddleware,
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
/* 
accountController.put(
  "/update/contact-number",
  tokenMiddleware,
  async (req, res) => {
    try {
      const error = {};
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

accountController.put(
  "/update/contact-number/contact-verification",
  tokenMiddleware,
  async (req, res) => {
    try {
      const error = {};
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

accountController.put(
  "/update/:id",

  /*   upload.single("image"), */
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
        let imagePath = "";

        if (hasChanged && req.file) {
          updateFields.profilePicture = req.file.filename;

          const userImage = await User.findById(req.params.id);
          if (userImage) {
            imagePath = `assets/images/User/${userImage.profilePicture}`;
          }
        }

        const user = await User.findByIdAndUpdate(req.params.id, updateFields, {
          new: true,
        });

        if (user) {
          if (hasChanged && req.file) {
            if (!imagePath.includes("user_no_image")) {
              console.log(imagePath);
              fs.unlink(imagePath, (err) => {
                /*  if (err) {
                  return res.status(500).json({
                    success: false,
                    message: "Error deleting the image",
                  });
                } */
              });
            }
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

/* get specific  */
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

      console.log(user);
      if (user) {
        user.fcmToken = fcmToken;
        user.save();
        return res.status(200).json({
          success: true,
          message: "Updated Successfully",
        });
      } else {
        return res.status(400).json({
          success: true,
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
});

accountController.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      /*      return res.status(200).json(user); */
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
});

module.exports = accountController;
