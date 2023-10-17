const mongoose = require("mongoose");
mongoose.pluralize(null);

const userSchema = mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    middlename: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      /* required: true, */
    },
    email: {
      type: String,
      /*  required: true, */
    },
    region: {
      type: String,
      /* required: true, */
      default: "",
    },
    province: {
      type: String,
      /* required: true, */
      default: "",
    },
    municipality: {
      type: String,
      /* required: true, */
      default: "",
    },
    barangay: {
      type: String,
      /* required: true, */
      default: "",
    },
    street: {
      type: String,
      /* required: true, */
      default: "",
    },
    gender: {
      type: String,
      /* required: true, */
      default: "",
    },
    birthdate: {
      type: Date,
      /* required: true, */
      default: null,
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
    },
    attempt: {
      type: Number,
      default: 0,
    },
    verificationCode: {
      type: Number,
    },
    codeExpiration: {
      type: Date,
      /*  default: Date.now, */
    },

    userType: {
      type: String,
      default: "resident",
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastOnlineDate: {
      type: Date,
      default: Date.now,
    },

    emailStatus: {
      type: String,
      default: "unverified",
    },
    isBanned: {
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
    status: {
      type: String,
      default: "unverified",
    },

    verificationPicture: {
      type: [String],
      default: [],
    },

    verificationRequestDate: {
      type: Date,
    },
    fcmToken: {
      type: [String],
      default: [],
    },

    /*   teamId: {
      type: mongoose.Types.ObjectId,
      ref: "Team",
    },

    isAssigned: {
      type: String,
      default: false,
    }, */

    lastDismissedRequestDate: {
      type: Date,
      default: Date.now,
    },
    dismissedRequestCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("remove", async function (next) {
  console.log(this._id);

  const HazardReport = mongoose.model("HazardReport");
  const AssistanceRequest = mongoose.model("AssistanceRequest");
  const Notification = mongoose.model("Notification");
  const SafetyTip = mongoose.model("SafetyTip");
  const Team = mongoose.model("Team");
  const WellnessSurvey = mongoose.model("WellnessSurvey");

  await HazardReport.deleteMany({ userId: this._id });
  await AssistanceRequest.deleteMany({ userId: this._id });
  await Notification.deleteMany({ userId: this._id });
  await SafetyTip.updateMany({}, { $pull: { saves: this._id } });
  await Team.updateMany({ head: this._id }, { $set: { head: null } });
  await Team.updateMany({}, { $pull: { members: this._id } });
  await WellnessSurvey.updateMany({}, { $pull: { affected: this._id } });
  await WellnessSurvey.updateMany({}, { $pull: { unaffected: this._id } });

  next();
});

module.exports = mongoose.model("User", userSchema);
