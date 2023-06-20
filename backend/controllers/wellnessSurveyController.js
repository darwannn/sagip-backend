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
wellnessSurveyController.get("/report/:id", async (req, res) => {
  try {
    /* const barangay =  [
      "anilao",
      "atlag",
      "babatnin",
      "bagna",
      "bagong bayan",
      "balayong",
      "balite",
      "bangkal",
      "barihan",
      "bulihan",
      "bungahan",
      "caingin",
      "calero",
      "caliligawan",
      "canalate",
      "caniogan",
      "catmon",
      "cofradia",
      "dakila",
      "guinhawa",
      "ligas",
      "liyang",
      "longos",
      "look 1st",
      "look 2nd",
      "lugam",
      "mabolo",
      "mambog",
      "masile",
      "matimbo",
      "mojon",
      "namayan",
      "niugan",
      "pamarawan",
      "panasahan",
      "pinagbakahan",
      "san agustin",
      "san gabriel",
      "san juan",
      "san pablo",
      "san vicente (pob.)",
      "santiago",
      "santisima trinidad",
      "santo cristo",
      "santo niño (pob.)",
      "santo rosario (pob.)",
      "santol",
      "sumapang bata",
      "sumapang matanda",
      "taal",
      "tikay",
    ]; */
    const barangay = [
      "Anilao",
      "Atlag",
      "Babatnin",
      "Bagna",
      "Bagong Bayan",
      "Balayong",
      "Balite",
      "Bangkal",
      "Barihan",
      "Bulihan",
      "Bungahan",
      "Caingin",
      "Calero",
      "Caliligawan",
      "Canalate",
      "Caniogan",
      "Catmon",
      "Cofradia",
      "Dakila",
      "Guinhawa",
      "Ligas",
      "Liyang",
      "Longos",
      "Look 1st",
      "Look 2nd",
      "Lugam",
      "Mabolo",
      "Mambog",
      "Masile",
      "Matimbo",
      "Mojon",
      "Namayan",
      "Niugan",
      "Pamarawan",
      "Panasahan",
      "Pinagbakahan",
      "San Agustin",
      "San Gabriel",
      "San Juan",
      "San Pablo",
      "San Vicente (Pob.)",
      "Santiago",
      "Santisima Trinidad",
      "Santo Cristo",
      "Santo Niño (Pob.)",
      "Santo Rosario (Pob.)",
      "Santol",
      "Sumapang Bata",
      "Sumapang Matanda",
      "Taal",
      "Tikay",
    ];
    const wellnessSurvey = await WellnessSurvey.findById(req.params.id)
      .populate("unaffected")
      .populate("affected");

    if (wellnessSurvey) {
      const barangayCounts = {
        affected: {},
        unaffected: {},
      };

      // Initialize counts for each barangay
      barangay.forEach((barangayName) => {
        barangayCounts.affected[barangayName] = 0;
        barangayCounts.unaffected[barangayName] = 0;
      });

      // Initialize count for 'other'
      barangayCounts.affected.Other = 0;
      barangayCounts.unaffected.Other = 0;

      // Count affected users in each barangay
      wellnessSurvey.affected.forEach((user) => {
        const userBarangay = user.barangay;
        if (barangay.includes(userBarangay)) {
          barangayCounts.affected[userBarangay]++;
        } else {
          barangayCounts.affected.Other++;
        }
      });

      // Count unaffected users in each barangay
      wellnessSurvey.unaffected.forEach((user) => {
        const userBarangay = user.barangay;
        if (barangay.includes(userBarangay)) {
          barangayCounts.unaffected[userBarangay]++;
        } else {
          barangayCounts.unaffected.Other++;
        }
      });

      return res.status(200).json({
        success: true,
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
        //already an active
        const activeWellnessSurvey = await WellnessSurvey.find({
          isActive: true,
        });
        if (!(activeWellnessSurvey._id !== req.params.id && isActive)) {
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
