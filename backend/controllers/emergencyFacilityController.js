const emergencyFacilityController = require("express").Router();
const EmergencyFacility = require("../models/EmergencyFacility");
const tokenMiddleware = require("../middlewares/tokenMiddleware");
const multerMiddleware = require("../middlewares/multerMiddleware");

const folderPath = "sagip/media/emergency-facility";
const { sendSMS, createPusher } = require("./apiController");
const userTypeMiddleware = require("../middlewares/userTypeMiddleware");
const {
  isEmpty,
  isImage,
  isLessThanSize,
  isContactNumber,
  cloudinaryUploader,
} = require("./functionController");
const {
  createNotification,
  createNotificationAll,
} = require("./notificationController");
emergencyFacilityController.post(
  "/add",
  tokenMiddleware,
  /*  userTypeMiddleware([
    "admin",
    "super-admin",
  ]), */
  multerMiddleware.single("image"),
  async (req, res) => {
    const error = {};
    try {
      let { name, latitude, longitude, category, contactNumber, status } =
        req.body;
      if (typeof status === "string") status = status.toLowerCase();
      if (isEmpty(name)) error["name"] = "Required field";
      if (isEmpty(status)) error["status"] = "Required field";
      if (isEmpty(latitude)) error["latitude"] = "Mark a location";
      if (isEmpty(longitude)) error["latitude"] = "Mark a location";
      if (isEmpty(category)) error["category"] = "Required field";

      if (isEmpty(contactNumber)) {
        error["contact"] = "Required field";
      } else {
        if (isContactNumber(contactNumber)) {
          error["contact"] = "Invalid contact number";
        }
      }

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

      if (Object.keys(error).length === 0) {
        const cloud = await cloudinaryUploader(
          "upload",
          req.file.path,
          "image",
          folderPath,
          req.file.filename
        );

        if (cloud !== "error") {
          const emergencyFacility = await EmergencyFacility.create({
            name,
            latitude,
            longitude,
            image: `${cloud.original_filename}.${cloud.format}`,
            category,
            contactNumber,
            status,
          });
          if (emergencyFacility) {
            createNotificationAll(
              emergencyFacility._id,
              `A ${category} is added`,
              `Checkout the new ${category}: ${name} `,
              "info"
            );
            await createPusher("emergency-facility", "reload", {});
            return res.status(200).json({
              success: true,
              message: "Added successfully",
              emergencyFacility,
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
      }

      if (Object.keys(error).length !== 0) {
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

emergencyFacilityController.get("/", async (req, res) => {
  try {
    const emergencyFacility = await EmergencyFacility.find({});
    console.log(emergencyFacility);
    if (emergencyFacility) {
      return res.status(200).json(emergencyFacility);
      return res.status(200).json({
        /* success: true,
        message: "found", 
        emergencyFacility,*/
        ...emergencyFacility,
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

emergencyFacilityController.get("/operational", async (req, res) => {
  try {
    const emergencyFacility = await EmergencyFacility.find({
      $or: [{ status: "operational" }, { status: "full" }],
    });
    console.log(emergencyFacility);
    if (emergencyFacility) {
      return res.status(200).json(emergencyFacility);
      return res.status(200).json({
        /* success: true,
        message: "found", 
        emergencyFacility,*/
        ...emergencyFacility,
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

emergencyFacilityController.get("/:id", async (req, res) => {
  try {
    const emergencyFacility = await EmergencyFacility.findById(req.params.id);

    console.log(emergencyFacility);

    if (emergencyFacility) {
      /*      return res.status(200).json(emergencyFacility); */
      return res.status(200).json({
        success: true,
        message: "found",
        ...emergencyFacility._doc,
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

emergencyFacilityController.put(
  "/update/:id",
  tokenMiddleware,
  /*   userTypeMiddleware([
    "admin",
    "super-admin",
  ]), */
  multerMiddleware.single("image"),
  async (req, res) => {
    const error = {};
    try {
      let {
        name,
        latitude,
        longitude,
        category,
        hasChanged,
        status,
        contactNumber,
      } = req.body;
      if (typeof status === "string") status = status.toLowerCase();
      if (isEmpty(name)) error["name"] = "Required field";

      if (isEmpty(status)) error["status"] = "Required field";
      if (isEmpty(latitude)) error["latitude"] = "Required field";
      if (isEmpty(longitude)) error["latitude"] = "Required field";
      if (isEmpty(category)) error["category"] = "Required field";

      if (isEmpty(contactNumber)) {
        error["contact"] = "Required field";
      } else {
        if (isContactNumber(contactNumber)) {
          error["contact"] = "Invalid contact number";
        }
      }

      if (hasChanged === true) {
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

      if (Object.keys(error).length === 0) {
        const updateFields = {
          name,
          latitude,
          longitude,
          category,
          status,
        };

        if (hasChanged && req.file) {
          const emergencyFacilityImage = await EmergencyFacility.findById(
            req.params.id
          );
          await cloudinaryUploader(
            "destroy",
            "",
            "image",
            folderPath,
            emergencyFacilityImage.image
          );

          /* updateFields.image = req.file.filename; */
          const cloud = await cloudinaryUploader(
            "upload",
            req.file.path,
            "image",
            folderPath,
            req.file.filename
          );
          updateFields.image = `${cloud.original_filename}.${cloud.format}`;
          if (cloud !== "error") {
          } else {
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
            });
          }
        }

        const emergencyFacility = await EmergencyFacility.findByIdAndUpdate(
          req.params.id,
          updateFields,
          { new: true }
        );

        if (emergencyFacility) {
          await createPusher("emergency-facility", "reload", {});
          return res.status(200).json({
            success: true,
            message: "Updated Successfully",
            emergencyFacility,
          });
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
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
      });
    }
  }
);

emergencyFacilityController.delete(
  "/delete/:id",
  tokenMiddleware,
  /*  userTypeMiddleware([
    "admin",
    "super-admin",
  ]), */
  async (req, res) => {
    try {
      const emergencyFacilityImage = await EmergencyFacility.findById(
        req.params.id
      );
      const cloud = await cloudinaryUploader(
        "destroy",
        "",
        "image",
        folderPath,
        emergencyFacilityImage.image
      );
      if (cloud !== "error") {
        const emergencyFacility = await EmergencyFacility.findByIdAndDelete(
          req.params.id
        );

        if (emergencyFacility) {
          await createPusher("emergency-facility", "reload", {});
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

module.exports = emergencyFacilityController;
