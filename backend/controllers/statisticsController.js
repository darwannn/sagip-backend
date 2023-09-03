const statisticsController = require("express").Router();
const tokenMiddleware = require("../middlewares/tokenMiddleware");
const User = require("../models/User");

const AssistanceRequest = require("../models/AssistanceRequest");
const EmergencyFacility = require("../models/EmergencyFacility");
const HazardReport = require("../models/HazardReport");
const SafetyTip = require("../models/SafetyTip");
const Team = require("../models/Team");
const WellnessSurvey = require("../models/WellnessSurvey");

const moment = require("moment");

statisticsController.get(
  "/",
  /* tokenMiddleware, */ async (req, res) => {
    try {
      const users = await User.find({});
      const articles = await SafetyTip.find({});
      const assistanceRequests = await AssistanceRequest.find({});
      const hazardReports = await HazardReport.find({});
      const emergencyFacilities = await EmergencyFacility.find({});
      const teams = await Team.find({});

      if (users) {
        /* assistanceRequest */
        const pendingAssistanceRequests = assistanceRequests.filter(
          (request) => request.status === "unverified"
        ).length;
        const pendingHazardReports = hazardReports.filter(
          (report) => report.status === "unverified"
        ).length;
        /* articles */
        const publishedArticles = articles.filter(
          (article) => article.status === "published"
        ).length;
        const draftArticles = articles.filter(
          (article) => article.status === "draft"
        ).length;
        /* users */
        const residents = users.filter(
          (user) => user.userType === "resident"
        ).length;
        users.length;
        const usersThisMonth = users.filter((user) => {
          moment(user.createdAt).isSame(moment(), "month") &&
            user.userType === "resident";
        }).length;
        const staffs = users.filter((user) => user.userType !== "resident");
        const activeUsersThisMonth = users.filter((user) =>
          moment(user.updatedAt).isSame(moment(), "month")
        ).length;
        const dispatchers = staffs.filter(
          (user) => user.userType === "dispatcher"
        ).length;

        const responders = staffs.filter(
          (user) => user.userType === "responder"
        ).length;

        const admins = staffs.filter(
          (user) => user.userType === "admin"
        ).length;

        const superAdmins = staffs.filter(
          (user) => user.userType === "super-admin"
        ).length;
        const verifiedUsers = users.filter((user) => {
          return user.status === "verified" && user.userType === "resident";
        }).length;
        const unverifiedUsers = users.filter((user) => {
          return user.status !== "verified" && user.userType === "resident";
        }).length;
        /* team */
        const responses =
          teams?.reduce((acc, team) => acc + team.response, 0) || 0;
        return res.status(200).json({
          /* facility */
          emergencyFacilities: emergencyFacilities.length,
          /* request  */
          pendingAssistanceRequests,
          /* report */
          pendingHazardReports,
          /* articles */
          articles: articles.length,
          publishedArticles,
          draftArticles,
          /* users */
          users: users.length,
          residents: residents,
          staffs: staffs.length,
          responses,
          usersThisMonth: usersThisMonth,
          activeUsersThisMonth: activeUsersThisMonth,

          verifiedUsers,
          unverifiedUsers,

          dispatchers,
          responders,
          admins,
          superAdmins,
          assistanceRequests: hazardReports,
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
        message: "Internal Server Error " + error,
      });
    }
  }
);

module.exports = statisticsController;