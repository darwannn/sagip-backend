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

      const newAssistanceRequest = assistanceRequests.filter(
        (request) =>
          request.status === "unverified" || request.status === "incomplete"
      ).length;
      const ongoingAssistanceRequest = assistanceRequests.filter(
        (request) => request.status === "ongoing"
      ).length;
      const resolvedAssistanceRequest = assistanceRequests.filter(
        (request) => request.status === "resolved"
      ).length;

      const newHazardReport = hazardReports.filter(
        (report) => report.status === "unverified"
      ).length;

      const ongoingHazardReport = hazardReports.filter(
        (report) => report.status === "ongoing"
      ).length;

      const resolvedHazardReport = hazardReports.filter(
        (report) => report.status === "resolved"
      ).length;

      const hospital = emergencyFacilities.filter(
        (facility) => facility.category === "Hospital"
      ).length;

      const fireStation = emergencyFacilities.filter(
        (facility) => facility.category === "Fire Station"
      ).length;

      const policeStation = emergencyFacilities.filter(
        (facility) => facility.category === "Police Station"
      ).length;

      const evacuatiionCenter = emergencyFacilities.filter(
        (facility) => facility.category === "Evacuation Center"
      ).length;

      if (users) {
        /* assistanceRequest */
        const pendingAssistanceRequests = assistanceRequests.filter(
          (request) =>
            request.status === "unverified" || request.status === "incomplete"
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
          return (
            moment(user.createdAt).isSame(moment(), "month") &&
            user.userType === "resident"
          );
        }).length;
        const staffs = users.filter((user) => user.userType !== "resident");
        /*  const activeUsersThisMonth = users.filter((user) =>
          moment(user.updatedAt).isSame(moment(), "month")
        ).length; */
        const dispatchers = staffs.filter(
          (user) => user.userType === "dispatcher"
        ).length;

        const responders = staffs.filter(
          (user) => user.userType === "responder"
        ).length;

        const employees = staffs.filter(
          (user) => user.userType === "employee"
        ).length;

        const admins = staffs.filter(
          (user) => user.userType === "admin"
        ).length;
        const verifiedUsers = users.filter((user) => {
          return user.status === "verified" && user.userType === "resident";
        }).length;
        const unverifiedUsers = users.filter((user) => {
          return user.status !== "verified" && user.userType === "resident";
        }).length;
    
        const responses =
          teams?.reduce((acc, team) => acc + team.response, 0) || 0;
        return res.status(200).json({

          emergencyFacilities: emergencyFacilities.length,
       
          pendingAssistanceRequests,
          pendingHazardReports,
          articles: articles.length,
          publishedArticles,
          draftArticles,       
          users: users.length,
          residents: residents,
          staffs: staffs.length,
          responses,
          usersThisMonth: usersThisMonth,

          verifiedUsers,
          unverifiedUsers,

          dispatchers,
          responders,
          employees,
          admins,
          assistanceRequests: assistanceRequests,

          newAssistanceRequest,
          ongoingAssistanceRequest,
          resolvedAssistanceRequest,
          newHazardReport,
          ongoingHazardReport,
          resolvedHazardReport,
          hospital,
          fireStation,
          policeStation,
          evacuatiionCenter,
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
