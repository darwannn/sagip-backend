const wellnessSurveyController = require("express").Router();
const { getBarangays } = require("@efdiaz/psgc");
const WellnessSurvey = require("../models/WellnessSurvey");
const User = require("../models/User");
const tokenMiddleware = require("../middlewares/tokenMiddleware");
const { isEmpty } = require("./functionController");
const userTypeMiddleware = require("../middlewares/userTypeMiddleware");
const { createAuditTrail } = require("./auditTrailController");
const {
  createNotification,
  createNotificationAll,
} = require("./notificationController");

const moment = require("moment");
wellnessSurveyController.post(
  "/add",
  tokenMiddleware,
  /* userTypeMiddleware([
  "employee",
  "admin",
]), */ async (req, res) => {
    const error = {};
    try {
      let { title, category, status, endDate } = req.body;
      if (typeof status === "string") status = status.toLowerCase();
      status = "active";
      if (isEmpty(title)) error["title"] = "Required field";
      if (isEmpty(category)) error["category"] = "Required field";
      if (isEmpty(status)) error["status"] = "Required field";
      if (isEmpty(endDate)) error["endDate"] = "Required field";
      const activeWellnessSurvey = await WellnessSurvey.find({
        status: "active",
      });

      if (Object.keys(error).length === 0) {
        if (!(activeWellnessSurvey.length !== 0 && status === "active")) {

          const wellnessSurvey = await WellnessSurvey.create({
            title,
            category,
            status,

            endDate,
          });

          if (wellnessSurvey) {
            req.io.emit("wellness-survey");
            createAuditTrail(
              req.user.id,
              wellnessSurvey._id,
              "WellnessSurvey",
              "Wellness Check Survey",
              "Publish",
              `Published a new wellness check survey, ${wellnessSurvey.title}`
            );

            if (status === "active") {
              createNotificationAll(
                req,
                wellnessSurvey._id,
                "Wellness Check Survey",
                `Recent events have not been good. Please tell us how you are doing after the ${title}.`,
                "info",
                false
              );
            }
            return res.status(200).json({
              success: true,
              message: "Added successfully",
              wellnessSurvey,
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
            message: "There is already an active survey",
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

wellnessSurveyController.get("/", async (req, res) => {
  try {
    const wellnessSurvey = await WellnessSurvey.find({
      archivedDate: { $exists: false },
      isArchived: false,
    })
      .populate("unaffected", "-password")
      .populate("affected", "-password");
    if (wellnessSurvey) {
      wellnessSurvey.sort((a, b) => b.createdAt - a.createdAt);
      return res.status(200).json(wellnessSurvey);
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

wellnessSurveyController.get("/report/:id", async (req, res) => {
  try {
    const barangays = getBarangays("031410");

    const barangay = barangays.map((barangay) => barangay.brgyDesc);
    barangay.sort((a, b) => a.localeCompare(b));

    const wellnessSurvey = await WellnessSurvey.findOne({
      _id: req.params.id,
      archivedDate: { $exists: false },
      isArchived: false,
    })
      .populate("unaffected", "-password")
      .populate("affected", "-password");

    if (wellnessSurvey) {
      const barangayCounts = {
        affected: {},
        unaffected: {},
      };

      barangay.map((barangayName) => {
        barangayCounts.affected[barangayName] = 0;
        barangayCounts.unaffected[barangayName] = 0;
      });

      barangayCounts.affected.Other = 0;
      barangayCounts.unaffected.Other = 0;

      wellnessSurvey.affected.map((user) => {
        const userBarangay = user.barangay;
        if (barangay.includes(userBarangay)) {
          barangayCounts.affected[userBarangay]++;
        } else {
          barangayCounts.affected.Other++;
        }
      });

      wellnessSurvey.unaffected.map((user) => {
        const userBarangay = user.barangay;
        if (barangay.includes(userBarangay)) {
          barangayCounts.unaffected[userBarangay]++;
        } else {
          barangayCounts.unaffected.Other++;
        }
      });

      return res.status(200).json({
        success: true,
        _id: wellnessSurvey._id,
        title: wellnessSurvey.title,
        category: wellnessSurvey.category,
        startDate: wellnessSurvey.startDate,
        endDate: wellnessSurvey.endDate,
        responseCount:
          wellnessSurvey.affected.length + wellnessSurvey.unaffected.length,
        affectedCount: wellnessSurvey.affected.length,
        unaffectedCount: wellnessSurvey.unaffected.length,
        ...barangayCounts,
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

wellnessSurveyController.get(
  "/myresponse",
  tokenMiddleware,
  /* userTypeMiddleware([
    "resident",
    "responder",
    "dispatcher",
    "employee",
    "admin",
  ]), */ async (req, res) => {
    try {
      const wellnessSurvey = await WellnessSurvey.findOne({ status: "active" });

      const user = await User.findOne({
        _id: req.user.id,
      });
      if (!wellnessSurvey) {
        return res.status(200).json({
          success: false,
          message: "No Active Survey ",
        });
      }

      /*   if (user.userType === "resident") { */
      let surveyResponse = [
        ...(wellnessSurvey.affected || []),
        ...(wellnessSurvey.unaffected || []),
      ];
      let isResponded = false;

      for (const response of surveyResponse) {
        if (response.toString() === req.user.id) {
          isResponded = true;
          break;
        } else {
          isResponded = false;
        }
      }

      if (isResponded) {
        return res.status(200).json({
          success: false,
          message: "already responded",
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "success",
          ...wellnessSurvey._doc,
        });
      }
      /* } else {
        return res
          .status(200)
          .json({ success: true, message: "success", ...wellnessSurvey._doc });
      } */
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
      });
    }
  }
);

wellnessSurveyController.get("/active", async (req, res) => {
  try {
    const wellnessSurvey = await WellnessSurvey.findOne({
      archivedDate: { $exists: false },
      isArchived: false,
      status: "active",
    });

    if (wellnessSurvey) {
      return res.status(200).json({
        success: true,

        ...wellnessSurvey._doc,
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
wellnessSurveyController.get("/:id", async (req, res) => {
  try {
    const wellnessSurvey = await WellnessSurvey.findOne({
      _id: req.params.id,
      archivedDate: { $exists: false },
      isArchived: false,
    })
      .populate("unaffected", "-password")
      .populate("affected", "-password");

    if (wellnessSurvey) {
      return res.status(200).json({
        success: true,

        ...wellnessSurvey._doc,
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

wellnessSurveyController.put(
  "/update/:id",
  tokenMiddleware,
  /* userTypeMiddleware([
    "employee",
    "admin",
  ]), */
  async (req, res) => {
    const error = {};
    try {
      let { title, category, status, endDate } = req.body;

      if (typeof status === "string") status = status.toLowerCase();

      if (isEmpty(title)) error["title"] = "Required field";
      if (isEmpty(category)) error["category"] = "Required field";
      if (isEmpty(status)) error["status"] = "Required field";
      if (isEmpty(endDate)) error["endDate"] = "Required field";
      const activeWellnessSurvey = await WellnessSurvey.find({
        status: "active",
      });

      if (Object.keys(error).length === 0) {
        if (moment(endDate).isBefore(moment(), "day")) {
          status = "inactive";
        }
        if (
          !(
            activeWellnessSurvey.length !== 0 &&
            activeWellnessSurvey._id !== req.params.id &&
            status === "active"
          ) ||
          activeWellnessSurvey[0]._id.equals(req.params.id)
        ) {
          const updateFields = { title, status, category, endDate };

          const wellnessSurvey = await WellnessSurvey.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true }
          );

          if (wellnessSurvey) {
            req.io.emit("wellness-survey");

            if (status === "active") {
              if (
                activeWellnessSurvey.length !== 0 &&
                activeWellnessSurvey[0]._id.equals(req.params.id)
              ) {
                createAuditTrail(
                  req.user.id,
                  wellnessSurvey._id,
                  "WellnessSurvey",
                  "Wellness Check Survey",
                  "Update",
                  /* "Wellness check survey has been updated" */
                  `Updated wellness check survey, ${wellnessSurvey.title}`
                );
              } else {
                createNotificationAll(
                  req,
                  wellnessSurvey._id,
                  "Wellness Check Survey",
                  `Recent events have not been good. Please tell us how you are doing after the ${title}.`,
                  "info",
                  false
                );
                createAuditTrail(
                  req.user.id,
                  wellnessSurvey._id,
                  "WellnessSurvey",
                  "Wellness Check Survey",
                  "Republish",
                  `Republished wellness check survey, ${wellnessSurvey.title}`
                );
              }
            } else if (status === "inactive") {
              if (
                activeWellnessSurvey.length !== 0 &&
                activeWellnessSurvey[0]._id.equals(req.params.id)
              ) {
                createAuditTrail(
                  req.user.id,
                  wellnessSurvey._id,
                  "WellnessSurvey",
                  "Wellness Check Survey",
                  "Finish",
                  `Finished wellness check survey, ${wellnessSurvey.title}`
                );
              } else {
                createNotificationAll(
                  req,
                  wellnessSurvey._id,
                  "Wellness Check Survey",
                  `Recent events have not been good. Please tell us how you are doing after the ${title}.`,
                  "info",
                  false
                );
                createAuditTrail(
                  req.user.id,
                  wellnessSurvey._id,
                  "WellnessSurvey",
                  "Wellness Check Survey",
                  "Update",
                  /* "Wellness check survey has been updated" */
                  `Updated wellness check survey, ${wellnessSurvey.title}`
                );
              }
            }

            return res.status(200).json({
              success: true,
              message: "Updated successfully",
              wellnessSurvey,
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
            message: "There is already an active survey",
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

wellnessSurveyController.put(
  "/answer/",
  tokenMiddleware,
  /* userTypeMiddleware([
  "resident",
  "responder",
  "dispatcher",
  "employee",
  "admin",
]), */ async (req, res) => {
    try {
      const { answer } = req.body;
      const activeWellnessSurvey = await WellnessSurvey.findOne({
        status: "active",
      });

      const update = {};
      update[answer] = req.user.id;

      const wellnessSurvey = await WellnessSurvey.findOneAndUpdate(
        { _id: activeWellnessSurvey._id },
        { $push: update },
        { new: true }
      );

      if (wellnessSurvey) {
        req.io.emit("wellness-survey");
  
        /* createAuditTrail(
          req.user.id,
          wellnessSurvey._id,
          "WellnessSurvey",
          "Wellness Check Survey",
          "Answer",

          `Answered ${answer} to wellness check survey, ${wellnessSurvey.title}`
        ); */
        return res.json({
          success: true,
          message: "Answered Submitted Successfully",
          wellnessSurvey,
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "not found",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
        error: error.toString(),
      });
    }
  }
);

wellnessSurveyController.delete(
  "/delete/:id",
  tokenMiddleware,
  /* userTypeMiddleware([
    "employee",
    "admin",
  ]), */
  async (req, res) => {
    try {
      const wellnessSurvey = await WellnessSurvey.findByIdAndDelete(
        req.params.id
      );
      if (wellnessSurvey) {
        req.io.emit("wellness-survey");
     
        createAuditTrail(
          req.user.id,
          wellnessSurvey._id,
          "WellnessSurvey",
          "Wellness Check Survey",
          "Delete",
  
          `Deleted wellness check survey, ${wellnessSurvey.title}`
        );
        return res.status(200).json({
          success: true,
          message: "Deleted Successfully",
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
wellnessSurveyController.put(
  "/:action/:id",
  tokenMiddleware,
  /* userTypeMiddleware([
    "employee",
    "admin",
  ]), */
  async (req, res) => {
    try {
      let updateFields = {};
      let action = req.params.action.toLowerCase();
      if (action === "unarchive" || action === "archive") {
        if (action === "archive") {
          updateFields = {
            isArchived: true,
            archivedDate: Date.now(),
            status: "inactive",
          };
        } else if (action === "unarchive") {
          updateFields = {
            isArchived: false,

            $unset: { archivedDate: Date.now() },
          };
        }
        const wellnessSurvey = await WellnessSurvey.findByIdAndUpdate(
          req.params.id,
          updateFields
          /*  { new: true } */
        );

        if (wellnessSurvey) {
          req.io.emit("wellness-survey");
          if (action === "archive") {
            createAuditTrail(
              req.user.id,
              wellnessSurvey._id,
              "WellnessSurvey",
              "Wellness Check Survey",
              "Archive",
              `Archived wellness check survey, ${wellnessSurvey.title}`
            );
            return res.status(200).json({
              success: true,
              message: "Archived Successfully",
            });
          } else if (action === "unarchive") {
            createAuditTrail(
              req.user.id,
              wellnessSurvey._id,
              "WellnessSurvey",
              "Wellness Check Survey",
              "Unarchive",
              `Unarchived wellness check survey, ${wellnessSurvey.title}`
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

module.exports = wellnessSurveyController;
