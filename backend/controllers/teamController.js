const teamController = require("express").Router();
const Team = require("../models/Team");
const AssistanceRequest = require("../models/AssistanceRequest");
const User = require("../models/User");
const tokenMiddleware = require("../middlewares/tokenMiddleware");
const {
  isEmpty,
  isImage,
  isLessThanSize,
  getTeamMembersId,
} = require("./functionController");
const userTypeMiddleware = require("../middlewares/userTypeMiddleware");
const { createPusher, sendSMS, sendBulkSMS } = require("./apiController");
const {
  createNotification,
  createNotificationAll,
} = require("./notificationController");
teamController.post(
  "/add",
  tokenMiddleware,
  /*  userTypeMiddleware(["admin", "super-admin"]), */
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
          /*  await createPusher("team", "reload", {}); */
          /*  req.io.emit("reload", { receiver: "team" }); */
          /* req.io.emit("team"); */
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
teamController.get("/myteam", tokenMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const team = await Team.findOne({
      $or: [{ members: userId }, { head: userId }],
    })
      .populate("head", "-password")
      .populate("members", "-password");

    if (team) {
      return res.status(200).json({
        success: true,
        message: "Team found",
        name: team.name,
        position: team.head._id === userId ? "head" : "member",
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
    });
  }
});
teamController.get("/active", async (req, res) => {
  try {
    const assignedTeams = await AssistanceRequest.find(
      { status: "ongoing" },
      "assignedTeam"
    );
    /*    console.log("====================================");
    console.log(await getTeamMembersId("64a6d2deea160b889a498dc5"));
    console.log("===================================="); */
    const team = await Team.find({
      $and: [
        { head: { $ne: null } },
        { members: { $ne: [] } },
        { _id: { $nin: assignedTeams.map((item) => item.assignedTeam) } },
      ],
    })
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
    const teams = await Team.find({}).populate("head").populate("members");

    if (teams.length > 0) {
      let assignedResponders = [];
      let unassignedResponders = [];

      for (const team of teams) {
        if (team.head) {
          console.log("====================================");
          console.log(team.head);
          console.log("====================================");
          if (team.head.isArchived === false) {
            assignedResponders.push({
              _id: team.head._id,
              firstname: team.head.firstname,
              middlename: team.head.middlename,
              lastname: team.head.lastname,
              email: team.head.email,
              teamName: team.name,
              teamId: team._id,
              profilePicture: team.profilePicture,
            });
          }
        }

        for (const member of team.members) {
          if (member.isArchived === false) {
            assignedResponders.push({
              _id: member._id,
              firstname: member.firstname,
              middlename: member.middlename,
              lastname: member.lastname,
              email: member.email,
              teamName: team.name,
              teamId: team._id,
              profilePicture: team.profilePicture,
            });
          }
        }
      }

      const assignedUserIds = assignedResponders.map((user) => user._id);
      console.log(assignedUserIds);
      const unassignedUsers = await User.find({
        userType: "responder",
        _id: { $nin: assignedUserIds },
        archivedDate: { $exists: false },
        isArchived: false,
      });
      unassignedResponders = unassignedUsers.map((user) => ({
        _id: user._id,
        firstname: user.firstname,
        middlename: user.middlename,
        lastname: user.lastname,
        email: user.email,
        profilePicture: user.profilePicture,
      }));

      return res.status(200).json({
        success: true,
        /* message: "found", */
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
    const team = await Team.findById(req.params.id)
      .populate("head", "-password")
      .populate("members", "-password");

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

teamController.delete(
  "/delete/:id",
  tokenMiddleware,
  /*  userTypeMiddleware(["admin", "super-admin"]), */
  async (req, res) => {
    try {
      const team = await Team.findByIdAndDelete(req.params.id);
      if (team) {
        const teamMembers = [team.head, ...team.members];
        console.log("========teamMembers============================");
        console.log(teamMembers);
        console.log("====================================");
        if (team.head !== null || team.members.length !== 0) {
          console.log("====================================");
          console.log("inside");
          console.log("====================================");
          await createNotification(
            teamMembers,
            team._id,
            `Team Deleted`,
            `Your current team, ${team.name} has been deleted.`,
            "info"
          );
          /* await createPusher("team", "reload", {}); */
          /* req.io.emit("reload", { receiver: "team" }); */
          req.io.emit("team");
        }
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

teamController.put(
  "/update/assignment/:action",
  tokenMiddleware,
  /*  userTypeMiddleware(["admin", "super-admin"]), */ async (req, res) => {
    try {
      let action = req.params.action.toLowerCase();
      const { newTeamId, userId, prevTeamId } = req.body;
      console.log(userId);
      console.log(newTeamId);
      console.log(prevTeamId);

      let team;
      let removedTeam;
      let reassignedTeam;
      //may team gagawing unassigned
      if (newTeamId === "unassigned") {
        if (action === "member") {
          console.log("====================================");
          console.log(prevTeamId);
          console.log("====================================");
          removedTeam = await Team.findByIdAndUpdate(
            prevTeamId,
            { $pull: { members: userId } },
            { new: true }
          );
          console.log("mem");
        } else if (action === "head") {
          removedTeam = await Team.findByIdAndUpdate(
            prevTeamId,
            { head: null },
            { new: true }
          );
          console.log("head1");
        }
        console.log("removedTeam:", removedTeam);
      } else if (prevTeamId === "") {
        // walang prev team
        if (action === "member") {
          team = await Team.findByIdAndUpdate(
            newTeamId,
            { $push: { members: userId } },
            { new: true }
          );
        } else if (action === "head") {
          team = await Team.findByIdAndUpdate(
            newTeamId,
            { head: userId },
            { new: true }
          );
        }
      } else {
        if (action === "member") {
          reassignedTeam = await Team.findByIdAndUpdate(
            prevTeamId,
            { $pull: { members: userId } },
            { new: true }
          );
          team = await Team.findByIdAndUpdate(
            newTeamId,
            { $push: { members: userId } },
            { new: true }
          );
        } else if (action === "head") {
          reassignedTeam = await Team.findByIdAndUpdate(
            prevTeamId,
            { head: null },
            { new: true }
          );
          team = await Team.findByIdAndUpdate(
            newTeamId,
            { head: userId },
            { new: true }
          );
        }
      }
      console.log("====================================");
      console.log(removedTeam);
      console.log("====================================");
      if (team || removedTeam || reassignedTeam) {
        //may team gagawing unassigned
        if (newTeamId === "unassigned") {
          await createNotification(
            [userId],
            userId,
            `Team Assignment`,
            `You have been remove from ${removedTeam.name}.`,
            "info"
          );
        } else if (prevTeamId === "") {
          // walang prev team
          await createNotification(
            [userId],
            userId,
            `Team Assignment`,
            `You have been assigned to ${team.name}.`,
            "info"
          );
        } else {
          await createNotification(
            [userId],
            userId,
            `Team Assignment`,
            `You have been assigned to ${team.name}.`,
            "info"
          );
        }
        /* await createPusher("team", "reload", {}); */
        /* req.io.emit("reload", { receiver: "team" }); */
        /* req.io.emit("team"); */
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
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
      });
    }
  }
);
teamController.put(
  "/update/unassign/:action",
  tokenMiddleware,
  /*  userTypeMiddleware(["admin", "super-admin"]), */ async (req, res) => {
    try {
      const { newTeamId, userId } = req.body;

      let team;
      let removedTeam;
      let reassignedTeam;
      //may team gagawing unassigned
      if (newTeamId === "unassigned") {
        console.log("====================================");
        console.log(prevTeamId);
        console.log("====================================");
        removedTeam = await Team.findByIdAndUpdate(
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
        reassignedTeam = await Team.findByIdAndUpdate(
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

      if (team || removedTeam || reassignedTeam) {
        //may team gagawing unassigned
        if (newTeamId === "unassigned") {
          await createNotification(
            [userId],
            userId,
            `Team Assignment`,
            `You have been removed from ${removedTeam.name}.`,
            "info"
          );
        } else if (prevTeamId === "") {
          // walang prev team
          await createNotification(
            [userId],
            userId,
            `Team Assignment`,
            `You have been assigned to ${team.name} as member.`,
            "info"
          );
        } else {
          await createNotification(
            [userId],
            userId,
            `Team Assignment`,
            `You have been assigned to ${team.name} as member.`,
            "info"
          );
        }
        /* await createPusher("team", "reload", {}); */
        /* req.io.emit("reload", { receiver: "team" }); */
        /* req.io.emit("team"); */
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
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
      });
    }
  }
);
teamController.put(
  "/update/:id",
  tokenMiddleware,
  /*  userTypeMiddleware(["admin", "super-admin"]), */ async (req, res) => {
    const error = {};
    try {
      let { head, members } = req.body;
      /*  console.log(head); */
      console.log(head);
      console.log(members);
      const oldTeam = await Team.findById(req.params.id);

      // Update the team properties with the new values

      if (isEmpty(head)) {
        if (oldTeam.head !== null) {
          head = oldTeam.head;
        } else {
          head = null;
        }
      }

      if (!Array.isArray(members)) {
        members = [];
      }
      members = [...members, ...oldTeam.members];

      /*   members = [...members, ...oldTeam.members]; */

      // Save the updated team object to the database
      const updatedTeam = await oldTeam.save();

      // if (isEmpty(head)) error["head"] = "Required field";
      // if (members.length === 0) error["members"] = "Required field";

      if (Object.keys(error).length === 0) {
        const updateFields = { head, members };
        /*      const previousTeam = await Team.findById(req.params.id);
        const previousMembers = previousTeam.members; */
        const team = await Team.findByIdAndUpdate(req.params.id, updateFields, {
          new: true,
        });

        if (team) {
          /* await createPusher("team", "reload", {}); */
          /* req.io.emit("reload", { receiver: "team" }); */
          req.io.emit("team");
          if (!isEmpty(head))
            await createNotification(
              [head],
              team._id,
              `Team Assignment`,
              `You have been assigned to ${team.name} as head.`,
              "info"
            );
          if (!members.length === 0)
            await createNotification(
              members,
              team._id,
              `Team Assignment `,
              `You have been assigned to ${team.name} as member.`,
              "info"
            );

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
      console.log("====================================");
      console.log(error);
      console.log("====================================");
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
      });
    }
  }
);
teamController.put(
  "/reset/:id",
  tokenMiddleware,
  /*  userTypeMiddleware(["admin", "super-admin"]), */ async (req, res) => {
    const error = {};
    try {
      const updateFields = { head: null, members: [] };

      const team = await Team.findByIdAndUpdate(req.params.id, updateFields);

      if (team) {
        /* await createPusher("team", "reload", {}); */
        /* req.io.emit("reload", { receiver: "team" }); */
        req.io.emit("team");

        await createNotification(
          [team.head, ...team.members],
          team._id,
          `Team Assignment`,
          `You have been remove from ${team.name}.`,
          "info"
        );

        return res.status(200).json({
          success: true,
          message: "Reset Successfully",
          team,
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }
    } catch (error) {
      console.log("====================================");
      console.log(error);
      console.log("====================================");
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
      });
    }
  }
);

module.exports = teamController;
