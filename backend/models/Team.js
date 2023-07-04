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

/* TeamSchema.pre("remove", async function (next) {
  const User = mongoose.model("User");
  const user = await User.findById(this.head);

  if (user) {
    await Team.updateMany(
      { $or: [{ head: user._id }, { members: user._id }] },
      { $pull: { members: user._id }, $unset: { head: "" } }
    );
  }

  for (const memberId of this.members) {
    const memberUser = await User.findById(memberId);
    if (memberUser) {
      await Team.updateMany(
        { $or: [{ head: memberUser._id }, { members: memberUser._id }] },
        { $pull: { members: memberUser._id } }
      );
    }
  }

  next();
});
 */
module.exports = mongoose.model("Team", TeamSchema);
