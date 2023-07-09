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
      required: true,
    },
    proof: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    street: {
      type: String,
      required: true,
    },
    municipality: {
      type: String,
      required: true,
    },
    /*  situation: {
      question: {
        type: String,
        required: true,
      },
      answers: {
        answers: {
          type: String,
          required: true,
        },
      },
    }, */
    answers: [
      {
        type: String,
        required: true,
      },
    ],
    status: {
      type: String,
      default: "unverified",
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssistanceRequest", AssistanceRequestSchema);
