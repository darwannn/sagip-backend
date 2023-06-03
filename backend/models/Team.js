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

// Populate the 'head' and 'members' fields with the corresponding User objects
TeamSchema.pre("findOne", autoPopulate);
TeamSchema.pre("find", autoPopulate);

function autoPopulate(next) {
  this.populate("head");
  this.populate("members");
  next();
}

module.exports = mongoose.model("Team", TeamSchema);
