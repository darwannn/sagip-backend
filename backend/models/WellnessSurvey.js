const mongoose = require("mongoose");
mongoose.pluralize(null);

const WellnessSurveySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    unaffected: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    affected: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    /* isActive: {
      type: Boolean,
      default: false,
    }, */
    status: {
      type: String,
      required: true,
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

module.exports = mongoose.model("WellnessSurvey", WellnessSurveySchema);
