const mongoose = require("mongoose");
mongoose.pluralize(null);

const AuditTrailSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "docModel",
    },
    docModel: {
      type: String,
      required: true,
    },
    categoty: {
      type: String,
      default: "",
    },
    action: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    // hazard report
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditTrail", AuditTrailSchema);
