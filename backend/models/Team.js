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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", TeamSchema);
