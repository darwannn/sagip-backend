const mongoose = require("mongoose");
mongoose.pluralize(null);

const AlertSchema = new mongoose.Schema(
  {
    alertTitle: {
      type: String,
      required: true,
    },
    alertMessage: {
      type: String,
      required: true,
    },
    category: {
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

module.exports = mongoose.model("Alert", AlertSchema);
