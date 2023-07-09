const assistanceRequestController = require("express").Router();
const AssistanceRequest = require("../models/AssistanceRequest");
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
const folderPath = "sagip/media/assistance-request";

const userTypeMiddleware = require("../middlewares/userTypeMiddleware");
const { createPusher, sendSMS, sendBulkSMS } = require("./apiController");
const {
  createNotification,
  createNotificationAll,
} = require("./notificationController");
assistanceRequestController.post(
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
          const assistanceRequest = await AssistanceRequest.create({
            description,
            category,
            latitude,
            longitude,
            street,
            municipality,
            proof: `${cloud.original_filename}.${cloud.format}`,
            userId: req.user.id,
          });
          if (assistanceRequest) {
            await createPusher("assistance-request-web", "reload", {});
            const userIds = await getUsersId("dispatcher");
            createNotification(
              userIds,
              req.user.id,
              "New assistance request",
              `${category} on ${street} ${municipality}`,
              "info"
            );

            return res.status(200).json({
              success: true,
              message: "Added Successfully",
              assistanceRequest,
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

assistanceRequestController.get("/", async (req, res) => {
  try {
    /*  const assistanceRequests = await AssistanceRequest.find({}).populate(
      "userId",
      "-password"
    ); */
    const assistanceRequests = await AssistanceRequest.find({
      archivedDate: { $exists: false },
      isArchived: false,
    })
      .populate("userId", "-password")
      .populate({
        path: "assignedTeam",
        populate: [
          { path: "members", select: "-password" },
          { path: "head", select: "-password" },
        ],
      });
    if (assistanceRequests) {
      return res.status(200).json(assistanceRequests);
      return res.status(200).json({
        /* success: true,
        message: "found", 
        assistanceRequests,*/
        ...assistanceRequests,
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

assistanceRequestController.get("/ongoing", async (req, res) => {
  try {
    /* const assistanceRequest = await AssistanceRequest.find({
      status: "ongoing",
    }) */
    const assistanceRequest = await AssistanceRequest.find({
      status: "ongoing",
      archivedDate: { $exists: false },
      isArchived: false,
    })
      .populate({
        path: "assignedTeam",
        populate: [
          { path: "members", select: "-password" },
          { path: "head", select: "-password" },
        ],
      })
      .populate("userId", "-password")
      .exec();

    if (assistanceRequest) {
      return res.status(200).json(assistanceRequest);
      return res.status(200).json({
        /* success: true,
        message: "found", 
        assistanceRequest,*/
        ...assistanceRequest,
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
assistanceRequestController.get(
  "/myrequest",
  tokenMiddleware,
  async (req, res) => {
    try {
      /* const assistanceRequest = await AssistanceRequest.find({
      status: "ongoing",
    }) */
      console.log("====================================");
      console.log(req.user.id);
      console.log("====================================");
      const assistanceRequest = await AssistanceRequest.findOne({
        userId: req.user.id,
        status: { $in: ["ongoing", "unverified"] },
        archivedDate: { $exists: false },
        isArchived: false,
      })

        .populate({
          path: "assignedTeam",
          populate: [
            { path: "members", select: "-password" },
            { path: "head", select: "-password" },
          ],
        })
        .populate("userId", "-password")
        .exec();

      if (assistanceRequest) {
        /*  if (assistanceRequest.status === "unverified") { */
        /* return res.status(200).json({
            success: false,
            message: "we are still verifying the report",
          }); */
        /*   } else { */
        return res.status(200).json(assistanceRequest);
        return res.status(200).json({
          /* success: true,
          message: "found", 
          assistanceRequest,*/
          ...assistanceRequest,
        });
        /*   } */
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
  }
);

assistanceRequestController.get("/:id", async (req, res) => {
  try {
    /* const assistanceRequest = await AssistanceRequest.findById(
      req.params.id
    ).populate("userId", "-password"); */
    const assistanceRequest = await AssistanceRequest.findOne({
      _id: req.params.id,
      archivedDate: { $exists: false },
      isArchived: false,
    })
      .populate("userId", "-password")
      .populate({
        path: "assignedTeam",
        populate: [
          { path: "members", select: "-password" },
          { path: "head", select: "-password" },
        ],
      });
    if (assistanceRequest) {
      /*      return res.status(200).json(assistanceRequest); */
      return res.status(200).json({
        /* success: true,
        message: "found", */
        ...assistanceRequest._doc,
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

assistanceRequestController.put(
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
          const assistanceRequest = await AssistanceRequest.findById(
            req.params.id
          );

          if (assistanceRequest.proof.includes(".mp4")) {
            old_resource_type = "video";
          }
          await cloudinaryUploader(
            "destroy",
            "",
            old_resource_type,
            folderPath,
            assistanceRequest.proof
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

        const assistanceRequest = await AssistanceRequest.findByIdAndUpdate(
          req.params.id,
          updateFields,
          { new: true }
        );
        if (assistanceRequest) {
          await createPusher("assistance-request-web", "reload", {});
          const userIds = await getUsersId("dispatcher");
          createNotification(
            userIds,
            req.user.id,
            " assistance request updated",
            `${category} on ${street} ${municipality}`,
            "info"
          );

          return res.status(200).json({
            success: true,
            message: "Updated Successfully",
            assistanceRequest,
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

assistanceRequestController.put(
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
      const { assignedTeam } = req.body;
      // let = status = "";
      let updateFields = {};
      if (action === "verify") {
        if (isEmpty(assignedTeam))
          error["assignedTeam"] = "Please select a team to respond";
      }
      // console.log(assignedTeam);
      if (Object.keys(error).length === 0) {
        if (action === "verify") {
          updateFields = { status: "ongoing", assignedTeam };
        } else if (action === "resolve") {
          updateFields = { status: "resolved" };
        }
        const assistanceRequest = await AssistanceRequest.findByIdAndUpdate(
          req.params.id,
          updateFields,
          { new: true }
        )
          .populate("assignedTeam")
          .populate("userId");
        console.log("====================================");
        console.log(assistanceRequest.userId.contactNumber);
        console.log("====================================");
        if (assistanceRequest) {
          console.log("==========sss==========================");
          console.log(assistanceRequest.userId._id);
          console.log("====================================");
          /* await createPusher("assistance-request", "reload", {}); */
          await createPusher(`${assistanceRequest.userId._id}`, "reload", {});
          await createPusher("assistance-request-mobile", "reload", {});
          if (action === "verify") {
            sendSMS(
              `${assistanceRequest.assignedTeam.name} is on the way`,
              assistanceRequest.userId.contactNumber
            );

            createNotification(
              [assistanceRequest.userId],
              assistanceRequest.userId,
              "Request Approved",
              `Your request has been approved. ${assistanceRequest.assignedTeam.name} is on the way`,
              "success"
            );
            return res.status(200).json({
              success: true,
              message: "Assistance Request Verified",
              // assistanceRequest,
            });
          } else if (action === "resolve") {
            createNotification(
              [assistanceRequest.userId],
              assistanceRequest.userId,
              "Request Resolved",
              "Your request has resolved.",
              "success"
            );
            return res.status(200).json({
              success: true,
              message: "Assistance Request Resolved",
              // assistanceRequest,
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
/* assistanceRequestController.put(
  "/resolve/:id",
  tokenMiddleware,
//   userTypeMiddleware([
//       "responder",
//   "dispatcher",
//   "admin",
//   "super-admin",
// ]),
//     multerMiddleware.single("image"),
  async (req, res) => {
    const error = {};
    try {
      if (Object.keys(error).length === 0) {
        const assistanceRequest = await AssistanceRequest.findByIdAndUpdate(
          req.params.id,
          { status: "resolved" },
          { new: true }
        );
        if (assistanceRequest) {
          //sendSMS(`${assistanceRequest.teamId} is on the way`, assistanceRequest.userId.contactNumber);
          //await createPusher("assistance-request", "reload", {});
          return res.status(200).json({
            success: true,
            message: "Assistance Request Resolved",
            assistanceRequest,
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
); */

assistanceRequestController.put(
  "/delete/:id",
  tokenMiddleware,
  /* userTypeMiddleware([
      "responder",
  "dispatcher",
  "admin",
  "super-admin",
]), */
  async (req, res) => {
    const error = {};
    try {
      const { reason, note } = req.body;
      console.log("====================================");
      console.log(req.params.id);
      console.log(req.body);

      console.log(note);
      console.log("====================================");
      if (isEmpty(reason)) error["reason"] = "Required field";
      /*    if (isEmpty(note)) error["note"] = "Required field"; */
      if (Object.keys(error).length === 0) {
        let resource_type = "image";

        const assistanceRequestImage = await AssistanceRequest.findById(
          req.params.id
        );

        if (!isVideo(assistanceRequestImage.proof)) {
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
          assistanceRequestImage.proof
        );
        /* await createNotification([userId], null, reason, note, "error"); */
        if (cloud !== "error") {
          const assistanceRequest = await AssistanceRequest.findByIdAndDelete(
            req.params.id
          );

          if (assistanceRequest) {
            console.log("====================================");
            console.log(assistanceRequest.userId.contactNumber);
            console.log("====================================");
            sendSMS(
              `Your request has deleted. ${reason}`,
              assistanceRequest.userId.contactNumber
            );

            await createPusher(`${assistanceRequest.userId}`, "reload", {});
            await createPusher("assistance-request-mobile", "reload", {});
            createNotification(
              [assistanceRequest.userId],
              assistanceRequest.userId,
              "Request Delete",
              `${reason}`,
              "error"
            );
            /* await createPusher("assistance-request", "reload", {}); */
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
assistanceRequestController.put(
  "/:action/:id",
  tokenMiddleware,
  /* userTypeMiddleware([
      "responder",
  "dispatcher",
  "admin",
  "super-admin",
]), */
  async (req, res) => {
    const error = {};
    try {
      const { reason, note } = req.body;
      let updateFields = {};
      let action = req.params.action.toLowerCase();
      if (action === "unarchive" || action === "archive") {
        if (isEmpty(reason)) error["reason"] = "Required field";
        if (Object.keys(error).length === 0) {
          console.log("====================================");
          console.log(reason);
          console.log(note);
          console.log("====================================");
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
          const assistanceRequest = await AssistanceRequest.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true }
          );
          if (assistanceRequest) {
            console.log("====================================");
            console.log("assistanceRequest");
            console.log("====================================");

            if (action === "archive") {
              console.log("=======jjj=============================");
              console.log(assistanceRequest.userId);
              console.log("====================================");
              await createPusher(`${assistanceRequest.userId}`, "reload", {});
              createNotification(
                [assistanceRequest.userId],
                assistanceRequest.userId,
                "Request Deleted",
                `Your request has been deleted`,
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
module.exports = assistanceRequestController;
