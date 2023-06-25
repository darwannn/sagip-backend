const safetyTipController = require("express").Router();
const SafetyTip = require("../models/SafetyTip");
const tokenMiddleware = require("../middlewares/tokenMiddleware");

const isAdmin = require("../middlewares/isAdmin");
const isSuperAdmin = require("../middlewares/isSuperAdmin");
const isResponder = require("../middlewares/isResponder");
const isDispatcher = require("../middlewares/isDispatcher");

const { isEmpty, isImage, isLessThanSize } = require("./functionController");

const uploadMiddleware = require("../middlewares/uploadMiddleware");
const upload = uploadMiddleware("assets/images/Safety Tip");

const fs = require("fs");

safetyTipController.post(
  "/add",
  tokenMiddleware,
  upload.single("image"),
  async (req, res) => {
    const error = {};
    try {
      const { title, content, category } = req.body;

      if (isEmpty(title)) error["title"] = "Required field";
      if (isEmpty(content.replace(/<[^>]*>/g, "")))
        error["content"] = "Required field";
      if (isEmpty(category)) error["category"] = "Required field";

      if (!req.file) {
        error["image"] = "Required field";
      } else {
        if (isImage(req.file)) {
          error["image"] = "Only PNG, JPEG, and JPG files are allowed";
        } else {
          if (isLessThanSize(req.file, 10 * 1024 * 1024)) {
            error["image"] = "File size should be less than 10MB";
          }
        }
      }

      if (Object.keys(error).length === 0) {
        const safetyTip = await SafetyTip.create({
          title,
          content,
          category,
          image: req.file.filename,
        });
        if (safetyTip) {
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

/* get all */
safetyTipController.get("/", async (req, res) => {
  try {
    const safetyTips = await SafetyTip.find({});
    if (safetyTips) {
      return res.status(200).json(safetyTips);
      return res.status(200).json({
        /* success: true,
      message: "Record found", 
      safetyTips,*/
        ...safetyTips,
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

/* get specific  */
safetyTipController.get("/:id", async (req, res) => {
  try {
    const safetyTip = await SafetyTip.findById(req.params.id);

    /* safetyTip.views += 1;
    await safetyTip.save(); */

    if (safetyTip) {
      /*      return res.status(200).json(safetyTip); */
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
  tokenMiddleware,
  upload.single("image"),
  async (req, res) => {
    const error = {};
    try {
      const { title, content, category, hasChanged } = req.body;

      if (isEmpty(title)) error["title"] = "Required field";
      if (isEmpty(content.replace(/<[^>]*>/g, "")))
        error["content"] = "Required field";
      if (isEmpty(category)) error["category"] = "Required field";
      console.log("====================================");
      console.log();
      console.log("====================================");
      if (hasChanged === "true") {
        if (!req.file) {
          error["image"] = "Required field";
        } else {
          if (isImage(req.file)) {
            error["image"] = "Only PNG, JPEG, and JPG files are allowed";
          } else {
            if (isLessThanSize(req.file, 10 * 1024 * 1024)) {
              error["image"] = "File size should be less than 10MB";
            }
          }
        }
      }

      if (Object.keys(error).length === 0) {
        const updateFields = { title, content, category };
        let imagePath = "";

        if (hasChanged && req.file) {
          updateFields.image = req.file.filename;

          const safetyTipImage = await SafetyTip.findById(req.params.id);
          if (safetyTipImage) {
            imagePath = `assets/images/Safety Tip/${safetyTipImage.image}`;
          }
        }

        const safetyTip = await SafetyTip.findByIdAndUpdate(
          req.params.id,
          updateFields,
          { new: true }
        );

        if (safetyTip) {
          if (hasChanged && req.file) {
            fs.unlink(imagePath, (err) => {
              /* if (err) {
                return res.status(500).json({
                  success: false,
                  message: "Error deleting the image",
                });
              } */
            });
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

safetyTipController.delete("/delete/:id", tokenMiddleware, async (req, res) => {
  try {
    const deletedSafetyTip = await SafetyTip.findByIdAndDelete(req.params.id);

    if (deletedSafetyTip) {
      const imagePath = `assets/images/Safety Tip/${deletedSafetyTip.image}`;
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
        /* } */
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
});

safetyTipController.put("/saves/:id", tokenMiddleware, async (req, res) => {
  try {
    const safetyTip = await SafetyTip.findById(req.params.id);
    if (safetyTip.saves.includes(req.user.id)) {
      safetyTip.saves = safetyTip.saves.filter((id) => id !== req.user.id);
      await safetyTip.save();
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
});

safetyTipController.get("/saved/:id", async (req, res) => {
  try {
    const safetyTip = await SafetyTip.find({
      saves: req.params.id,
    });
    if (safetyTip) {
      return res.status(200).json(safetyTip);
      return res.status(200).json({
        /* success: true,
      message: "Record found", 
      safetyTips,*/
        ...safetyTip,
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

module.exports = safetyTipController;
