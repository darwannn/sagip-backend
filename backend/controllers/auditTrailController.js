const auditTrailController = require("express").Router();

const AuditTrail = require("../models/AuditTrail");
const tokenMiddleware = require("../middlewares/tokenMiddleware");

auditTrailController.get(
  "/",
  tokenMiddleware,
  /*  userTypeMiddleware(["admin"]), */ async (req, res) => {
    try {
      const auditTrail = await AuditTrail.find(/* {
        archivedDate: { $exists: false },
        isArchived: false,
      } */)
        .populate("userId", "-password")
        .populate("actionId");

      if (auditTrail) {
        return res.status(200).json(auditTrail);
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
auditTrailController.get(
  "/:id",
  tokenMiddleware,
  /*  userTypeMiddleware(["admin"]), */ async (req, res) => {
    try {
      const auditTrail = await AuditTrail.findById(req.params.id)
        .populate("userId", "-password")
        .populate("actionId");

      if (auditTrail) {
        return res.status(200).json(auditTrail);
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

const createAuditTrail = async (
  userId,
  actionId,
  docModel,
  category,
  action,
  description
) => {
  try {
    const auditTrail = await AuditTrail.create({
      userId,
      actionId,
      docModel,
      description,
      category,
      action,
    });

    if (auditTrail) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

module.exports = { createAuditTrail, auditTrailController };
