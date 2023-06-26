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
  cloudinaryUploader,
} = require("./functionController");

const multerMiddleware = require("../middlewares/multerMiddleware");
const folderPath = "sagip/media/hazard-report";
const { cloudinary } = require("../utils/config");
/* const upload = multerMiddleware("assets/images/Hazard Report"); */

const fs = require("fs");
const { log } = require("console");

hazardReportController.post(
  "/add",
  tokenMiddleware,

  multerMiddleware.single("proof"),
  isInMalolos,
  async (req, res) => {
    let resource_type = "image";
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
      console.log("=====req.file===============================");
      console.log(req.file);
      console.log("====================================");
      if (!req.file) {
        error["proof"] = "Required field";
      } else {
        if (
          !isVideo(req.file.originalname) &&
          !isImage(req.file.originalname)
        ) {
          error["proof"] = "Only PNG, JPEG, JPG, and MP4 files are allowed";
        } else {
          if (!isImage(req.file.originalname)) {
            if (isLessThanSize(req.file, 10 * 1024 * 1024)) {
              error["proof"] = "File size should be less than 10MB";
            }
          }
          if (!isVideo(req.file.originalname)) {
            resource_type = "video";
            if (isLessThanSize(req.file, 50 * 1024 * 1024)) {
              error["proof"] = "File size should be less than 50MB";
            }
          }
        }
      }

      if (Object.keys(error).length === 0) {
        const cloud = await cloudinaryUploader(
          "upload",
          req.file.path,
          resource_type,
          folderPath,
          req.file.filename
        );

        if (cloud !== "error") {
          console.log("File uploaded successfully:", cloud.secure_url);
          const hazardReport = await HazardReport.create({
            description,
            category,
            latitude,
            longitude,
            street,
            municipality,
            status,
            proof: `${cloud.original_filename}.${cloud.format}`,
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
  /*   multerMiddleware.single("image"), */
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
      let resource_type = "image";

      const hazardReportImage = await HazardReport.findById(req.params.id);

      if (!isVideo(hazardReportImage.proof)) {
        resource_type = "video";
      }
      console.log("====================================");
      console.log(resource_type);
      console.log("====================================");

      const cloud = await cloudinaryUploader(
        "destroy",
        "",
        resource_type,
        folderPath,
        hazardReportImage.proof
      );
      if (cloud !== "error") {
        const hazardReport = await HazardReport.findByIdAndDelete(
          req.params.id
        );

        if (hazardReport) {
          return res.status(200).json({
            success: true,
            message: "Deleted successfully",
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

module.exports = hazardReportController;
