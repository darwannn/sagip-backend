const hazardReportController = require("express").Router();
const HazardReport = require("../models/HazardReport");
const tokenMiddleware = require("../middlewares/tokenMiddleware");
const { isEmpty, isImage, isLessThanSize } = require("./functionController");

const uploadMiddleware = require("../middlewares/uploadMiddleware");
const upload = uploadMiddleware("public/images/Hazard Report");

const fs = require("fs");

hazardReportController.post(
  "/add",
  tokenMiddleware,
  upload.single("proof"),
  async (req, res) => {
    const error = {};
    try {
      const { description, category, proofType, latitude, longitude, status } =
        req.body;

      if (isEmpty(category)) error["category"] = "Required field";
      if (isEmpty(description)) error["description"] = "Required field";
      if (isEmpty(latitude)) error["category"] = "Choose a location";
      if (isEmpty(longitude)) error["description"] = "Choose a location";

      if (!req.file) {
        error["proof"] = "Required field";
      } else {
        if (isImage(req.file)) {
          error["proof"] = "Only PNG, JPEG, and JPG files are allowed";
        } else {
          if (isLessThanSize(req.file, 10 * 1024 * 1024)) {
            error["proof"] = "File size should be less than 10MB";
          }
        }
      }

      if (Object.keys(error).length === 0) {
        const hazardReport = await HazardReport.create({
          description,
          category,
          latitude,
          longitude,
          status,
          proof,
          userId: req.user.id,
        });
        if (hazardReport) {
          return res.status(200).json({
            success: true,
            message: "HazardReport created successfully",
            hazardReport,
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "DB Error",
          });
        }
      }

      if (Object.keys(error).length !== 0) {
        error["success"] = false;
        error["message"] = "Input error";
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

/* get all */
hazardReportController.get("/", async (req, res) => {
  try {
    const hazardReports = await HazardReport.find({}).populate(
      "userId",
      "-password"
    );

    return res.status(200).json(hazardReports);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error" + error,
    });
  }
});

/* get specific  */
hazardReportController.get("/:id", async (req, res) => {
  try {
    const hazardReport = await HazardReport.findById(req.params.id);
    return res.status(200).json(hazardReport);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "not found",
    });
  }
});

hazardReportController.put(
  "/update/:id",
  tokenMiddleware,
  upload.single("image"),
  async (req, res) => {
    const error = {};
    try {
      const {
        description,
        category,
        hasChanged,
        proofType,
        latitude,
        longitude,
        status,
      } = req.body;

      if (isEmpty(category)) error["category"] = "Required field";
      if (isEmpty(description)) error["description"] = "Required field";
      if (isEmpty(latitude)) error["category"] = "Choose a location";
      if (isEmpty(longitude)) error["description"] = "Choose a location";

      /*  if (hasChanged === "true") {
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
      } */

      if (Object.keys(error).length === 0) {
        const updateFields = { title, content, category, userId: req.user.id };
        let imagePath = "";

        if (hasChanged && req.file) {
          updateFields.image = req.file.filename;

          const deletedHazardReport = await HazardReport.findById(
            req.params.id
          );
          if (deletedHazardReport) {
            imagePath = `public/images/Hazard Report/${deletedHazardReport.image}`;
          }
        }

        const hazardReport = await HazardReport.findByIdAndUpdate(
          req.params.id,
          updateFields,
          { new: true }
        );

        if (hazardReport) {
          if (hasChanged && req.file) {
            fs.unlink(imagePath, (err) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  message: "Error deleting the image",
                });
              }
            });
          }

          return res.status(200).json({
            success: true,
            message: "HazardReport updated successfully",
            hazardReport,
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "DB Error",
          });
        }
      }

      if (Object.keys(error).length !== 0) {
        error["success"] = false;
        error["message"] = "Input error";
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

hazardReportController.delete(
  "/delete/:id",
  tokenMiddleware,
  async (req, res) => {
    try {
      const deletedHazardReport = await HazardReport.findByIdAndDelete(
        req.params.id
      );

      if (deletedHazardReport) {
        /*  const imagePath = `public/images/Hazard Report/${deletedHazardReport.image}`;
        fs.unlink(imagePath, (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error deleting the image ",
            });
          } else { */
        return res.status(200).json({
          success: true,
          message: "HazardReport  deleted successfully",
        });
        /*      }
        });
 */
      } else {
        return res.status(500).json({
          success: false,
          message: "DB Error",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error" + error,
      });
    }
  }
);

module.exports = hazardReportController;
