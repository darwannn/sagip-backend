const preAssessmentController = require("express").Router();
const AssistanceRequest = require("../models/AssistanceRequest");
const PreAssessment = require("../models/PreAssessment");

const tokenMiddleware = require("../middlewares/tokenMiddleware");
const { createAuditTrail } = require("./auditTrailController");
const { isEmpty } = require("./functionController");
const moment = require("moment");
const multerMiddleware = require("../middlewares/multerMiddleware");
const { create } = require("../models/Team");

preAssessmentController.get("/:id", async (req, res) => {
  try {
    const preAssessment = await PreAssessment.findOne({
      _id: req.params.id,
    }).populate("requestId");

    if (preAssessment) {
      return res.status(200).json({
        ...preAssessment._doc,
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

preAssessmentController.post(
  "/add/:id",
  tokenMiddleware,
  //   userTypeMiddleware([
  //   "resident",
  //   "responder",
  //   "dispatcher",
  //   "employee",
  //   "admin",
  // ]),
  multerMiddleware.single("proof"),

  async (req, res) => {
    const error = {};
    try {
      let {
        isSelfReported,
        firstname,
        middlename,

        lastname,
        contactNumber,
        address,

        incidentLocation,
        incidentDescription,

        concerns,
        allergies,
        medications,
        medicalHistory,

        consciousness,

        speech,

        skin,

        color,

        respiration,
        pulse,

        pupils,
        age,
        gender,
        medicalCondition,
      } = req.body;

      if (isEmpty(incidentLocation))
        error["incidentLocation"] = "Required field";
      if (isEmpty(incidentDescription))
        error["incidentDescription"] = "Required field";

      // if (isEmpty(concerns)) error["concerns"] = "Required field";
      // if (isEmpty(allergies)) error["allergies"] = "Required field";
      // if (isEmpty(medications)) error["medications"] = "Required field";

      // if (isEmpty(consciousness)) error["consciousness"] = "Required field";
      // if (isEmpty(speech)) error["speech"] = "Required field";
      // if (isEmpty(skin)) error["skin"] = "Required field";
      // if (isEmpty(color)) error["color"] = "Required field";
      // if (isEmpty(respiration)) error["respiration"] = "Required field";
      // if (isEmpty(pulse)) error["pulse"] = "Required field";
      // if (isEmpty(pupils)) error["pupils"] = "Required field";

      // if (medicalHistory && medicalHistory.length === 0)
      //   error["medicalHistory"] = "Required field";
      // if (medicalCondition && medicalCondition.length === 0)
      //   error["medicalCondition"] = "Required field";

      if (isSelfReported === false || isSelfReported === "false") {
        if (isEmpty(firstname)) error["firstname"] = "Required field";
        if (isEmpty(middlename)) error["middlename"] = "Required field";
        if (isEmpty(lastname)) error["lastname"] = "Required field";
        if (isEmpty(address)) error["address"] = "Required field";
        if (isEmpty(contactNumber)) error["contactNumber"] = "Required field";
        if (isEmpty(age)) error["age"] = "Required field";
        if (isEmpty(gender)) error["gender"] = "Required field";
      } else {
        const assistanceRequest = await AssistanceRequest.findOne({
          _id: req.params.id,
        }).populate("userId");

        firstname = assistanceRequest.userId.firstname;
        middlename = assistanceRequest.userId.middlename;
        lastname = assistanceRequest.userId.lastname;
        address = `${assistanceRequest.userId.street}, ${assistanceRequest.userId.barangay}, ${assistanceRequest.userId.municipality}, ${assistanceRequest.userId.province}`;
        contactNumber = assistanceRequest.userId.contactNumber;
        const birthdate = assistanceRequest.userId.birthdate;

        const today = moment();

        age = birthdate ? today.diff(moment(birthdate), "years") : null;
        gender = assistanceRequest.userId.gender;
      }

      if (Object.keys(error).length === 0) {
        let medicalInformationData = {
          concerns,
          allergies,
          medications,
          medicalHistory,
          consciousness,
          speech,
          skin,
          color,
          respiration,
          pulse,
          pupils,
          medicalCondition,
        };
        let newData = {
          medicalInformation: medicalInformationData,
          requestId: req.params.id,
          firstname,
          middlename,
          lastname,
          address,
          contactNumber,
          incidentLocation,
          incidentDescription,
          age,
          gender,
        };

        const preAssessment = await PreAssessment.create(newData);
        const assistanceRequest = await AssistanceRequest.findByIdAndUpdate(
          req.params.id,
          { $push: { preAssessmentId: preAssessment._id } },
          { new: true }
        );
        if (preAssessment && assistanceRequest) {
          req.io.emit("assistance-request");
          createAuditTrail(
            req.user.id,
            preAssessment._id,
            "PreAssessment",
            "Incident Report",
            "Add",
            `Added an incident report for ${assistanceRequest.category}${
              assistanceRequest.street !== ""
                ? ` on ${assistanceRequest.street}`
                : ""
            }`
          );

          return res.status(200).json({
            success: true,
            message: "Created Successfully",
            preAssessment,
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
preAssessmentController.put(
  "/update/:id",
  tokenMiddleware,
  //   userTypeMiddleware([
  //   "responder",
  //   "dispatcher",
  //   "employee",
  //   "admin",
  // ]),
  multerMiddleware.single("proof"),

  async (req, res) => {
    const error = {};
    try {
      let {
        firstname,
        middlename,

        lastname,
        contactNumber,
        address,

        incidentLocation,
        incidentDescription,

        concerns,
        allergies,
        medications,
        medicalHistory,

        consciousness,

        speech,

        skin,

        color,

        respiration,
        pulse,

        pupils,

        age,
        gender,
        medicalCondition,
      } = req.body;

      if (isEmpty(incidentLocation))
        error["incidentLocation"] = "Required field";
      if (isEmpty(incidentDescription))
        error["incidentDescription"] = "Required field";
      if (isEmpty(age)) error["age"] = "Required field";
      if (isEmpty(gender)) error["gender"] = "Required field";

      // if (isEmpty(concerns)) error["concerns"] = "Required field";
      // if (isEmpty(allergies)) error["allergies"] = "Required field";
      // if (isEmpty(medications)) error["medications"] = "Required field";

      // if (isEmpty(consciousness)) error["consciousness"] = "Required field";
      // if (isEmpty(speech)) error["speech"] = "Required field";
      // if (isEmpty(skin)) error["skin"] = "Required field";
      // if (isEmpty(color)) error["color"] = "Required field";
      // if (isEmpty(respiration)) error["respiration"] = "Required field";
      // if (isEmpty(pulse)) error["pulse"] = "Required field";
      // if (isEmpty(pupils)) error["pupils"] = "Required field";

      // if (medicalHistory && medicalHistory.length === 0)
      //   error["medicalHistory"] = "Required field";
      // if (medicalCondition && medicalCondition.length === 0)
      //   error["medicalCondition"] = "Required field";

      if (isEmpty(firstname)) error["firstname"] = "Required field";
      if (isEmpty(middlename)) error["middlename"] = "Required field";
      if (isEmpty(lastname)) error["lastname"] = "Required field";
      if (isEmpty(address)) error["address"] = "Required field";
      if (isEmpty(contactNumber)) error["contactNumber"] = "Required field";

      if (Object.keys(error).length === 0) {
        let medicalInformationData = {
          concerns,
          allergies,
          medications,
          medicalHistory,
          consciousness,
          speech,
          skin,
          color,
          respiration,
          pulse,
          pupils,
          medicalCondition,
        };
        let updateFields = {
          medicalInformation: medicalInformationData,
          firstname,
          middlename,
          lastname,
          address,
          contactNumber,
          incidentLocation,
          incidentDescription,
          age,
          gender,
        };

        const preAssessment = await PreAssessment.findByIdAndUpdate(
          req.params.id,
          updateFields,
          { new: true }
        );

        if (preAssessment) {
          req.io.emit("assistance-request");
          createAuditTrail(
            req.user.id,
            preAssessment._id,
            "PreAssessment",
            "Incident Report",
            "Update",
            `Updated an incident report`
          );
          return res.status(200).json({
            success: true,
            message: "Updated Successfully",
            preAssessment,
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
preAssessmentController.delete(
  "/delete/:id",
  tokenMiddleware,
  //   userTypeMiddleware([
  //   "responder",
  //   "dispatcher",
  //   "employee",
  //   "admin",
  // ]),

  async (req, res) => {
    const error = {};
    try {
      const preAssessment = await PreAssessment.findByIdAndDelete(
        req.params.id
      );

      const assistanceRequest = await AssistanceRequest.findByIdAndUpdate(
        preAssessment.requestId,
        { $pull: { preAssessmentId: preAssessment._id } },
        { new: true }
      );

      if (assistanceRequest && preAssessment) {
        req.io.emit("assistance-request");
        createAuditTrail(
          req.user.id,
          preAssessment._id,
          "PreAssessment",
          "Incident Report",
          "Delete",
          `Deleted an incident report`
        );
        return res.status(200).json({
          success: true,
          message: "Deleted Successfully",
          assistanceRequest,
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

module.exports = preAssessmentController;
