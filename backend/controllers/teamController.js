const teamController = require("express").Router();
const Team = require("../models/Team");
const AssistanceRequest = require("../models/AssistanceRequest");
const User = require("../models/User");
const tokenMiddleware = require("../middlewares/tokenMiddleware");
const { createAuditTrail } = require("./auditTrailController");
const { isEmpty, getUsersId } = require("./functionController");

const { sendSMS, sendBulkSMS } = require("./apiController");
const {
  createNotification,
  createNotificationAll,
} = require("./notificationController");
const { create } = require("../models/AuditTrail");

teamController.post(
  "/add",
  tokenMiddleware,
  /*  userTypeMiddleware(["employee", "admin"]), */
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
          req.io.emit("team");
          createAuditTrail(
            req.user.id,
            team._id,
            "Team",
            "Team",
            "Add",
            /* "New team has been added." */
            `Added a new team, ${team.name}`
          );
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
teamController.put("/reset", tokenMiddleware, async (req, res) => {
  try {
    const updateFields = { head: null, members: [] };

    const team = await Team.updateMany({}, updateFields);

    if (team) {
      req.io.emit("team");
      const respondersId = await getUsersId("responder");

      await createNotification(
        req,
        respondersId,
        "team",
        "New Team Rotation",
        "A new team rotation will be implemented. Please check your team assignment later.",
        "info"
      );
      createAuditTrail(
        req.user.id,
        team._id,
        "Team",
        "Team",
        "Reset Team Rotation",
        /* "New team has been added." */
        `Reset the team rotation`
      );
      return res.status(200).json({
        success: true,
        message: "Reset Successfully",
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
teamController.get("/", async (req, res) => {
  try {
    const team = await Team.find({
      archivedDate: { $exists: false },
      isArchived: false,
    })
      .populate("requestId")
      .populate("head", "-password")
      .populate("members", "-password");

    if (team) {
      return res.status(200).json(team);
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
    console.log(userId);
    const team = await Team.findOne({
      $or: [{ members: userId }, { head: userId }],
    })
      .populate("requestId")
      .populate("head", "-password")
      .populate("members", "-password");

    if (team) {
      return res.status(200).json({
        success: true,
        message: "Team found",
        name: team.name,
        position: team.head && team.head._id == userId ? "leader" : "member",
        _id: team._id,
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
teamController.get("/active", async (req, res) => {
  try {
    const assignedTeams = await AssistanceRequest.find(
      { status: "ongoing" },
      "assignedTeam"
    );

    const team = await Team.find({
      $and: [
        { head: { $ne: null } },
        { members: { $ne: [] } },
        { _id: { $nin: assignedTeams.map((item) => item.assignedTeam) } },
      ],
    })
      .populate("requestId")
      .populate("head", "-password")
      .populate("members", "-password");

    if (team) {
      return res.status(200).json(team);
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
    const teams = await Team.find({
      archivedDate: { $exists: false },
      isArchived: false,
    })
      .populate("requestId")
      .populate("head")
      .populate("members");

    if (teams.length > 0) {
      let assignedResponders = [];
      let unassignedResponders = [];

      for (const team of teams) {
        if (team.head) {
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

        assignedResponders: assignedResponders,
        unassignedResponders: unassignedResponders,
        responders: [...unassignedResponders, ...assignedResponders],
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
    const team = await Team.findOne({
      _id: req.params.id,
      archivedDate: { $exists: false },
      isArchived: false,
    })
      .populate("requestId")
      .populate("head", "-password")
      .populate("members", "-password");

    if (team) {
      return res.status(200).json({
        success: true,

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

teamController.put(
  "/reset/:id",
  tokenMiddleware,
  /*  userTypeMiddleware(["employee", "admin"]), */ async (req, res) => {
    const error = {};
    try {
      const updateFields = { head: null, members: [] };

      const team = await Team.findByIdAndUpdate(req.params.id, updateFields);

      if (team) {
        req.io.emit("team");

        if (team.members.length !== 0) {
          await createNotification(
            req,
            team.members,
            team._id,
            `Team Assignment`,
            `You have been remove from ${team.name}.`,
            "info"
          );
        }

        if (team.head != null) {
          await createNotification(
            req,
            [team.head],
            team._id,
            `Team Assignment`,
            `You have been remove from ${team.name}.`,
            "info"
          );
        }
        createAuditTrail(
          req.user.id,
          team._id,
          "Team",
          "Team",
          `Remove All Members`,
          /* "New team has been added." */
          `Removed all members from ${team.name}`
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
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
      });
    }
  }
);

teamController.delete(
  "/delete/:id",
  tokenMiddleware,
  /*  userTypeMiddleware(["employee", "admin"]), */
  async (req, res) => {
    try {
      const team = await Team.findByIdAndDelete(req.params.id);
      if (team) {
        const teamMembers = [team.head, ...team.members];

        if (team.head !== null || team.members.length !== 0) {
          await createNotification(
            req,
            teamMembers,
            team._id,
            `Team Deleted`,
            `Your current team, ${team.name} has been deleted.`,
            "info"
          );
          createAuditTrail(
            req.user.id,
            team._id,
            "Team",
            "Team",
            `Delete`,
            `Deleted team ${team.name}.`
          );
          req.io.emit("team");
          req.io.emit(team._id);
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
  //userTypeMiddleware(["employee", "admin"]),
  async (req, res) => {
    try {
      let action = req.params.action.toLowerCase();
      const { newTeamId, userId, prevTeamId } = req.body;

      let team;
      let removedTeam;
      let reassignedTeam;

      if (newTeamId === "unassigned") {
        if (action === "member") {
          removedTeam = await Team.findByIdAndUpdate(
            prevTeamId,
            { $pull: { members: userId } },
            { new: true }
          )
            .populate("members", "-password")
            .populate("head", "-password");
        } else if (action === "head") {
          removedTeam = await Team.findByIdAndUpdate(
            prevTeamId,
            { head: null },
            { new: true }
          )
            .populate("members", "-password")
            .populate("head", "-password");
        }
      } else if (
        prevTeamId === "" ||
        prevTeamId === null ||
        prevTeamId === undefined
      ) {
        if (action === "member") {
          team = await Team.findByIdAndUpdate(
            newTeamId,
            { $push: { members: userId } },
            { new: true }
          )
            .populate("members", "-password")
            .populate("head", "-password");
        } else if (action === "head") {
          team = await Team.findByIdAndUpdate(
            newTeamId,
            { head: userId },
            { new: true }
          )
            .populate("members", "-password")
            .populate("head", "-password");
        }
      } else {
        removedTeam = await Team.findById(prevTeamId);
        if (removedTeam.head && removedTeam.head.toString() === userId) {
          removedTeam.head = null;
        } else {
          removedTeam.members.pull(userId);
        }

        await removedTeam.save();
        if (action === "member") {
          team = await Team.findByIdAndUpdate(
            newTeamId,
            { $push: { members: userId } },
            { new: true }
          )
            .populate("members", "-password")
            .populate("head", "-password");
        } else if (action === "head") {
          team = await Team.findByIdAndUpdate(
            newTeamId,
            { head: userId },
            { new: true }
          )
            .populate("members", "-password")
            .populate("head", "-password");
        }
      }

      if (team || removedTeam || reassignedTeam) {
        if (newTeamId === "unassigned") {
          await createNotification(
            req,
            [userId],
            userId,
            `Team Assignment`,
            `You have been remove from ${removedTeam.name}.`,
            "info"
          );
          createAuditTrail(
            req.user.id,
            removedTeam._id,
            "Team",
            "Team",
            `Unassign`,
            `Unassigned ${userId.firstname} ${userId.lastname} from team ${removedTeam.name}`
          );
        } else if (prevTeamId === "") {
          await createNotification(
            req,
            [userId],
            userId,
            `Team Assignment`,
            `You have been assigned to ${team.name} as ${
              action === "head" ? "team leader " : "a " + action
            }.`,
            "info"
          );
          createAuditTrail(
            req.user.id,
            team._id,
            "Team",
            "Team",
            `Assign`,
            `Assigned ${userId.firstname} ${userId.lastname} to team ${
              team.name
            } as ${action === "head" ? "team leader " : "a " + action}`
          );
        } else {
          await createNotification(
            req,
            [userId],
            userId,
            `Team Assignment`,
            `You have been reassigned to ${team.name} as ${
              action === "head" ? "team leader " : "a " + action
            }.`,
            "info"
          );
          createAuditTrail(
            req.user.id,
            team._id,
            "Team",
            "Team",
            `Reassign`,
            `Reassigned ${userId.firstname} ${userId.lastname} to team ${
              team.name
            } as ${action === "head" ? "team leader " : "a " + action}`
          );
        }

        req.io.emit("team");

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
  /*  userTypeMiddleware(["employee", "admin"]), */ async (req, res) => {
    const error = {};
    try {
      let { head, members } = req.body;

      const oldTeam = await Team.findById(req.params.id);

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

      const updatedTeam = await oldTeam.save();

      if (Object.keys(error).length === 0) {
        const updateFields = { head, members };

        const team = await Team.findByIdAndUpdate(req.params.id, updateFields, {
          new: true,
        });

        if (team) {
          req.io.emit("team");
          if (!isEmpty(head))
            await createNotification(
              req,
              [head],
              team._id,
              `Team Assignment`,
              `You have been assigned to ${team.name} as team leader.`,
              "info"
            );
          if (members.length !== 0)
            await createNotification(
              req,
              members,
              team._id,
              `Team Assignment `,
              `You have been assigned to ${team.name} as a member.`,
              "info"
            );

          createAuditTrail(
            req.user.id,
            team._id,
            "Team",
            "Team",
            "Update",
            /* "Wellness check survey has been updated" */
            `Updated team ${team.title}`
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
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
      });
    }
  }
);

teamController.put(
  "/:action/:id",
  tokenMiddleware,
  //   userTypeMiddleware([
  //       "responder",
  //   "dispatcher",
  //   "employee",
  //   "admin",
  // ]),
  async (req, res) => {
    const error = {};
    try {
      let updateFields = {};
      let action = req.params.action.toLowerCase();
      if (action === "unarchive" || action === "archive") {
        if (Object.keys(error).length === 0) {
          if (action === "archive") {
            updateFields = {
              isArchived: true,
              archivedDate: Date.now(),
            };
          } else if (action === "unarchive") {
            updateFields = {
              $unset: { archivedDate: Date.now() },
            };
          }
          const team = await Team.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true }
          );
          if (team) {
            if (action === "archive") {
              const updateFields = { head: null, members: [] };

              const team = await Team.findByIdAndUpdate(
                req.params.id,
                updateFields
              );
              if (team) {
                const teamMembers = [team.head, ...team.members];

                if (team.head !== null || team.members.length !== 0) {
                  await createNotification(
                    req,
                    teamMembers,
                    team._id,
                    `Team Archived`,
                    `Your current team, ${team.name} has been archived.`,
                    "info"
                  );
                  createAuditTrail(
                    req.user.id,
                    team._id,
                    "Team",
                    "Team",
                    "Archive",
                    `Archived team ${team.name}.`
                  );
                  req.io.emit("team");
                }

                return res.status(200).json({
                  success: true,
                  message: "Archived Successfully",
                });
              } else {
                return res.status(500).json({
                  success: false,
                  message: "Internal Server Error",
                });
              }
            } else if (action === "unarchive") {
              req.io.emit("team");
              createAuditTrail(
                req.user.id,
                team._id,
                "Team",
                "Team",
                "Unarchive",
                `Unarchived team ${team.name}.`
              );
              return res.status(200).json({
                success: true,
                message: "Unrchived Successfully",
              });
            }
          } else {
            return res.status(400).json({
              success: false,
              message: "not found",
            });
          }
        }
        if (Object.keys(error).length !== 0) {
          error["success"] = false;
          error["message"] = "input error";
          return res.status(400).json(error);
        }
      } else {
        return res.status(500).json({
          success: false,
          message: "Error 404: Not Found",
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

module.exports = teamController;
