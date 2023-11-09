const mongoose = require("mongoose");
mongoose.pluralize(null);

const AuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    eventId: {
      required: true,
      refPath: "docModel",
    },
    docModel: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    categoty: {
      type: String,
      default: "",
    },
    action: {
      type: String,
      default: "",
    },
    // hazard report
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", AuditLogSchema);
