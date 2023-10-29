const mongoose = require("mongoose");
mongoose.pluralize(null);

const TeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    members: {
      type: [mongoose.Types.ObjectId],
      ref: "User",
      default: [],
    },
    response: {
      type: Number,
      default: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },

    archivedDate: {
      type: Date,
    },

    requestId: {
      type: mongoose.Types.ObjectId,
      ref: "AssistanceRequest",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", TeamSchema);
