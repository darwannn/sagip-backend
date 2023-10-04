const mongoose = require("mongoose");
mongoose.pluralize(null);

const HazardReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
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
      default: "",
    },
    municipality: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "unverified",
    },
    dateResolved: {
      type: Date,
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

module.exports = mongoose.model("HazardReport", HazardReportSchema);
