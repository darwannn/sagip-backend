const hazardReportController = require("express").Router();
const HazardReport = require("../models/HazardReport");
const tokenMiddleware = require("../middlewares/tokenMiddleware");
const isInMalolos = require("../middlewares/isInMalolos");
const {
  isEmpty,
  isImage,
  isValidExtensions,
  isVideo,
  isLessThanSize,
} = require("./functionController");

const uploadMiddleware = require("../middlewares/uploadMiddleware");
const upload = uploadMiddleware("public/images/Hazard Report");

const fs = require("fs");

hazardReportController.post(
  "/add",
  tokenMiddleware,

  upload.single("proof"),
  isInMalolos,
  async (req, res) => {
    const error = {};
    try {
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
      if (isEmpty(latitude)) error["latitude"] = "Mark a location";
      if (isEmpty(longitude)) error["longitude"] = "Mark a location";

      if (!req.file) {
        error["proof"] = "Required field";
      } else {
        if (isValidExtensions(req.file, [".png", ".jpeg", ".jpg", ".mp4"])) {
          error["proof"] = "Only PNG, JPEG, and JPG files are allowed";
        } else {
          if (!isValidExtensions(req.file, [".png", ".jpeg", ".jpg"])) {
            if (isLessThanSize(req.file, 10 * 1024 * 1024)) {
              error["proof"] = "File size should be less than 10MB";
            }
          }
          if (!isValidExtensions(req.file, [".mp4"])) {
            if (isLessThanSize(req.file, 50 * 1024 * 1024)) {
              error["proof"] = "File size should be less than 50MB";
            }
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
            message: "Added Successfully",
            hazardReport,
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

hazardReportController.get("/", async (req, res) => {
  try {
    const hazardReports = await HazardReport.find({}).populate(
      "userId",
      "-password"
    );

    if (hazardReports) {
      return res.status(200).json(hazardReports);
      return res.status(200).json({
        /* success: true,
        message: "found", 
        hazardReports,*/
        ...hazardReports,
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

hazardReportController.get("/:id", async (req, res) => {
  try {
    const hazardReport = await HazardReport.findById(req.params.id).populate(
      "userId",
      "-password"
    );
    if (hazardReport) {
      /*      return res.status(200).json(hazardReport); */
      return res.status(200).json({
        success: true,
        message: "found",
        ...hazardReport._doc,
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
              message: "Hazard Report Verified",
              hazardReport,
            });
          } else if (action === "resolve") {
            return res.status(200).json({
              success: true,
              message: "Hazard Report Resolved",
              hazardReport,
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

hazardReportController.delete(
  "/delete/:id",
  tokenMiddleware,
  async (req, res) => {
    try {
      const hazardReport = await HazardReport.findByIdAndDelete(req.params.id);

      if (hazardReport) {
        const imagePath = `public/images/Hazard Report/${hazardReport.image}`;
        fs.unlink(imagePath, (err) => {
          /* if (err) {
            return res.status(500).json({
              success: false,
              message: "Error deleting the image ",
            });
          } else { */
          return res.status(200).json({
            success: true,
            message: "Deleted successfully",
          });
          /*  } */
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

module.exports = hazardReportController;
