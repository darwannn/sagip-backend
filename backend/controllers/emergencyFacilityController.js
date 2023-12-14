const emergencyFacilityController = require("express").Router();
const EmergencyFacility = require("../models/EmergencyFacility");
const tokenMiddleware = require("../middlewares/tokenMiddleware");
const multerMiddleware = require("../middlewares/multerMiddleware");
const { createAuditTrail } = require("./auditTrailController");
const folderPath = "sagip/media/emergency-facility";
const userTypeMiddleware = require("../middlewares/userTypeMiddleware");
const {
  isEmpty,
  isImage,
  isLessThanSize,
  cloudinaryUploader,
  isContactOrTeleNumber,
} = require("./functionController");
const {
  createNotification,
  createNotificationAll,
} = require("./notificationController");

emergencyFacilityController.post(
  "/add",
  tokenMiddleware,
  /*  userTypeMiddleware([
    "employee",
    "admin",
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
        error["contactNumber"] = "Required field";
      } else {
        if (isContactOrTeleNumber(contactNumber)) {
          error["contactNumber"] = "Invalid contact number";
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
            if (status === "operational") {
              createNotificationAll(
                req,
                emergencyFacility._id,
                `Emergency Facility`,
                `Checkout the recently added ${category}: ${name}.`,
                "info",
                true
              );
            }

            req.io.emit("emergency-facility");
            createAuditTrail(
              req.user.id,
              emergencyFacility._id,
              "EmergencyFacility",
              "Emergency Facility",
              "Add",
              `Added a new ${category}, ${name}`
            );
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
    const emergencyFacility = await EmergencyFacility.find({
      archivedDate: { $exists: false },
      isArchived: false,
    });

    if (emergencyFacility) {
      emergencyFacility.sort((a, b) => b.createdAt - a.createdAt);
      return res.status(200).json(emergencyFacility);
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
      archivedDate: { $exists: false },
      isArchived: false,

      $or: [{ status: "operational" }, { status: "full" }],
    });

    if (emergencyFacility) {
      return res.status(200).json(emergencyFacility);
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

    if (emergencyFacility) {
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
    "employee",
    "admin",
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
        error["contactNumber"] = "Required field";
      } else {
        if (isContactOrTeleNumber(contactNumber))
          error["contactNumber"] = "Invalid contact number";
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
        contactNumber = contactNumber.replace(/\s+/g, "");
        const updateFields = {
          name,
          latitude,
          longitude,
          category,
          status,
          contactNumber,
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
          req.io.emit("emergency-facility");
          createAuditTrail(
            req.user.id,
            emergencyFacility._id,
            "EmergencyFacility",
            "Emergency Facility",
            "Update",
            `Updated the ${category}, ${name}`
          );
          req.io.emit("emergency-facility");
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
    "employee",
    "admin",
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
          req.io.emit("emergency-facility");
          createAuditTrail(
            req.user.id,
            emergencyFacility._id,
            "EmergencyFacility",
            "Emergency Facility",
            "Delete",
            `Deleted the ${emergencyFacility.category}, ${emergencyFacility.name}`
          );

          return res.status(200).json({
            success: true,
            message: "Deleted Successfully",
          });
        } else {
          req.io.emit("emergency-facility");
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
emergencyFacilityController.put(
  "/:action/:id",
  tokenMiddleware,
  /* userTypeMiddleware([
    "employee",
    "admin",
  ]), */
  async (req, res) => {
    try {
      let updateFields = {};
      let action = req.params.action.toLowerCase();
      if (action === "unarchive" || action === "archive") {
        if (action === "archive") {
          updateFields = {
            isArchived: true,
            archivedDate: Date.now(),
          };
        } else if (action === "unarchive") {
          updateFields = {
            isArchived: false,

            $unset: { archivedDate: Date.now() },
          };
        }
        const emergencyFacility = await EmergencyFacility.findByIdAndUpdate(
          req.params.id,
          updateFields
          /*  { new: true } */
        );

        if (emergencyFacility) {
          req.io.emit("emergency-facility");
          if (action === "archive") {
            createAuditTrail(
              req.user.id,
              emergencyFacility._id,
              "EmergencyFacility",
              "Emergency Facility",
              "Archive",
              `Archived the ${emergencyFacility.category}, ${emergencyFacility.name}`
            );
            return res.status(200).json({
              success: true,
              message: "Archived Successfully",
            });
          } else if (action === "unarchive") {
            createAuditTrail(
              req.user.id,
              emergencyFacility._id,
              "EmergencyFacility",
              "Emergency Facility",
              "Unarchive",
              `Unarchived the ${emergencyFacility.category}, ${emergencyFacility.name}`
            );
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
module.exports = emergencyFacilityController;
