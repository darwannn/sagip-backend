const mongoose = require("mongoose");
mongoose.pluralize(null);

const HazardReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    /*  title: {
      type: String,
      required: true,
    }, */

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
    status: {
      type: String,
      default: "unverified",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HazardReport", HazardReportSchema);
