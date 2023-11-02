const mongoose = require("mongoose");
mongoose.pluralize(null);

const PreAssessmentSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Types.ObjectId,
      ref: "AssistanceRequest",
      default: null,
    },

    firstname: {
      type: String,
    },
    middlename: {
      type: String,
    },

    lastname: {
      type: String,
    },

    contactNumber: {
      type: String,
    },
    address: {
      type: String,
    },

    incidentLocation: {
      type: String,
    },

    incidentDescription: {
      type: String,
    },

    medicalInformation: {
      concerns: {
        type: String,
      },
      allergies: {
        type: String,
      },
      medications: {
        type: String,
      },
      medicalHistory: [
        {
          type: String,
        },
      ],

      consciousness: {
        type: String,
      },

      speech: {
        type: String,
      },

      skin: {
        type: String,
      },

      color: {
        type: String,
      },

      respiration: {
        type: String,
      },

      pulse: {
        type: String,
      },

      pupils: {
        type: String,
      },

      medicalCondition: [
        {
          type: String,
        },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PreAssessment", PreAssessmentSchema);
