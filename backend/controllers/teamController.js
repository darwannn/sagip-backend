const teamController = require("express").Router();
const Team = require("../models/Team");
const User = require("../models/User");
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
    const team = await Team.find({})
      .populate("head", "-password")
      .populate("members", "-password");

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

teamController.get("/responder", async (req, res) => {
  try {
    let team = await User.find({
      userType: "resident",
    }).populate("teamId");
    /*  team = team.filter(
      (record) =>
        record.verificationPicture.length !== 0 &&
        record.status === "semi-verified" &&
        record.verificationRequestDate
    ); */

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

teamController.get("/responder/assigned", async (req, res) => {
  try {
    let team = await User.find({
      userType: "resident",
    }).populate("teamId");
    team = team.filter((record) => record.teamId);

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
teamController.get("/responder/unassigned", async (req, res) => {
  try {
    let team = await User.find({
      userType: "resident",
    }).populate("teamId");
    team = team.filter((record) => record.teamId === undefined);

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
      const { head, members } = req.body;
      /*  console.log(head); */
      console.log(members);

      if (isEmpty(head)) error["head"] = "Required field";
      if (members.length === 0) error["members"] = "Required field";

      if (Object.keys(error).length === 0) {
        const updateFields = { head, members };

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
