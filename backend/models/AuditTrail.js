const mongoose = require("mongoose");
mongoose.pluralize(null);

const AuditTrailSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    actionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "docModel",
    },
    docModel: {
      type: String,
      required: true,
    },
    category: {
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditTrail", AuditTrailSchema);
