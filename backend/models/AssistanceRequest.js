const mongoose = require("mongoose");
mongoose.pluralize(null);

const AssistanceRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTeam: {
      type: mongoose.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
    proof: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    street: {
      type: String,
      default: "",
    },
    municipality: {
      type: String,
      default: "",
    },
    cancelled: {
      reason: {
        type: String,
      },
      note: {
        type: String,
      },
      dateCancelled: {
        type: Date,
      },
    },

    answers: [
      {
        type: String,
        default: "",
      },
    ],
    status: {
      type: String,
      default: "unverified",
    },

    dateResolved: {
      type: Date,
    },
    dateDispatched: {
      type: Date,
    },
    dateArrived: {
      type: Date,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isBeingResponded: {
      type: Boolean,
    },
    archivedDate: {
      type: Date,
    },
    dispatcherName: {
      type: String,
    },
    respondersName: [
      {
        type: String,
      },
    ],

    preAssessmentId: {
      type: mongoose.Types.ObjectId,
      ref: "PreAssessment",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssistanceRequest", AssistanceRequestSchema);
