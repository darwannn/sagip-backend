const auditLogController = require("express").Router();

const AuditLog = require("../models/AuditLog");
const tokenMiddleware = require("../middlewares/tokenMiddleware");

auditLogController.get(
  "/",
  tokenMiddleware,
  /*  userTypeMiddleware(["admin"]), */ async (req, res) => {
    try {
      const auditLog = await AuditLog.find({
        archivedDate: { $exists: false },
        isArchived: false,
      }).populate("userId", "-password");

      if (auditLog) {
        return res.status(200).json(auditLog);
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
  }
);

const createAuditLog = async (
  userId,
  eventId,
  docModel,
  categoty,
  action,
  description
) => {
  try {
    const auditLog = await AuditLog.create({
      userId,
      eventId,
      docModel,
      description,
      categoty,
      action,
      scope,
    });

    if (auditLog) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

module.exports = { createAuditLog, auditLogController };
