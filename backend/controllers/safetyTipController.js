const safetyTipController = require("express").Router();
const SafetyTip = require("../models/SafetyTip");
const tokenMiddleware = require("../middlewares/tokenMiddleware");

const isAdmin = require("../middlewares/isAdmin");
const isSuperAdmin = require("../middlewares/isSuperAdmin");
const isResponder = require("../middlewares/isResponder");
const isDispatcher = require("../middlewares/isDispatcher");

const { isEmpty, isImage, isLessThanSize } = require("./functionController");

const upload = require("../middlewares/uploadMiddleware");
//const upload = uploadMiddleware("assets/images/Safety Tip");
const folderPath = "sagip/media/safety-tips";
const { cloudinary } = require("../utils/config");

const fs = require("fs");

safetyTipController.post(
  "/add",
  tokenMiddleware,
  upload.single("image"),
  async (req, res) => {
    const error = {};
    try {
      const { title, content, category, status } = req.body;
      console.log("======status==============================");
      console.log(status);
      console.log(title);
      console.log(category);
      console.log("====================================");

      if (isEmpty(title)) error["title"] = "Required field";
      if (isEmpty(content.replace(/<[^>]*>/g, "")))
        error["content"] = "Required field";
      if (isEmpty(category)) error["category"] = "Required field";
      if (isEmpty(status)) error["status"] = "Required field";
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
        const result = await cloudinary.uploader
          .upload(req.file.path, {
            folder: folderPath,
            public_id: req.file.filename,
          })
          .then(async (result) => {
            console.log("Image uploaded successfully:", result.secure_url);

            const safetyTip = await SafetyTip.create({
              title,
              content,
              category,
              status,
              image: `${result.original_filename}.${result.format}`,
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
          })
          .catch((error) => {
            return res.status(500).json({
              success: false,
              message: "Internal Server Error: " + error,
            });
          });
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
safetyTipController.get("/published", async (req, res) => {
  try {
    const safetyTips = await SafetyTip.find({ status: "published" });
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
safetyTipController.get("/published/:id", async (req, res) => {
  try {
    const safetyTip = await SafetyTip.findOne({
      _id: req.params.id,
      status: "published",
    });
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
      const { title, content, category, status, hasChanged } = req.body;

      if (isEmpty(title)) error["title"] = "Required field";
      if (isEmpty(content.replace(/<[^>]*>/g, "")))
        error["content"] = "Required field";
      if (isEmpty(category)) error["category"] = "Required field";
      if (isEmpty(status)) error["status"] = "Required field";
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
        const updateFields = { title, content, category, status };
        /*  let imagePath = ""; */
        console.log("====================================");
        console.log(status);
        console.log("====================================");
        if (hasChanged && req.file) {
          /*       updateFields.image = req.file.filename; */
          /* const safetyTipImage = await SafetyTip.findById(req.params.id);
          if (safetyTipImage) {
            imagePath = `assets/images/Safety Tip/${safetyTipImage.image}`;
          } */
        }

        const safetyTip = await SafetyTip.findByIdAndUpdate(
          req.params.id,
          updateFields,
          { new: true }
        );

        if (safetyTip) {
          if (hasChanged && req.file) {
            /*  cloudinary.uploader.destroy(
              `${folderPath}/${safetyTip.image.replace(/\.[^/.]+$/, "")}`,
              { type: "upload", resource_type: "image" },
              (error, result) => {
                console.log("====================================");
                console.log(result);
                console.log("====================================");
              }
            ); */
            console.log("====================================");
            console.log(safetyTip.image.replace(/\.[^/.]+$/, ""));
            console.log("====================================");
            const result = await cloudinary.uploader
              .upload(req.file.path, {
                folder: folderPath,
                public_id: safetyTip.image.replace(/\.[^/.]+$/, ""),
              })
              .then(async (result) => {
                console.log("====================================");
                console.log(result);
                console.log("====================================");
                safetyTip.image = `${result.public_id.split("/").pop()}.${
                  result.format
                }`;
                safetyTip.save();
              })
              .catch((error) => {
                return res.status(500).json({
                  success: false,
                  message: "Internal Server Error: " + error,
                });
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
    const safetyTip = await SafetyTip.findByIdAndDelete(req.params.id);

    if (true) {
      cloudinary.uploader.destroy(
        `${folderPath}/${safetyTip.image.replace(/\.[^/.]+$/, "")}`,
        { type: "upload", resource_type: "image" },
        (error, result) => {
          /* if (error) {
           return res.status(500).json({
            success: false,
            message: "Error deleting the image ",
          });
        } */
          console.log("====================================");
          console.log(result);
          console.log("====================================");
          return res.status(200).json({
            success: true,
            message: "Deleted successfully",
          });
        }
      );
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
