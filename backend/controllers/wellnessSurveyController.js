const wellnessSurveyController = require("express").Router();
const WellnessSurvey = require("../models/WellnessSurvey");
const User = require("../models/User");
const tokenMiddleware = require("../middlewares/tokenMiddleware");
const isAlreadyResponded = require("../middlewares/isAlreadyResponded");
const { isEmpty, isImage, isLessThanSize } = require("./functionController");

/* const uploadMiddleware = require("../middlewares/uploadMiddleware");
const upload = uploadMiddleware("public/images/Safety Tip"); */

const fs = require("fs");

wellnessSurveyController.post("/add", tokenMiddleware, async (req, res) => {
  const error = {};
  try {
    const { title, category } = req.body;

    if (isEmpty(title)) error["title"] = "Required field";
    if (isEmpty(category)) error["category"] = "Required field";
    console.log(title);
    console.log(category);
    if (Object.keys(error).length === 0) {
      const wellnessSurvey = await WellnessSurvey.create({
        title,
        category,
      });

      if (wellnessSurvey) {
        return res.status(200).json({
          success: true,
          message: "WellnessSurvey created successfully",
          wellnessSurvey,
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
});

/* get all */
wellnessSurveyController.get("/", async (req, res) => {
  try {
    const safetyTips = await WellnessSurvey.find({});
    return res.status(200).json(safetyTips);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error" + error,
    });
  }
});
wellnessSurveyController.get("/active", tokenMiddleware, async (req, res) => {
  try {
    const safetyTips = await WellnessSurvey.findOne({ isActive: true });

    const user = await User.findOne({
      _id: req.user.id,
    });

    if (user.userType === "resident") {
      let surveyResponse = [...safetyTips.affected, ...safetyTips.unaffected];
      let isResponded = false;

      surveyResponse.map((response) => {
        console.log(response);

        console.log("id" + req.user.id);
        if (response.toString() === req.user.id) {
          isResponded = true;
          return;
        } else {
          isResponded = false;
        }
      });
      if (isResponded) {
        return res.status(500).json({
          success: false,
          message: "already responded",
        });
      } else {
        return res.status(200).json({ success: true, ...safetyTips._doc });
      }
    } else {
      return res.status(200).json({ success: true, ...safetyTips._doc });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error" + error,
    });
  }
});

/* get specific  */
wellnessSurveyController.get("/:id", async (req, res) => {
  try {
    const wellnessSurvey = await WellnessSurvey.findById(req.params.id);

    wellnessSurvey.views += 1;

    await wellnessSurvey.save();
    return res.status(200).json(wellnessSurvey);
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
  async (req, res) => {
    const error = {};
    try {
      const { title, category, isActive } = req.body;

      if (isEmpty(title)) error["title"] = "Required field";
      if (isEmpty(category)) error["category"] = "Required field";

      if (Object.keys(error).length === 0) {
        const updateFields = { title, isActive, category };

        const wellnessSurvey = await WellnessSurvey.findByIdAndUpdate(
          req.params.id,
          updateFields,

          { new: true }
        );

        if (wellnessSurvey) {
          return res.status(200).json({
            success: true,
            message: "WellnessSurvey updated successfully",
            wellnessSurvey,
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

wellnessSurveyController.put("/answer", tokenMiddleware, async (req, res) => {
  try {
    const { surveyId, answer } = req.body;
    console.log(surveyId);
    const update = {};
    update[answer] = req.user.id;

    const wellnessSurvey = await WellnessSurvey.findOneAndUpdate(
      { _id: surveyId },
      { $push: update },
      { new: true }
    );

    if (wellnessSurvey) {
      return res.json({
        success: true,
        message: "WellnessSurvey updated successfully",
        wellnessSurvey,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Survey not found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.toString(),
    });
  }
});

wellnessSurveyController.delete(
  "/delete/:id",
  tokenMiddleware,
  async (req, res) => {
    try {
      const deletedSafetyTip = await WellnessSurvey.findByIdAndDelete(
        req.params.id
      );
      if (deletedSafetyTip) {
        return res.status(200).json({
          success: true,
          message: "WellnessSurvey  deleted successfully",
        });
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
  }
);

module.exports = wellnessSurveyController;
