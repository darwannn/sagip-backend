const emergencyFacilityController = require("express").Router();
const EmergencyFacility = require("../models/EmergencyFacility");
const tokenMiddleware = require("../middlewares/tokenMiddleware");
const uploadMiddleware = require("../middlewares/uploadMiddleware");
const upload = uploadMiddleware("public/images/Emergency Facility");

const fs = require("fs");

const {
  isEmpty,
  isImage,
  isLessThanSize,
  isContactNumber,
} = require("./functionController");

emergencyFacilityController.post(
  "/add",
  tokenMiddleware,
  upload.single("image"),
  async (req, res) => {
    const error = {};
    try {
      const { name, latitude, longitude, category, contactNumber } = req.body;

      if (isEmpty(name)) error["name"] = "Required field";
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
        if (isImage(req.file)) {
          error["image"] = "Only PNG, JPEG, and JPG files are allowed";
        } else {
          if (isLessThanSize(req.file, 10 * 1024 * 1024)) {
            error["image"] = "File size should be less than 10MB";
          }
        }
      }
      if (Object.keys(error).length === 0) {
        const emergencyFacility = await EmergencyFacility.create({
          name,
          latitude,
          longitude,
          image: req.file.filename,
          category,
          contactNumber,
        });
        if (emergencyFacility) {
          return res.status(200).json({
            success: true,
            message: "Data added successfully",
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

/* get all */
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

/* get specific  */
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
  upload.single("image"),
  async (req, res) => {
    const error = {};
    try {
      const {
        name,
        latitude,
        longitude,
        category,
        hasChanged,
        isFull,
        contactNumber,
      } = req.body;

      if (isEmpty(name)) error["name"] = "Required field";
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

      if (Object.keys(error).length === 0) {
        const updateFields = { name, latitude, longitude, category, isFull };
        let imagePath = "";

        if (hasChanged && req.file) {
          updateFields.image = req.file.filename;

          const emergencyFacilityImage = await EmergencyFacility.findById(
            req.params.id
          );
          if (emergencyFacilityImage) {
            imagePath = `public/images/Emergency Facility/${emergencyFacilityImage.image}`;
          }
        }

        const emergencyFacility = await EmergencyFacility.findByIdAndUpdate(
          req.params.id,
          updateFields,
          { new: true }
        );

        if (emergencyFacility) {
          if (hasChanged && req.file) {
            fs.unlink(imagePath, (err) => {
              /* if (err) {
                return res.status(500).json({
                  success: false,
                  message: "Error deleting the image",
                });
              } */
            });
          }

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
  async (req, res) => {
    try {
      const emergencyFacility = await EmergencyFacility.findByIdAndDelete(
        req.params.id
      );

      if (emergencyFacility) {
        const imagePath = `public/images/Emergency Facility/${emergencyFacility.image}`;
        fs.unlink(imagePath, (error) => {
          /*  if (error) {
            return res.status(500).json({
              success: false,
              message: "Error deleting the image.",
            });
          } else { */
          return res.status(200).json({
            success: true,
            message: "Deleted Successfully",
          });
          /* } */
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

module.exports = emergencyFacilityController;
