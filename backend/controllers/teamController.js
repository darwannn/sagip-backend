const teamController = require("express").Router();
const Team = require("../models/Team");
const User = require("../models/User");
const tokenMiddleware = require("../middlewares/tokenMiddleware");
const { isEmpty, isImage, isLessThanSize } = require("./functionController");

teamController.post(
  "/add",
  tokenMiddleware,

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
    /*   let responders = await User.find({
      userType: "resident",
    }).populate("teamId"); */

    const teams = await Team.find({}).populate("head").populate("members");

    if (teams.length > 0) {
      let assignedResponders = [];
      let unassignedResponders = [];

      for (const team of teams) {
        if (team.head) {
          assignedResponders.push({
            _id: team.head._id,
            firstname: team.head.firstname,
            middlename: team.head.middlename,
            lastname: team.head.lastname,
            email: team.head.email,
            teamName: team.name,
            teamId: team._id,
          });
        }

        for (const member of team.members) {
          assignedResponders.push({
            _id: member._id,
            firstname: member.firstname,
            middlename: member.middlename,
            lastname: member.lastname,
            email: member.email,
            teamName: team.name,
            teamId: team._id,
          });
        }
      }

      const assignedUserIds = assignedResponders.map((user) => user._id);
      console.log(assignedUserIds);
      const unassignedUsers = await User.find({
        userType: "resident",
        _id: { $nin: assignedUserIds },
      });
      unassignedResponders = unassignedUsers.map((user) => ({
        _id: user._id,
        firstname: user.firstname,
        middlename: user.middlename,
        lastname: user.lastname,
        email: user.email,
      }));

      return res.status(200).json({
        success: true,
        /* message: "Data found", */
        assignedResponders: assignedResponders,
        unassignedResponders: unassignedResponders,
        responders: [...unassignedResponders, ...assignedResponders],
        /*  responders, */
      });
    } else {
      return res.status(200).json({
        success: false,
        message: "No teams found",
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
        /*   message: "found", */
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

teamController.put("/update/assignment/", tokenMiddleware, async (req, res) => {
  /* const error = {}; */
  try {
    const { newTeamId, userId, prevTeamId } = req.body;

    /* if (Object.keys(error).length === 0) { */
    let team;
    //may team gagawing unassigned
    if (newTeamId === "unassigned") {
      console.log("====================================");
      console.log("unassigned");
      console.log("====================================");
      team = await Team.findByIdAndUpdate(
        prevTeamId,
        { $pull: { members: userId } },
        { new: true }
      );
    } else if (prevTeamId === "") {
      // walang prev team
      team = await Team.findByIdAndUpdate(
        newTeamId,
        { $push: { members: userId } },
        { new: true }
      );
    } else {
      const removeTeam = await Team.findByIdAndUpdate(
        prevTeamId,
        { $pull: { members: userId } },
        { new: true }
      );
      team = await Team.findByIdAndUpdate(
        newTeamId,
        { $push: { members: userId } },
        { new: true }
      );
    }

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
    /*  } */

    /*  if (Object.keys(error).length !== 0) {
        error["success"] = false;
        error["message"] = "input error";
        return res.status(400).json(error);
      } */
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error,
    });
  }
});
teamController.put("/update/:id", tokenMiddleware, async (req, res) => {
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
});

module.exports = teamController;
