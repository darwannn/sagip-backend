const hazardReportController = require("express").Router();
const HazardReport = require("../models/HazardReport");
const tokenMiddleware = require("../middlewares/tokenMiddleware");
const isInMalolos = require("../middlewares/isInMalolos");
const {
  isEmpty,
  isImage,
  isVideo,
  isLessThanSize,
  cloudinaryUploader,
  getUsersId,
} = require("./functionController");

const multerMiddleware = require("../middlewares/multerMiddleware");
const folderPath = "sagip/media/hazard-report";

const userTypeMiddleware = require("../middlewares/userTypeMiddleware");
const { createPusher } = require("./apiController");
const {
  createNotification,
  createNotificationAll,
} = require("./notificationController");
hazardReportController.post(
  "/add",
  tokenMiddleware,
  /* userTypeMiddleware([
  "resident",
  "responder",
  "dispatcher",
  "admin",
  "super-admin",
]), */
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

        street,
        municipality,
      } = req.body;

      //naka default status sa model, wala nang iba
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

            proof: `${cloud.original_filename}.${cloud.format}`,
            userId: req.user.id,
          });
          if (hazardReport) {
            /*     await createPusher("hazard-report", "reload", {}); */
            await createPusher("hazard-report-web", "reload", {});

            const userIds = await getUsersId("dispatcher");
            createNotification(
              userIds,
              req.user.id,
              "New hazport report",
              `${category} on ${street} ${municipality}`,
              "info"
            );
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
    /* const hazardReports = await HazardReport.find({}).populate(
      "userId",
      "-password"
    ); */
    const hazardReports = await HazardReport.find({
      archivedDate: { $exists: false },
      isArchived: false,
    }).populate("userId", "-password");

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
hazardReportController.get("/ongoing", async (req, res) => {
  try {
    /* const hazardReports = await HazardReport.find({
      status: "ongoing",
    }).populate("userId", "-password"); */
    const hazardReports = await HazardReport.find({
      status: "ongoing",
      archivedDate: { $exists: false },
      isArchived: false,
    }).populate("userId", "-password");

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
    const hazardReport = await HazardReport.findOne({
      _id: req.params.id,
      archivedDate: { $exists: false },
      isArchived: false,
    }).populate("userId", "-password");
    /* const hazardReport = await HazardReport.findById(req.params.id).populate(
      "userId",
      "-password"
    ); */
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
  "/update/:action/:id",
  tokenMiddleware,
  /* userTypeMiddleware([
     "responder",
  "dispatcher",
  "admin",
  "super-admin",
]), */
  /*   multerMiddleware.single("image"), */

  async (req, res) => {
    const error = {};
    try {
      let action = req.params.action.toLowerCase();
      let = status = "";

      if (action === "verify") {
        status = "ongoing";
      } else if (action === "resolve") {
        status = "resolved";
      }
      console.log(action);
      console.log("new");
      console.log(req.params.id);
      console.log(status);
      if (Object.keys(error).length === 0) {
        const hazardReport = await HazardReport.findByIdAndUpdate(
          req.params.id,
          { status: status },
          { new: true }
        );
        if (hazardReport) {
          await createPusher("hazard-report-mobile", "reload", {});
          await createPusher(`${hazardReport.userId}`, "reload", {});

          if (action === "verify") {
            createNotification(
              [hazardReport.userId],
              hazardReport.userId,
              "Hazard Report Verified",
              `Your hazard report has been verified`,
              "success"
            );

            return res.status(200).json({
              success: true,
              message: "Hazard Report Verified",
              hazardReport,
            });
          } else if (action === "resolve") {
            createNotification(
              [hazardReport.userId],
              hazardReport.userId,
              "Hazard Report Resolved",
              `Your hazard report has been resolved`,
              "success"
            );
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
  /* userTypeMiddleware([
      "responder",
  "dispatcher",
  "admin",
  "super-admin",
]), */
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
          await createPusher(`${hazardReport.userId}`, "reload", {});
          await createPusher("hazard-report-mobile", "reload", {});
          createNotification(
            [hazardReport.userId],
            hazardReport.userId,
            "Hazard Report Deleted",
            `Your hazard report has been deleted`,
            "error"
          );
          /*       await createPusher("hazard-report", "reload", {}); */
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
hazardReportController.put(
  "/:action/:id",
  tokenMiddleware,
  /* userTypeMiddleware([
      "responder",
  "dispatcher",
  "admin",
  "super-admin",
]), */
  async (req, res) => {
    try {
      let updateFields = {};
      let action = req.params.action.toLowerCase();
      if (action === "unarchive" || action === "archive") {
        console.log(action);
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
        const hazardReport = await HazardReport.findByIdAndUpdate(
          req.params.id,
          updateFields,
          { new: true }
        );
        if (hazardReport) {
          console.log("====================================");
          console.log("hazardReport");
          console.log("====================================");
          /*   await createPusher("hazard-report", "reload", {}); */
          if (action === "archive") {
            await createPusher(`${hazardReport.userId}`, "reload", {});
            await createPusher("hazard-report-mobile", "reload", {});
            createNotification(
              [hazardReport.userId],
              hazardReport.userId,
              "Hazard Report Deleted",
              `Your hazard report has been deleted`,
              "error"
            );
            return res.status(200).json({
              success: true,
              message: "Archived Successfully",
            });
          } else if (action === "unarchive") {
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
module.exports = hazardReportController;
