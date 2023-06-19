const wellnessSurveyController = require("express").Router();
const WellnessSurvey = require("../models/WellnessSurvey");
const User = require("../models/User");
const tokenMiddleware = require("../middlewares/tokenMiddleware");
const { isEmpty } = require("./functionController");

wellnessSurveyController.post("/add", tokenMiddleware, async (req, res) => {
  const error = {};
  try {
    const { title, category } = req.body;

    if (isEmpty(title)) error["title"] = "Required field";
    if (isEmpty(category)) error["category"] = "Required field";

    if (Object.keys(error).length === 0) {
      const wellnessSurvey = await WellnessSurvey.create({
        title,
        category,
      });

      if (wellnessSurvey) {
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
});

/* get all */
wellnessSurveyController.get("/", async (req, res) => {
  try {
    const wellnessSurvey = await WellnessSurvey.find({});
    if (wellnessSurvey) {
      return res.status(200).json(wellnessSurvey);
      return res.status(200).json({
        /* success: true,
        message: "found", 
        wellnessSurvey,*/
        ...wellnessSurvey,
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
wellnessSurveyController.get("/active", tokenMiddleware, async (req, res) => {
  try {
    const wellnessSurvey = await WellnessSurvey.findOne({ isActive: true });

    const user = await User.findOne({
      _id: req.user.id,
    });

    if (user.userType === "resident") {
      let surveyResponse = [
        ...wellnessSurvey.affected,
        ...wellnessSurvey.unaffected,
      ];
      let isResponded = false;

      surveyResponse.map((response) => {
        if (response.toString() === req.user.id) {
          isResponded = true;
          return;
        } else {
          isResponded = false;
        }
      });
      if (isResponded) {
        return res.status(200).json({
          success: false,
          message: "already responded",
        });
      } else {
        return res
          .status(200)
          .json({ success: true, message: "success", ...wellnessSurvey._doc });
      }
    } else {
      return res
        .status(200)
        .json({ success: true, message: "success", ...wellnessSurvey._doc });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error,
    });
  }
});

wellnessSurveyController.get("/:id", async (req, res) => {
  try {
    const wellnessSurvey = await WellnessSurvey.findById(req.params.id);

    if (wellnessSurvey) {
      /*      return res.status(200).json(wellnessSurvey); */
      return res.status(200).json({
        success: true,
        message: "found",
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
            message: "Updated successfully",
            wellnessSurvey,
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
});

wellnessSurveyController.delete(
  "/delete/:id",
  tokenMiddleware,
  async (req, res) => {
    try {
      const wellnessSurvey = await WellnessSurvey.findByIdAndDelete(
        req.params.id
      );
      if (wellnessSurvey) {
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

module.exports = wellnessSurveyController;
