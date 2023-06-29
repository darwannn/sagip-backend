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
      required: true,
    },
    province: {
      type: String,
      required: true,
    },
    municipality: {
      type: String,
      required: true,
    },
    barangay: {
      type: String,
      required: true,
    },
    street: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    birthdate: {
      type: Date,
      required: true,
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
    },

    userType: {
      type: String,
      required: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
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
      default: false,
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
