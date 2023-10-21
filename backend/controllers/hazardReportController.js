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
        hasChanged,
        street,
        municipality,
      } = req.body;

      //naka default status sa model, wala nang iba
      if (isEmpty(category)) error["category"] = "Required field";
      if (isEmpty(description)) error["description"] = "Required field";
      if (isEmpty(latitude)) error["latitude"] = "Mark a location";
      if (isEmpty(longitude)) error["longitude"] = "Mark a location";
      console.log("=====req.file===============================");
      console.log(hasChanged);
      console.log("hasChanged");
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
            /* await createPusher("hazard-report-web", "reload", {});
             */
            req.io.emit("hazard-report");
            const userIds = await getUsersId("dispatcher");
            createNotification(
              req,
              userIds,
              req.user.id,
              "New Hazport Report",
              `${category} on ${street} ${municipality}.`,
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

hazardReportController.get("/myreport", tokenMiddleware, async (req, res) => {
  try {
    console.log("====================================");
    console.log(req.user.id);
    console.log("====================================");
    /*   const hazardReport = await HazardReport.find({
      userId: req.user.id,
      archivedDate: { $exists: false },
      isArchived: false,
    }).populate("userId", "-password"); */
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
      /*      return res.status(200).json(hazardReport); */
      /* if (hazardReport.status === "unverified") { */
      /* return res.status(200).json({
          success: false,
          message: "we are still verifying the report",
        }); */
      /* } else { */
      return res.status(200).json(hazardReport);
      return res.status(200).json({
        /* success: true,
        message: "found", 
        hazardReport,*/
        ...hazardReport,
      });
      /*  } */
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
    /* const hazardReport = await HazardReport.findById(req.params.id).populate(
      "userId",
      "-password"
    ); */
    if (hazardReport) {
      /*      return res.status(200).json(hazardReport); */
      return res.status(200).json({
        /*  success: true,
        message: "found", */
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
  "admin",
  "super-admin",
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
      console.log("=====req.file===============================");
      console.log(req.file);
      console.log("====================================");

      if (hasChanged === "true" || hasChanged === true) {
        console.log("changeeeeeeeeeeee");
        if (!req.file) {
          error["proof"] = "Required field";
        } else {
          if (
            !isVideo(req.file.originalname) &&
            !isImage(req.file.originalname)
          ) {
            error["proof"] = "Only PNG, JPEG, JPG, and MP4 files are allowed";
          } else {
            console.log("1else11111");
            if (!isImage(req.file.originalname)) {
              if (isLessThanSize(req.file, 10 * 1024 * 1024)) {
                error["proof"] = "File size should be less than 10MB";
              }
              console.log("111111");
            }
            if (!isVideo(req.file.originalname)) {
              console.log("222222");
              resource_type = "video";
              if (isLessThanSize(req.file, 50 * 1024 * 1024)) {
                error["proof"] = "File size should be less than 50MB";
              }
            }
          }
        }
      } else {
        console.log("not change");
      }
      console.log("=======hasChanged==================");
      console.log(hasChanged);
      console.log("====================================");
      if (Object.keys(error).length === 0) {
        const updateFields = {
          description,
          category,
          latitude,
          longitude,
          street,
          municipality,
        };

        console.log("====================================");
        /*  console.log(req.file.originalname); */
        console.log(resource_type);
        console.log("====================================");
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
          /*    await createPusher("assistance-request-web", "reload", {}); */
          req.io.emit("hazard-report");
          const userIds = await getUsersId("dispatcher");
          /* createNotification(req,
            userIds,
            req.user.id,
            "Hazard report Updated",
            `${category} on ${street} ${municipality}`,
            "info"
          ); */

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
  "admin",
  "super-admin",
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

      console.log(action);
      console.log("new");
      console.log(req.params.id);
      console.log(status);
      if (Object.keys(error).length === 0) {
        const hazardReport = await HazardReport.findByIdAndUpdate(
          req.params.id,
          updateFields,
          { new: true }
        );
        if (hazardReport) {
          /* await createPusher("hazard-report-mobile", "reload", {}); */
          /* await createPusher(`${hazardReport.userId}`, "reload", {}); */
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
          /* await createPusher(`${hazardReport.userId}`, "reload", {});
          await createPusher("hazard-report-mobile", "reload", {}); */

          req.io.emit("hazard-report");
          req.io.emit(`${hazardReport.userId}`);
          /* dismissedRequestCount("archive", hazardReport.userId, req); */
          /* createNotification(req,
            [hazardReport.userId._id],
            hazardReport.userId._id,
            "Hazard Report Closed",
            `Your report regarding  ${hazardReport.category} ${
              hazardReport.street !== "" ? ` on ${hazardReport.street}` : ""
            }, has been carefully reviewed, and we have determined that the reported hazard is not substantiated. Your hazard report has been closed.`,
            "error"
          ); */

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
  //   "admin",
  //   "super-admin",
  // ]),
  async (req, res) => {
    const error = {};
    try {
      const { reason, note } = req.body;
      let updateFields = {};
      let action = req.params.action.toLowerCase();
      if (action === "unarchive" || action === "archive") {
        /* if (isEmpty(reason)) error["reason"] = "Required field"; */
        if (Object.keys(error).length === 0) {
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
            console.log("hazardReport");
            console.log("====================================");
            // await createPusher("hazard-report", "reload", {});
            if (action === "archive") {
              console.log("archive");
              dismissedRequestCount("archive", hazardReport.userId, req);
              //  await createPusher(`${hazardReport.userId}`, "reload", {});
              // await createPusher("hazard-report-mobile", "reload", {});
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
                } has been closed due to: \n\n${reason}${
                  isEmpty(note) ? "" : `\n\n${note}`
                }.`,
                "error"
              );
              return res.status(200).json({
                success: true,
                message: "Archived Successfully",
              });
            } else if (action === "unarchive") {
              req.io.emit("hazard-report");
              req.io.emit(`${hazardReport.userId}`);
              dismissedRequestCount("unarchive", hazardReport.userId, req);
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
