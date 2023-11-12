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
  dismissedRequestCount,
} = require("./functionController");

const multerMiddleware = require("../middlewares/multerMiddleware");
const folderPath = "sagip/media/hazard-report";
const { createAuditTrail } = require("./auditTrailController");
const userTypeMiddleware = require("../middlewares/userTypeMiddleware");
const {
  createNotification,
  createNotificationAll,
} = require("./notificationController");
const { create } = require("../models/Team");
hazardReportController.post(
  "/add",
  tokenMiddleware,
  /* userTypeMiddleware([
  "resident",
  "responder",
  "dispatcher",
  "employee",
  "admin",
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
        hasChanged,
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
            req.io.emit("hazard-report");
            const userIds = await getUsersId("dispatcher");
            createNotification(
              req,
              userIds,
              req.user.id,
              "New Hazport Report",
              `${hazardReport.category}${
                hazardReport.street !== "" ? ` on ${hazardReport.street}` : ""
              }.`,
              "info"
            );
            // resident uncomment
            createAuditTrail(
              req.user.id,
              hazardReport._id,
              "HazardReport",
              "Hazport Report",
              "Add",
              `Added a new hazard report, ${hazardReport.category}${
                hazardReport.street !== "" ? ` on ${hazardReport.street}` : ""
              }`
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
    const hazardReports = await HazardReport.find({
      archivedDate: { $exists: false },
      isArchived: false,
    }).populate("userId", "-password");
    if (hazardReports) {
      hazardReports.sort((a, b) => a.createdAt - b.createdAt);
      return res.status(200).json(hazardReports);
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
    const hazardReports = await HazardReport.find({
      status: "ongoing",
      archivedDate: { $exists: false },
      isArchived: false,
    }).populate("userId", "-password");

    if (hazardReports) {
      hazardReports.sort((a, b) => b.createdAt - a.createdAt);
      return res.status(200).json(hazardReports);
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

hazardReportController.get("/myreport", tokenMiddleware, async (req, res) => {
  try {
    const hazardReport = await HazardReport.find({
      userId: req.user.id,
      status: { $in: "unverified" },
      archivedDate: { $exists: false },
      isArchived: false,
    }).populate("userId", "-password");
    console.log("====================================");
    console.log(hazardReport);
    console.log("====================================");
    if (hazardReport) {
      hazardReport.sort((a, b) => a.createdAt - b.createdAt);
      return res.status(200).json(hazardReport);
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

hazardReportController.get("/:id", async (req, res) => {
  try {
    const hazardReport = await HazardReport.findOne({
      _id: req.params.id,
      archivedDate: { $exists: false },
      isArchived: false,
    }).populate("userId", "-password");

    if (hazardReport) {
      return res.status(200).json({
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
  /* userTypeMiddleware([
  "resident",
  "responder",
  "dispatcher",
  "employee",
  "admin",
]), */
  multerMiddleware.single("proof"),
  isInMalolos,
  async (req, res) => {
    let resource_type = "image";
    let old_resource_type = "image";
    const error = {};
    try {
      const {
        description,
        category,
        latitude,
        longitude,
        street,
        municipality,
        hasChanged,
      } = req.body;

      if (isEmpty(category)) error["category"] = "Required field";
      if (isEmpty(description)) error["description"] = "Required field";
      if (isEmpty(latitude)) error["latitude"] = "Mark a location";
      if (isEmpty(longitude)) error["longitude"] = "Mark a location";

      if (hasChanged === "true" || hasChanged === true) {
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
      } else {
      }

      if (Object.keys(error).length === 0) {
        const updateFields = {
          description,
          category,
          latitude,
          longitude,
          street,
          municipality,
        };

        if (hasChanged && req.file) {
          const hazardReport = await HazardReport.findById(req.params.id);

          if (hazardReport.proof.includes(".mp4")) {
            old_resource_type = "video";
          }
          await cloudinaryUploader(
            "destroy",
            "",
            old_resource_type,
            folderPath,
            hazardReport.proof
          );

          const cloud = await cloudinaryUploader(
            "upload",
            req.file.path,
            resource_type,
            folderPath,
            req.file.filename
          );
          updateFields.proof = `${cloud.original_filename}.${cloud.format}`;

          if (cloud !== "error") {
          } else {
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
            });
          }
        }

        const hazardReport = await HazardReport.findByIdAndUpdate(
          req.params.id,
          updateFields,
          { new: true }
        );
        if (hazardReport) {
          req.io.emit("hazard-report");
          // resident uncomment
          createAuditTrail(
            req.user.id,
            hazardReport._id,
            "HazardReport",
            "Hazport Report",
            "Update",
            `Updated a hazard report, ${hazardReport.category}${
              hazardReport.street !== "" ? ` on ${hazardReport.street}` : ""
            }`
          );
          const dispatcherIds = await getUsersId("dispatcher");
          createNotification(
            req,
            dispatcherIds,
            req.user.id,
            "Hazard Report Updated",
            `${hazardReport.category}${
              hazardReport.street !== "" ? ` on ${hazardReport.street}` : ""
            }.`,

            "info"
          );

          return res.status(200).json({
            success: true,
            message: "Updated Successfully",
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

hazardReportController.put(
  "/update/:action/:id",
  tokenMiddleware,
  /* userTypeMiddleware([
     "responder",
  "dispatcher",
  "employee",
  "admin",
]), */
  /*   multerMiddleware.single("image"), */

  async (req, res) => {
    const error = {};
    try {
      let updateFields = {};
      let action = req.params.action.toLowerCase();
      let = status = "";

      if (action === "verify") {
        updateFields = { status: "ongoing" };
      } else if (action === "resolve") {
        updateFields = {
          status: "resolved",
          $set: {
            dateResolved: Date.now(),
          },
        };
      }

      if (Object.keys(error).length === 0) {
        const hazardReport = await HazardReport.findByIdAndUpdate(
          req.params.id,
          updateFields,
          { new: true }
        ).populate("userId", "-password");
        if (hazardReport) {
          req.io.emit("hazard-report");
          req.io.emit(`${hazardReport.userId}`);

          if (action === "verify") {
            createNotification(
              req,
              [hazardReport.userId._id],
              hazardReport._id,
              "Hazard Report Verified",
              `Your report regarding ${hazardReport.category} ${
                hazardReport.street !== "" ? ` on ${hazardReport.street}` : ""
              }, has been carefully reviewed, and we confirm the existence of the reported hazard. Thank you for bringing this to our attention.`,
              "success"
            );

            createNotificationAll(
              req,
              hazardReport._id,
              `Ongoing Hazard`,
              `${
                hazardReport.category.toLowerCase() === "others"
                  ? "There is an ongoing hazard"
                  : hazardReport.category
              }${
                hazardReport.street !== "" ? ` on ${hazardReport.street}` : ""
              }.`,
              "info",
              true
            );
            createAuditTrail(
              req.user.id,
              hazardReport._id,
              "HazardReport",
              "Hazport Report",
              "Verify",
              `Verified a hazard report, ${hazardReport.category}${
                hazardReport.street !== "" ? ` on ${hazardReport.street}` : ""
              }`
            );
            return res.status(200).json({
              success: true,
              message: "Hazard Report Verified",
              hazardReport,
            });
          } else if (action === "resolve") {
            createNotification(
              req,
              [hazardReport.userId._id],
              hazardReport.userId._id,
              "Hazard Report Resolved",
              `Your report regarding ${hazardReport.category} ${
                hazardReport.street !== "" ? ` on ${hazardReport.street}` : ""
              }, has been resolved. Thank you for bringing this to our attention and helping to maintain safety in our community.`,
              "success"
            );
            createAuditTrail(
              req.user.id,
              hazardReport._id,
              "HazardReport",
              "Hazport Report",
              "Resolve",
              `Resolved a hazard report, ${hazardReport.category}${
                hazardReport.street !== "" ? ` on ${hazardReport.street}` : ""
              }`
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
  "employee",
  "admin",
]), */
  async (req, res) => {
    try {
      let resource_type = "image";

      const hazardReportImage = await HazardReport.findById(req.params.id);

      if (!isVideo(hazardReportImage.proof)) {
        resource_type = "video";
      }

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
          req.io.emit("hazard-report");
          req.io.emit(`${hazardReport.userId}`);
          const userIds = await getUsersId("dispatcher");
          createNotification(
            req,
            userIds,
            req.user.id,
            "Hazard Report Cancelled",
            `${hazardReport.category}${
              hazardReport.street !== "" ? ` on ${hazardReport.street}` : ""
            } request has been cancelled.`,
            "info"
          );
          // resident uncomment
          createAuditTrail(
            req.user.id,
            hazardReport._id,
            "HazardReport",
            "Hazport Report",
            "Delete",
            `Deleted a hazard report, ${hazardReport.category}${
              hazardReport.street !== "" ? ` on ${hazardReport.street}` : ""
            }`
          );
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
  //   userTypeMiddleware([
  //       "responder",
  //   "dispatcher",
  //   "employee",
  //   "admin",
  // ]),
  async (req, res) => {
    const error = {};
    try {
      const { reason, note } = req.body;
      let updateFields = {};
      let action = req.params.action.toLowerCase();
      if (action === "unarchive" || action === "archive") {
        if (isEmpty(reason)) error["reason"] = "Required field";
        if (Object.keys(error).length === 0) {
          console.log(action);
          if (action === "archive") {
            updateFields = {
              isArchived: true,
              status: "cancelled",
              $set: {
                cancelled: {
                  reason: reason,
                  note: note,
                  dateCancelled: Date.now(),
                },
              },
              archivedDate: Date.now(),
            };
          } else if (action === "unarchive") {
            updateFields = {
              isArchived: false,
              status: "unverified",
              $unset: { archivedDate: Date.now() },
            };
          }
          const hazardReport = await HazardReport.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true }
          );
          if (hazardReport) {
            if (action === "archive") {
              dismissedRequestCount("archive", hazardReport.userId, req);

              req.io.emit("hazard-report");
              req.io.emit(`${hazardReport.userId}`);
              createNotification(
                req,
                [hazardReport.userId._id],
                hazardReport.userId._id,
                "Hazard Report Closed",
                `Your report regarding  ${hazardReport.category} ${
                  hazardReport.street !== ""
                    ? ` on ${hazardReport.street} Street`
                    : ""
                } has been closed due to: ${reason}${
                  isEmpty(note) ? "" : `<br><br>${note}`
                }.`,
                "error"
              );
              createAuditTrail(
                req.user.id,
                hazardReport._id,
                "HazardReport",
                "Hazport Report",
                "Close",
                `Closed a hazard report, ${hazardReport.category}${
                  hazardReport.street !== "" ? ` on ${hazardReport.street}` : ""
                }`
              );
              return res.status(200).json({
                success: true,
                message: "Archived Successfully",
              });
            } else if (action === "unarchive") {
              req.io.emit("hazard-report");
              req.io.emit(`${hazardReport.userId}`);
              dismissedRequestCount("unarchive", hazardReport.userId, req);
              createAuditTrail(
                req.user.id,
                hazardReport._id,
                "HazardReport",
                "Hazport Report",
                "Unarchive",
                `Unarchived a hazard report, ${hazardReport.category}${
                  hazardReport.street !== "" ? ` on ${hazardReport.street}` : ""
                }`
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
        }
        if (Object.keys(error).length !== 0) {
          error["success"] = false;
          error["message"] = "input error";
          return res.status(400).json(error);
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
