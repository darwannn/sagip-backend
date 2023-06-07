const safetyTipController = require("express").Router();
const Team = require("../models/Team");
const tokenMiddleware = require("../middlewares/tokenMiddleware");
const { isEmpty, isImage, isLessThanSize } = require("./functionController");

const uploadMiddleware = require("../middlewares/uploadMiddleware");
const upload = uploadMiddleware("public/images/Team");

const fs = require("fs");

safetyTipController.post(
  "/add",
  tokenMiddleware,
  upload.single("image"),
  async (req, res) => {
    const error = {};
    try {
      const { name } = req.body;

      if (isEmpty(name)) error["name"] = "Required field";

      if (Object.keys(error).length === 0) {
        const team = await Team.create({
          name,
        });

        if (team) {
          return res.status(200).json({
            success: true,
            message: "Team created successfully",
            team,
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "DB Error",
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
        message: "Internal Server Error" + error,
      });
    }
  }
);

/* get all */
safetyTipController.get("/", async (req, res) => {
  try {
    const team = await Team.findMany({
      userType: "resident",
    });
    return res.status(200).json(team);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error" + error,
    });
  }
});

/* get specific  */
safetyTipController.get("/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    return res.status(200).json(team);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "not found",
    });
  }
});

safetyTipController.delete("/delete/:id", tokenMiddleware, async (req, res) => {
  try {
    const deletedTeam = await Team.findByIdAndDelete(req.params.id);

    if (deletedTeam) {
      /*  const imagePath = `public/images/Team/${deletedTeam.image}`; */
      /* fs.unlink(imagePath, (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error deleting the image ",
          });
        } else { */
      return res.status(200).json({
        success: true,
        message: "Team  deleted successfully",
      });
      /*  }
      }); */
    } else {
      return res.status(500).json({
        success: false,
        message: "DB Error",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error" + error,
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
      if (isEmpty(content)) error["content"] = "Required field";
      if (isEmpty(category)) error["category"] = "Required field";

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
        const updateFields = { title, content, category, userId: req.user.id };
        let imagePath = "";

        if (hasChanged && req.file) {
          updateFields.image = req.file.filename;

          const deletedTeam = await Team.findById(req.params.id);
          if (deletedTeam) {
            imagePath = `public/images/Team/${deletedTeam.image}`;
          }
        }

        const team = await Team.findByIdAndUpdate(req.params.id, updateFields, {
          new: true,
        });

        if (team) {
          /* if (hasChanged && req.file) {
            fs.unlink(imagePath, (err) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  message: "Error deleting the image",
                });
              }
            });
          } */

          return res.status(200).json({
            success: true,
            message: "Team updated successfully",
            team,
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "DB Error",
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
        message: "Internal Server Error" + error,
      });
    }
  }
);

module.exports = safetyTipController;
