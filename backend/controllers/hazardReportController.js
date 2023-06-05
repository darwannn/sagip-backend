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
      console.log("====================================");
      console.log(req.file);
      console.log("====================================");
      const {
        description,
        category,
        latitude,
        longitude,
        status,
        street,
        municipality,
      } = req.body;

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
          street,
          municipality,
          status,
          proof: req.file.filename,
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
      const { action } = req.body;
      let = status = "";
      if (action === "verify") {
        status = "verified";
      } else if (action === "resolve") {
        status = "resolved";
      }
      console.log(req.params.id);
      if (Object.keys(error).length === 0) {
        const hazardReport = await HazardReport.findByIdAndUpdate(
          req.params.id,
          { status: status },
          { new: true }
        );
        if (hazardReport) {
          console.log(status);
          if (action === "verify") {
            return res.status(200).json({
              success: true,
              message: "HazardReport verified ",
              hazardReport,
            });
          } else if (action === "resolve") {
            return res.status(200).json({
              success: true,
              message: "HazardReport resolved ",
              hazardReport,
            });
          }
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
