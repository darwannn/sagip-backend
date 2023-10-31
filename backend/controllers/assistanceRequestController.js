const assistanceRequestController = require("express").Router();
const AssistanceRequest = require("../models/AssistanceRequest");
const PreAssessment = require("../models/PreAssessment");
const Team = require("../models/Team");
const User = require("../models/User");
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
const folderPath = "sagip/media/assistance-request";

const userTypeMiddleware = require("../middlewares/userTypeMiddleware");
const { createPusher, sendSMS, sendBulkSMS } = require("./apiController");
const {
  createNotification,
  createNotificationAll,
} = require("./notificationController");
assistanceRequestController.post(
  "/:action",
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
        latitude,
        longitude,
        street,
        municipality,

        hasChanged,
      } = req.body;
      let { answers, description, category } = req.body;
      let status = "";
      const action = req.params.action.toLowerCase();
      console.log("actoin", action);
      if (action === "add" || action === "auto-add") {
        /*  console.log(proof); */
        if (action === "add") {
          /*  if (isEmpty(answers)) error["answers"] = "Required field"; */
          if (isEmpty(category)) error["category"] = "Required field";
          if (isEmpty(description)) error["description"] = "Required field";
          if (isEmpty(latitude)) error["latitude"] = "Mark a location";
          if (isEmpty(longitude)) error["longitude"] = "Mark a location";
          /*   console.log("=====req.file===============================");
      console.log(hasChanged);
      console.log("hasChanged");
      console.log(req.file);
      console.log("===================================="); */
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
        }

        if (Object.keys(error).length === 0 || action === "auto-add") {
          let cloud = "";
          if (req.file) {
            cloud = await cloudinaryUploader(
              "upload",
              req.file.path,
              resource_type,
              folderPath,
              req.file.filename
            );
          }

          if (cloud !== "error" || req.file) {
            if (req.file)
              console.log("File uploaded successfully:", cloud.secure_url);
            let proof = req.file
              ? `${cloud.original_filename}.${cloud.format}`
              : "";
            console.log(answers);
            console.log("+++++++++++++++++++++++");
            console.log(proof);
            console.log(req.file);
            answers = answers && answers.length !== 0 ? answers : [];

            console.log("+++++++++++++++++++++++");
            /* adds defailt value when auto sending */
            status = "unverified";
            if (action === "auto-add") {
              console.log("+++++++++++++++++++++++ano bayah");
              console.log(description);
              console.log("Initial category value: " + category);
              if (isEmpty(proof)) {
                proof = "default.jpg";
                status = "incomplete";
              }
              if (
                isEmpty(category) ||
                category === "undefined" ||
                category === "null"
              ) {
                console.log("Setting category to Unspecified");
                category = "Unspecified";
                status = "incomplete";
              }
              if (
                isEmpty(description) ||
                description === undefined ||
                description === "undefined"
              ) {
                description = "";
                status = "incomplete";
              }

              /*  if (isEmpty(proof) || isEmpty(category) || isEmpty(description))
                status = "incomplete"; */
            } /* else {
              status = "unverified";
            } */
            const assistanceRequest = await AssistanceRequest.create({
              description,
              category,
              latitude,
              longitude,
              street,
              municipality,
              answers,
              proof,
              status,
              userId: req.user.id,
            });
            console.log(assistanceRequest);
            if (assistanceRequest) {
              /* await createPusher("assistance-request-web", "reload", {}); */
              req.io.emit("assistance-request");
              req.io.emit("new-assistance-request", {
                assistanceRequest: assistanceRequest,
              });
              const userIds = await getUsersId("dispatcher");
              createNotification(
                req,
                userIds,
                req.user.id,
                "New Emergency Request",
                `${category} on ${street} ${municipality}.`,
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
      } else {
        return res.status(500).json({
          success: false,
          message: "Error 404: Not Found" + error,
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
  "/torespond",
  tokenMiddleware,
  async (req, res) => {
    try {
      const myTeam = await Team.findOne({
        $or: [{ members: req.user.id }, { head: req.user.id }],
        /*      assignedTeam: { $ne: null }, */
        /* archivedDate: { $exists: false },
        isArchived: false, */
      })
        .populate("head", "-password")
        .populate("members", "-password");
      console.log("====================================");
      console.log(req.user.id);
      console.log(myTeam);
      console.log("====================================");
      if (myTeam) {
        const assistanceRequest = await AssistanceRequest.find({
          status: "ongoing",
          archivedDate: { $exists: false },
          isArchived: false,
          assignedTeam: myTeam._id,
        })
          .populate({
            path: "assignedTeam",
            populate: [
              { path: "members", select: "-password" },
              { path: "head", select: "-password" },
            ],
          })
          .populate("userId", "-password");

        if (assistanceRequest) {
          return res.status(200).json(assistanceRequest);
          return res.status(200).json({});
        } else {
          return res.status(200).json({
            success: false,
            message: "not found",
          });
        }
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

assistanceRequestController.get(
  "/response",
  tokenMiddleware,
  /* userTypeMiddleware([
  "responder",
  "employee",
  "admin",
]), */ async (req, res) => {
    try {
      /* let userId = "64a6df2b64b1389a52aa020d"; */
      /*  let userId = "64a6de4164b1389a52aa0205"; */

      const team = await Team.findOne({
        $or: [{ head: req.user.id }, { members: req.user.id }],
        /* archivedDate: { $exists: false },
        isArchived: false, */
      });
      console.log("====================================");
      console.log(team._id);
      console.log("====================================");
      const assistanceRequest = await AssistanceRequest.find({
        assignedTeam: team._id,
        archivedDate: { $exists: false },
        isArchived: false,
      }).populate("userId", "-password");
      /* .populate({
        path: "assignedTeam",
        populate: [
          { path: "members", select: "-password" },
          { path: "head", select: "-password" },
        ],
      })
      .populate("userId", "-password")
      .exec(); */

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
  }
);
assistanceRequestController.get(
  "/torespond",
  tokenMiddleware,
  /* userTypeMiddleware([
  "responder",
  "employee",
  "admin",
]), */ async (req, res) => {
    try {
      /*    let userId = "64a6df2b64b1389a52aa020d"; */

      const team = await Team.findOne({
        $or: [{ head: req.user.id }, { members: req.user.id }],
        /*   archivedDate: { $exists: false },
        isArchived: false, */
      });
      console.log("====================================");
      console.log(team._id);
      console.log("====================================");
      const assistanceRequest = await AssistanceRequest.find({
        assignedTeam: team._id,
        status: "ongoing",
        archivedDate: { $exists: false },
        isArchived: false,
      }).populate("userId", "-password");
      /* .populate({
        path: "assignedTeam",
        populate: [
          { path: "members", select: "-password" },
          { path: "head", select: "-password" },
        ],
      })
      .populate("userId", "-password")
      .exec();
 */
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
  }
);

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
        status: { $in: ["ongoing", "unverified", "incomplete"] },
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
        answers,
      } = req.body;
      let status = "";
      /*   if (isEmpty(answers)) error["answers"] = "Required field"; */
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
          answers: answers,
        };

        console.log("====================================");
        /*  console.log(req.file.originalname); */
        console.log(resource_type);
        console.log("====================================");
        const assistanceRequestProof = await AssistanceRequest.findById(
          req.params.id
        );
        if (assistanceRequestProof.status === "incomplete") {
          status = "unverified";
          updateFields.status = status;
        } /* else {
          status = assistanceRequestProof.status;
        } */
        if (hasChanged && req.file) {
          if (assistanceRequestProof.proof.includes(".mp4")) {
            old_resource_type = "video";
          }

          if (assistanceRequestProof.proof !== "default.jpg") {
            await cloudinaryUploader(
              "destroy",
              "",
              old_resource_type,
              folderPath,
              assistanceRequestProof.proof
            );
          }

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
          /*  await createPusher("assistance-request-web", "reload", {}); */
          req.io.emit("assistance-request");
          const userIds = await getUsersId("dispatcher");
          createNotification(
            req,
            userIds,
            req.user.id,
            "Emergency Request Updated",
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
  "employee",
  "admin",
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
        const assistanceReqTeam = await AssistanceRequest.findById(
          req.params.id
        );
        if (assistanceReqTeam.assignedTeam) {
          return res.status(200).json({
            success: true,
            message: "A team has already been assigned",
          });
        }
      }
      // console.log(assignedTeam);
      let respondersContant = [];
      if (Object.keys(error).length === 0) {
        if (action === "verify") {
          console.log("verify");
          const user = await User.findById(req.user.id);
          const team = await Team.findById(assignedTeam)
            .populate("head", "-password")
            .populate("members", "-password");
          console.log(team);

          const teamHead = team.head;
          const teamMembers = team.members;
          console.log(teamHead);

          const headName = `${teamHead.lastname}, ${teamHead.firstname} ${teamHead.middlename}`;
          const memberNames = teamMembers.map(
            (member) =>
              `${member.lastname}, ${member.firstname} ${member.middlename}`
          );
          respondersContant = [
            teamHead.contactNumber,
            ...teamMembers.map((member) => member.contactNumber),
          ];
          const respondersName = [headName, ...memberNames];
          console.log(respondersName);
          updateFields = {
            status: "ongoing",
            assignedTeam,
            $set: {
              dateDispatched: Date.now(),
              dispatcherName: `${user.lastname}, ${user.firstname} ${user.middlename}`,
              respondersName: respondersName,
            },
          };
          await Team.findByIdAndUpdate(
            assignedTeam,
            { requestId: req.params.id },
            { new: true }
          );
        } else if (action === "resolve") {
          updateFields = {
            status: "resolved",

            $set: {
              dateResolved: Date.now(),
            },
            $unset: {
              isBeingResponded: 1,
            },
          };

          const assistanceReqTeam = await AssistanceRequest.findById(
            req.params.id
          );
          await Team.findByIdAndUpdate(
            assistanceReqTeam.assignedTeam,
            {
              requestId: null,
              $inc: {
                response: 1,
              },
            },
            { new: true }
          );
        } else if (action === "arrive") {
          console.log("arrive");
          updateFields = {
            $set: {
              dateArrived: Date.now(),
            },
          };
        } else if (action === "respond") {
          console.log("respond");
          updateFields = {
            $set: {
              isBeingResponded: true,
            },
          };
        }
        /* if (action === "verify") {
          updateFields = { status: "ongoing", assignedTeam };
        } else if (action === "resolve") {
          updateFields = { status: "resolved" };
        } */
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
          /*         await createPusher(`${assistanceRequest.userId._id}`, "reload", {});
          await createPusher("assistance-request-mobile", "reload", {}); */

          req.io.emit("assistance-request");
          req.io.emit(`${assistanceRequest.userId}`);

          if (action === "verify") {
            const team = await Team.findOne({ _id: assignedTeam });
            /* const team = await Team.findOne({ _id: assignedTeam,  archivedDate: { $exists: false },
              isArchived: false, }); */
            console.log("Type of team.members:", typeof team.members);
            console.log("Contents of team.members:", team.members);
            console.log("team");
            console.log(team);
            const teamMembers = [team.head, ...team.members];
            console.log("========teamMembers============================");
            console.log(teamMembers);
            console.log("====================================");
            /* sms uncomment */
            /* await sendBulkSMS(
              `Your team has been assigned to respond to ${
                assistanceRequest.category
              }${
                assistanceRequest.street !== ""
                  ? ` on ${assistanceRequest.street}`
                  : ""
              }`,
              "notification",
              respondersContant
            ); */

            createNotification(
              req,
              teamMembers,
              assistanceRequest.userId._id,
              "Assistance Required",
              `Your team has been assigned to respond to ${
                assistanceRequest.category
              }${
                assistanceRequest.street !== ""
                  ? ` on ${assistanceRequest.street}`
                  : ""
              }`,
              "success"
            );

            createNotification(
              req,
              [assistanceRequest.userId._id],
              assistanceRequest.userId._id,
              "Emergency Request Verified",
              `Your request regarding ${assistanceRequest.category}${
                assistanceRequest.street !== ""
                  ? ` on ${assistanceRequest.street}`
                  : ""
              } has been verified. ${
                team.name
              } has been assigned to assist you.`,
              "success"
            );
            /* sms uncomment */
            /* sendSMS(
              assistanceRequest.userId.contactNumber,
              "notification",
              `Your request regarding ${assistanceRequest.category}${
                assistanceRequest.street !== ""
                  ? ` on ${assistanceRequest.street}`
                  : ""
              } has been verified. ${
                team.name
              } has been assigned to assist you.`,
              ""
            ); */

            console.log(team._id);
            req.io.emit(team._id, {
              assistanceRequest: assistanceRequest,
            });
            return res.status(200).json({
              success: true,
              message: "Emergency Request Verified",
              // assistanceRequest,
            });
          } else if (action === "respond") {
            // sendSMS(
            //   assistanceRequest.userId.contactNumber,
            //   "notification",
            //   `Your request regarding ${assistanceRequest.category}${
            //     assistanceRequest.street !== ""
            //       ? ` on ${assistanceRequest.street}`
            //       : ""
            //   } has been verified. Please wait as ${
            //     assistanceRequest.assignedTeam.name
            //   } is on their way to assist you.`,
            //   ""
            // );

            createNotification(
              req,
              [assistanceRequest.userId._id],
              assistanceRequest.userId._id,
              "Responers on the Way",
              `Please wait as ${assistanceRequest.assignedTeam.name} is on their way  to assist you.`,
              "success"
            );

            return res.status(200).json({
              success: true,
              message: "Responding to Emergency Request ",
              // assistanceRequest,
            });
          } else if (action === "resolve") {
            req.io.emit(`resolved-${assistanceRequest.userId._id}`);
            req.io.emit(`resolved-assistance-request`, {
              assistanceRequest: assistanceRequest,
              team: assistanceRequest.assignedTeam,
            });
            // sendSMS(
            //   assistanceRequest.userId.contactNumber,
            //   "notification",
            //   `Your request regarding ${assistanceRequest.category}${
            //     assistanceRequest.street !== ""
            //       ? ` on ${assistanceRequest.street}`
            //       : ""
            //   } has been resolved. If you need any further assistance, feel free to reach out.`,
            //   ""
            // );

            createNotification(
              req,
              [assistanceRequest.userId._id],
              assistanceRequest.userId._id,
              "Emergency Request Resolved",
              `Your request regarding ${assistanceRequest.category}${
                assistanceRequest.street !== ""
                  ? ` on ${assistanceRequest.street}`
                  : ""
              } has been resolved. If you need any further assistance, feel free to reach out.`,
              "success"
            );

            return res.status(200).json({
              success: true,
              message: "Emergency Request Resolved",
              // assistanceRequest,
            });
          } else if (action === "arrive") {
            // sendSMS(
            //   assistanceRequest.userId.contactNumber,
            //   "notification",
            //   `Do not worry,the responders are now on the scene and are ready to assist you.`,
            //   ""
            // );

            createNotification(
              req,
              [assistanceRequest.userId._id],
              assistanceRequest.userId._id,
              "Responders Arrived",
              `Do not worry, the responders are now on the scene and are ready to assist you.`,
              "success"
            );

            return res.status(200).json({
              success: true,
              message: "Emergency Request Resolved",
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
//   "employee",
//   "admin",
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
           //req.io.emit("assistance-request");
        
          return res.status(200).json({
            success: true,
            message: "Emergency Request Resolved",
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

assistanceRequestController.delete(
  "/delete/:id",
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
      if (Object.keys(error).length === 0) {
        let resource_type = "image";

        const assistanceRequestImage = await AssistanceRequest.findById(
          req.params.id
        );

        if (!isVideo(assistanceRequestImage.proof)) {
          resource_type = "video";
        }
        /*  const cloud = ""; */

        if (assistanceRequestImage.proof !== "default.jpg") {
          /* cloud =  */
          await cloudinaryUploader(
            "destroy",
            "",
            resource_type,
            folderPath,
            assistanceRequestImage.proof
          );
        }

        /*    if (cloud !== "error") { */
        const assistanceRequest = await AssistanceRequest.findByIdAndDelete(
          req.params.id
        );

        if (assistanceRequest) {
          const userIds = await getUsersId("dispatcher");
          createNotification(
            req,
            userIds,
            req.user.id,
            "Emergency Request Cancelled",
            `${assistanceRequest.category}${
              assistanceRequest.street !== ""
                ? ` on ${assistanceRequest.street}`
                : ""
            } request has been cancelled.`,
            "info"
          );

          req.io.emit("assistance-request");
          req.io.emit(`${assistanceRequest.userId}`);
          req.io.emit(`cancelled-assistance-request`, {
            assistanceRequest: assistanceRequest,
          });
          /* dismissedRequestCount("archive", assistanceRequest.userId, req); */
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
        /* } else {
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
        } */
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
  "/delete/:id",
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
      console.log("====================================");
      console.log(req.params.id);
      console.log(req.body);

      console.log(note);
      console.log("====================================");
      if (isEmpty(reason)) error["reason"] = "Required field";
        //  if (isEmpty(note)) error["note"] = "Required field";
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
        // await createNotification(req,[userId], null, reason, note, "error");
        if (cloud !== "error") {
          const assistanceRequest = await AssistanceRequest.findByIdAndDelete(
            req.params.id
          );

          if (assistanceRequest) {
            // const user = await User.findByIdAndUpdate(
            //   assistanceRequest.userId,
            //   {
            //     $inc: { dismissedRequestCount: 1 },
            //   },
            //   { new: true }
            // );
            // if (user.dismissedRequestCount === 3) {
            //   user.isBanned = true;
            // }

              //  dismissedRequestCount("delete", assistanceRequest.userId,req);

            console.log("====================================");
            console.log(assistanceRequest.userId.contactNumber);
            console.log("====================================");
            sendSMS(
              assistanceRequest.userId.contactNumber,
              "notification",
              `Your request regarding ${assistanceRequest.category}${
                assistanceRequest.street !== ""
                  ? ` on ${assistanceRequest.street}`
                  : ""
              } has been closed due to: \n\n ${reason}\n ${note}.`,
              ""
            );

            // await createPusher(`${assistanceRequest.userId}`, "reload", {});
            // await createPusher("assistance-request-mobile", "reload", {});
            req.io.emit("assistance-request");
            req.io.emit(`${assistanceRequest.userId}`);
            createNotification(req,
              [assistanceRequest.userId._id],
              assistanceRequest.userId._id,
              "Emergency Request Closed",
              `Your request regarding ${assistanceRequest.category}${
                assistanceRequest.street !== ""
                  ? ` on ${assistanceRequest.street}`
                  : ""
              } has been closed due to: \n\n ${reason}\n ${note}.`,
              "error"
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
 */

assistanceRequestController.put(
  "/:action/:id",
  tokenMiddleware,
  /* userTypeMiddleware([
      "responder",
  "dispatcher",
  "employee",
  "admin",
]), */
  async (req, res) => {
    const error = {};
    try {
      const { reason, note } = req.body;
      let updateFields = {};
      let action = req.params.action.toLowerCase();
      if (
        action === "unarchive" ||
        action === "archive" ||
        action === "cancel"
      ) {
        if (Object.keys(error).length === 0) {
          console.log("====================================");
          console.log(reason);
          console.log(note);
          console.log("====================================");
          console.log(action);
          if (action === "archive") {
            if (isEmpty(reason)) error["reason"] = "Required field";
            updateFields = {
              status: "cancelled",
              $set: {
                cancelled: {
                  reason: reason,
                  note: note,
                  dateCancelled: Date.now(),
                },
              },
              isArchived: true,
              archivedDate: Date.now(),
            };
          } else if (action === "cancel") {
            if (isEmpty(reason)) error["reason"] = "Required field";
            updateFields = {
              status: "cancelled",
              $set: {
                cancelled: {
                  reason: reason,
                  note: note,
                  dateCancelled: Date.now(),
                },
              },
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
            req.io.emit("assistance-request");
            if (action === "archive") {
              /*  const user = await User.findByIdAndUpdate(
                assistanceRequest.userId,
                {
                  $inc: { dismissedRequestCount: 1 },
                },
                { new: true }
              );
              if (user.dismissedRequestCount === 3) {
                user.isBanned = true;
              }
 */
              dismissedRequestCount("archive", assistanceRequest.userId, req);

              console.log("=======jjj=============================");
              console.log(assistanceRequest.userId);
              console.log("====================================");
              /*  await createPusher(`${assistanceRequest.userId}`, "reload", {}); */
              /* req.io.emit(`${assistanceRequest.userId}`); */
              // sendSMS(
              //   assistanceRequest.userId.contactNumber,
              //   "notification",
              //   `Your request regarding ${assistanceRequest.category}${
              //     assistanceRequest.street !== ""
              //       ? ` on ${assistanceRequest.street} Street`
              //       : ""
              //   } has been closed due to: \n\n${reason}${
              //     isEmpty(note) ? "" : `\n\n${note}`
              //   }.`,
              //   ""
              // );
              console.log(reason);
              console.log(note);
              createNotification(
                req,
                [assistanceRequest.userId._id],
                assistanceRequest.userId._id,
                "Emergency Request Closed",
                `Your request regarding ${assistanceRequest.category}${
                  assistanceRequest.street !== ""
                    ? ` on ${assistanceRequest.street}`
                    : ""
                } has been closed due to: ${reason}${
                  isEmpty(note) ? "" : `<br><br>${note}`
                }.`,
                "error"
              );
              req.io.emit("assistance-request");
              req.io.emit(`${assistanceRequest.userId._id}`);
              req.io.emit(`rejected-${assistanceRequest.userId._id}`, {
                assistanceRequest: assistanceRequest,
              });
              return res.status(200).json({
                success: true,
                message: "Archived Successfully",
              });
            } else if (action === "cancel") {
              /* console.log(`cancelled-assistance-request`, {
                assistanceRequest: assistanceRequest,
                team: assistanceRequest.assignedTeam,
              }); */
              /*   console.log(`cancelled-${assistanceRequest.assignedTeam._id}`);
              console.log("cancel"); */
              console.log(assistanceRequest.assignedTeam);
              const team = await Team.findById(assistanceRequest.assignedTeam)
                .populate("head", "-password")
                .populate("members", "-password");
              console.log(team);

              const teamHead = team.head;
              const teamMembers = team.members;

              respondersContant = [
                teamHead.contactNumber,
                ...teamMembers.map((member) => member.contactNumber),
              ];
              respondersId = [
                teamHead._id,
                ...teamMembers.map((member) => member._id),
              ];
              console.log("respondersContant", respondersContant);
              console.log(respondersId);

              /* await sendBulkSMS(
                cancelledNotification,

                "notification",
                respondersContant
              );
 */
              const userIds = await getUsersId("dispatcher");
              createNotification(
                req,
                userIds,
                req.user.id,
                "Emergency Request Cancelled",
                `${assistanceRequest.category}${
                  assistanceRequest.street !== ""
                    ? ` on ${assistanceRequest.street}`
                    : ""
                } request has been cancelled due to: ${reason}${
                  isEmpty(note) ? "" : `<br><br>${note}`
                }.`,
                "info"
              );
              console.log(userIds);
              console.log("teamMembers", teamMembers);
              createNotification(
                req,
                respondersId,
                assistanceRequest.userId._id,
                "Emergency Request Cancelled",
                `${assistanceRequest.category}${
                  assistanceRequest.street !== ""
                    ? ` on ${assistanceRequest.street}`
                    : ""
                } request has been cancelled due to: ${reason}${
                  isEmpty(note) ? "" : `<br><br>${note}`
                }.`,
                "success"
              );

              req.io.emit(`cancelled-assistance-request`, {
                assistanceRequest: assistanceRequest,
                team: assistanceRequest.assignedTeam,
              });
              req.io.emit(`cancelled-${assistanceRequest.assignedTeam._id}`, {
                assistanceRequest: assistanceRequest,
              });

              return res.status(200).json({
                success: true,
                message: "Cancelled Successfully",
              });
            } else if (action === "unarchive") {
              /* const user = await User.findByIdAndUpdate(
                assistanceRequest.userId,
                {
                  $dec: { dismissedRequestCount: 1 },
                }
              ); */
              /* req.io.emit(`${assistanceRequest.userId}`); */
              dismissedRequestCount("unarchive", assistanceRequest.userId, req);
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
