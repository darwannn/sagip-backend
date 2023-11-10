const safetyTipController = require("express").Router();
const SafetyTip = require("../models/SafetyTip");
const tokenMiddleware = require("../middlewares/tokenMiddleware");

const userTypeMiddleware = require("../middlewares/userTypeMiddleware");

const {
  createNotification,
  createNotificationAll,
} = require("./notificationController");

const {
  isEmpty,
  isImage,
  isLessThanSize,
  cloudinaryUploader,
} = require("./functionController");
const { createAuditTrail } = require("./auditTrailController");
const multerMiddleware = require("../middlewares/multerMiddleware");
const { create } = require("../models/AuditTrail");

const folderPath = "sagip/media/safety-tips";

safetyTipController.post(
  "/add",
  tokenMiddleware,
  /*  userTypeMiddleware(["employee", "admin"]), */
  multerMiddleware.single("image"),
  async (req, res) => {
    const error = {};
    try {
      let { title, content, category, status } = req.body;
      if (typeof status === "string") status = status.toLowerCase();
      if (isEmpty(title)) error["title"] = "Required field";
      if (isEmpty(content.replace(/<[^>]*>/g, "")))
        error["content"] = "Required field";
      if (isEmpty(category)) error["category"] = "Required field";
      if (isEmpty(status)) error["status"] = "Required field";
      if (!req.file) {
        error["image"] = "Required field";
      } else {
        if (isImage(req.file.originalname)) {
          error["image"] = "Only PNG, JPEG, and JPG files are allowed";
        } else {
          if (isLessThanSize(req.file, 10 * 1024 * 1024)) {
            error["image"] = "File size should be less than 10MB";
          }
        }
      }

      if (Object.keys(error).length === 0) {
        const cloud = await cloudinaryUploader(
          "upload",
          req.file.path,
          "image",
          folderPath,
          req.file.filename
        );

        if (cloud !== "error") {
          const safetyTip = await SafetyTip.create({
            title,
            content,
            category,
            status,
            image: `${cloud.original_filename}.${cloud.format}`,
            authorId: req.user.id,
          });
          if (safetyTip) {
            req.io.emit("safety-tips");
            if (status === "published") {
              createAuditTrail(
                req.user.id,
                safetyTip._id,
                "SafetyTip",
                "Safety Tips",
                "Publish",
                `Published a new safety tip, ${title}.`
              );

              createNotificationAll(
                req,
                safetyTip._id,
                "Safety Tip",
                `Read the recently added safety tip: ${title}.`,
                "info",
                false
              );
            } else {
              createAuditTrail(
                req.user.id,
                safetyTip._id,
                "SafetyTip",
                "Safety Tips",
                "Draft",
                `Created a new safety tip, ${title}.`
              );
            }
            return res.status(200).json({
              success: true,
              message: "Added successfully",
              safetyTip,
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

safetyTipController.get("/", async (req, res) => {
  try {
    const safetyTips = await SafetyTip.find({
      archivedDate: { $exists: false },
      isArchived: false,
    }).populate("authorId", "-password");

    if (safetyTips) {
      safetyTips.sort((a, b) => b.createdAt - a.createdAt);
      return res.status(200).json(safetyTips);
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

safetyTipController.get("/published", async (req, res) => {
  try {
    const safetyTips = await SafetyTip.find({
      status: "published",
      archivedDate: { $exists: false },
      isArchived: false,
    }).populate("authorId", "-password");
    if (safetyTips) {
      safetyTips.sort((a, b) => b.createdAt - a.createdAt);
      return res.status(200).json(safetyTips);
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

safetyTipController.get("/published/:id", async (req, res) => {
  try {
    const safetyTip = await SafetyTip.findOne({
      _id: req.params.id,
      status: "published",
    }).populate("authorId", "-password");
    if (safetyTip) {
      return res.status(200).json({
        success: true,
        message: "found",
        ...safetyTip._doc,
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

safetyTipController.get(
  "/saved",
  tokenMiddleware,
  /* userTypeMiddleware([
    "resident",
    "responder",
    "dispatcher",
    "employee",
    "admin",
  ]), */
  async (req, res) => {
    try {
      const safetyTip = await SafetyTip.find({
        saves: req.user.id,
        status: "published",

        archivedDate: { $exists: false },
        isArchived: false,
      });
      if (safetyTip) {
        return res.status(200).json(safetyTip);
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

safetyTipController.get("/:id", async (req, res) => {
  try {
    const safetyTip = await SafetyTip.findById(req.params.id).populate(
      "authorId",
      "-password"
    );

    if (safetyTip) {
      return res.status(200).json({
        success: true,
        message: "found",
        ...safetyTip._doc,
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

safetyTipController.put(
  "/update/:id",
  /*  userTypeMiddleware(["employee", "admin"]), */
  tokenMiddleware,
  multerMiddleware.single("image"),
  async (req, res) => {
    const error = {};
    try {
      let { title, content, category, status, hasChanged } = req.body;
      if (typeof status === "string") status = status.toLowerCase();

      if (isEmpty(title)) error["title"] = "Required field";
      if (isEmpty(content.replace(/<[^>]*>/g, "")))
        error["content"] = "Required field";
      if (isEmpty(category)) error["category"] = "Required field";
      if (isEmpty(status)) error["status"] = "Required field";

      if (hasChanged === true) {
        if (!req.file) {
          error["image"] = "Required field";
        } else {
          if (isImage(req.file.originalname)) {
            error["image"] = "Only PNG, JPEG, and JPG files are allowed";
          } else {
            if (isLessThanSize(req.file, 10 * 1024 * 1024)) {
              error["image"] = "File size should be less than 10MB";
            }
          }
        }
      }

      if (Object.keys(error).length === 0) {
        const updateFields = {
          title,
          content,
          category,
          status,
          /* authorId: req.user.id, */
        };

        if (hasChanged && req.file) {
          const safetyTipImage = await SafetyTip.findById(req.params.id);
          await cloudinaryUploader(
            "destroy",
            "",
            "image",
            folderPath,
            safetyTipImage.image
          );

          const cloud = await cloudinaryUploader(
            "upload",
            req.file.path,
            "image",
            folderPath,
            req.file.filename
          );
          updateFields.image = `${cloud.original_filename}.${cloud.format}`;

          if (cloud !== "error") {
          } else {
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
            });
          }
        }
        const oldSafetyTip = await SafetyTip.findById(req.params.id);
        const safetyTip = await SafetyTip.findByIdAndUpdate(
          req.params.id,
          updateFields,
          { new: true }
        );

        if (safetyTip) {
          req.io.emit("safety-tips");
          if (status === "published") {
            if (oldSafetyTip.status === "draft") {
              createAuditTrail(
                req.user.id,
                safetyTip._id,
                "SafetyTip",
                "Safety Tips",
                "Reublish",
                `Republished ${title}.`
              );
            } else {
              createAuditTrail(
                req.user.id,
                safetyTip._id,
                "SafetyTip",
                "Safety Tips",
                "Update",
                `Updated ${title}.`
              );
            }
          } else {
            if (oldSafetyTip.status === "published") {
              createAuditTrail(
                req.user.id,
                safetyTip._id,
                "SafetyTip",
                "Safety Tips",
                "Redraft",
                `redrafted ${title}.`
              );
            } else {
              createAuditTrail(
                req.user.id,
                safetyTip._id,
                "SafetyTip",
                "Safety Tips",
                "Update",
                `Updated ${title}.`
              );
            }
          }
          return res.status(200).json({
            success: true,
            message: "Updated Successfully",
            safetyTip,
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

safetyTipController.delete(
  "/delete/:id",
  tokenMiddleware,
  /* userTypeMiddleware([
    "employee",
    "admin",
  ]),  */ async (req, res) => {
    try {
      const safetyTipImage = await SafetyTip.findById(req.params.id);
      const cloud = await cloudinaryUploader(
        "destroy",
        "",
        "image",
        folderPath,
        safetyTipImage.image
      );
      if (cloud !== "error") {
        const safetyTip = await SafetyTip.findByIdAndDelete(req.params.id);

        if (safetyTip) {
          req.io.emit("safety-tips");
          createAuditTrail(
            req.user.id,
            safetyTip._id,
            "SafetyTip",
            "Safety Tips",
            "Delete",
            `Deleted a safety tip, ${safetyTip.title}.`
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

safetyTipController.put(
  "/saves/:id",
  tokenMiddleware,
  /* userTypeMiddleware([
    "resident",
    "responder",
    "dispatcher",
    "employee",
    "admin",
  ]), */
  async (req, res) => {
    try {
      const safetyTip = await SafetyTip.findById(req.params.id);
      if (safetyTip.saves.includes(req.user.id)) {
        safetyTip.saves = safetyTip.saves.filter(
          (id) => !id.equals(req.user.id)
        );
        await safetyTip.save();
        /*   createAuditTrail(
          req.user.id,
          safetyTip._id,
          "SafetyTip",
          "Safety Tips",
          `${safetyTip.saves.includes(req.user.id) ? "Save" : "Unsave"}`,
          `${
            safetyTip.saves.includes(req.user.id) ? "Saved" : "Unsaved"
          } a safety tip, ${safetyTip.title}.`
        ); */
        return res.status(200).json({
          success: true,
          message: "Unsaved Successfully",
        });
      } else {
        safetyTip.saves.push(req.user.id);
        await safetyTip.save();

        return res.status(200).json({
          success: true,
          message: "Saved Successfully",
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

safetyTipController.put(
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
        const safetyTip = await SafetyTip.findByIdAndUpdate(
          req.params.id,
          updateFields
          /*  { new: true } */
        );

        if (safetyTip) {
          req.io.emit("safety-tips");
          if (action === "archive") {
            createAuditTrail(
              req.user.id,
              safetyTip._id,
              "SafetyTip",
              "Safety Tips",
              "Archive",
              `Archived a safety tip, ${safetyTip.title}.`
            );
            return res.status(200).json({
              success: true,
              message: "Archived Successfully",
            });
          } else if (action === "unarchive") {
            createAuditTrail(
              req.user.id,
              safetyTip._id,
              "SafetyTip",
              "Safety Tips",
              "Unarchive",
              `Unarchived a safety tip, ${safetyTip.title}.`
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

module.exports = safetyTipController;
