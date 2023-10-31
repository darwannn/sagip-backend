const preAssessmentController = require("express").Router();
const AssistanceRequest = require("../models/AssistanceRequest");
const PreAssessment = require("../models/PreAssessment");

const tokenMiddleware = require("../middlewares/tokenMiddleware");

const { isEmpty } = require("./functionController");

const multerMiddleware = require("../middlewares/multerMiddleware");

preAssessmentController.get("/:id", async (req, res) => {
  try {
    const preAssessment = await PreAssessment.findOne({
      _id: req.params.id,
      /*   archivedDate: { $exists: false },
        isArchived: false, */
    }).populate("requestId");

    if (preAssessment) {
      /*      return res.status(200).json(assistanceRequest); */
      return res.status(200).json({
        /* success: true,
          message: "found", */
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

        signs,

        speech,

        skin,

        color,

        breathing,
        pulse,

        pupils,

        medicalCondition,
      } = req.body;

      if (isEmpty(incidentLocation))
        error["incidentLocation"] = "Required field";
      if (isEmpty(incidentDescription))
        error["incidentDescription"] = "Required field";

      if (isEmpty(concerns)) error["concerns"] = "Required field";
      if (isEmpty(allergies)) error["allergies"] = "Required field";
      if (isEmpty(medications)) error["medications"] = "Required field";

      if (isEmpty(signs)) error["signs"] = "Required field";
      if (isEmpty(speech)) error["speech"] = "Required field";
      if (isEmpty(skin)) error["skin"] = "Required field";
      if (isEmpty(color)) error["color"] = "Required field";
      if (isEmpty(breathing)) error["breathing"] = "Required field";
      if (isEmpty(pulse)) error["pulse"] = "Required field";
      if (isEmpty(pupils)) error["pupils"] = "Required field";

      if (medicalHistory && medicalHistory.length === 0)
        error["medicalHistory"] = "Required field";
      if (medicalCondition && medicalCondition.length === 0)
        error["medicalCondition"] = "Required field";

      if (isSelfReported === false || isSelfReported === "false") {
        if (isEmpty(firstname)) error["firstname"] = "Required field";
        if (isEmpty(middlename)) error["middlename"] = "Required field";
        if (isEmpty(lastname)) error["lastname"] = "Required field";
        if (isEmpty(address)) error["address"] = "Required field";
        if (isEmpty(contactNumber)) error["contactNumber"] = "Required field";
      } else {
        const assistanceRequest = await AssistanceRequest.findOne({
          _id: req.params.id,
        }).populate("userId");

        firstname = assistanceRequest.userId.firstname;
        middlename = assistanceRequest.userId.middlename;
        lastname = assistanceRequest.userId.lastname;
        address = `${assistanceRequest.userId.street}, ${assistanceRequest.userId.barangay}, ${assistanceRequest.userId.municipality}, ${assistanceRequest.userId.province}`;
        contactNumber = assistanceRequest.userId.contactNumber;
      }

      if (Object.keys(error).length === 0) {
        let medicalInformationData = {
          concerns,
          allergies,
          medications,
          medicalHistory,
          signs,
          speech,
          skin,
          color,
          breathing,
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
        };

        const preAssessment = await PreAssessment.create(newData);
        const assistanceRequest = await AssistanceRequest.findByIdAndUpdate(
          req.params.id,
          { $push: { preAssessmentId: preAssessment._id } },
          { new: true }
        );
        if (preAssessment && assistanceRequest) {
          req.io.emit("assistance-request");

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

        signs,

        speech,

        skin,

        color,

        breathing,
        pulse,

        pupils,

        medicalCondition,
      } = req.body;

      if (isEmpty(incidentLocation))
        error["incidentLocation"] = "Required field";
      if (isEmpty(incidentDescription))
        error["incidentDescription"] = "Required field";

      if (isEmpty(concerns)) error["concerns"] = "Required field";
      if (isEmpty(allergies)) error["allergies"] = "Required field";
      if (isEmpty(medications)) error["medications"] = "Required field";

      if (isEmpty(signs)) error["signs"] = "Required field";
      if (isEmpty(speech)) error["speech"] = "Required field";
      if (isEmpty(skin)) error["skin"] = "Required field";
      if (isEmpty(color)) error["color"] = "Required field";
      if (isEmpty(breathing)) error["breathing"] = "Required field";
      if (isEmpty(pulse)) error["pulse"] = "Required field";
      if (isEmpty(pupils)) error["pupils"] = "Required field";

      if (medicalHistory && medicalHistory.length === 0)
        error["medicalHistory"] = "Required field";
      if (medicalCondition && medicalCondition.length === 0)
        error["medicalCondition"] = "Required field";

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
          signs,
          speech,
          skin,
          color,
          breathing,
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
        };

        const preAssessment = await PreAssessment.findByIdAndUpdate(
          req.params.id,
          updateFields,
          { new: true }
        );

        if (preAssessment) {
          req.io.emit("assistance-request");

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
