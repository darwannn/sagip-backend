const teamController = require("express").Router();
const Team = require("../models/Team");
const tokenMiddleware = require("../middlewares/tokenMiddleware");
const { isEmpty, isImage, isLessThanSize } = require("./functionController");

const uploadMiddleware = require("../middlewares/uploadMiddleware");
const upload = uploadMiddleware("public/images/Team");

teamController.post(
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
            message: "Added Successfully",
            team,
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
teamController.get("/", async (req, res) => {
  try {
    const team = await Team.findMany({
      userType: "resident",
    });

    if (team) {
      return res.status(200).json(team);
      return res.status(200).json({
        /* success: true,
        message: "found", 
        team,*/
        ...team,
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

teamController.get("/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (team) {
      /*      return res.status(200).json(team); */
      return res.status(200).json({
        success: true,
        message: "found",
        ...team._doc,
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

teamController.delete("/delete/:id", tokenMiddleware, async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);

    if (team) {
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
});

teamController.put(
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

      if (Object.keys(error).length === 0) {
        const updateFields = { title, content, category, userId: req.user.id };

        const team = await Team.findByIdAndUpdate(req.params.id, updateFields, {
          new: true,
        });

        if (team) {
          return res.status(200).json({
            success: true,
            message: "Updated Successfully",
            team,
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

module.exports = teamController;
