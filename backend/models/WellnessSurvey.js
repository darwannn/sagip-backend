const mongoose = require("mongoose");
mongoose.pluralize(null);

const WellnessSurveySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    unaffected: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    affected: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    isActive: {
      type: Boolean,
      default: false,
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

/* WellnessSurveySchema.pre("remove", async function (next) {
  const User = mongoose.model("User");
  const users = await User.find({
    _id: { $in: [...this.unaffected, ...this.affected] },
  });

  for (const user of users) {
    await WellnessSurvey.updateMany(
      {
        $or: [{ unaffected: user._id }, { affected: user._id }],
      },
      {
        $pull: {
          unaffected: user._id,
          affected: user._id,
        },
      }
    );
  }

  next();
}); */

module.exports = mongoose.model("WellnessSurvey", WellnessSurveySchema);
