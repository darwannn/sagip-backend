const mongoose = require("mongoose");
mongoose.pluralize(null);

const AssistanceRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTeam: {
      type: mongoose.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
    proof: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    street: {
      type: String,
      default: "",
    },
    municipality: {
      type: String,
      default: "",
    },
    cancelled: {
      reason: {
        type: String,
      },
      note: {
        type: String,
      },
      dateCancelled: {
        type: Date,
      },
    },

    answers: [
      {
        type: String,
        default: "",
      },
    ],
    status: {
      type: String,
      default: "unverified",
    },
    isSelfReported: {
      type: Boolean,
      default: false,
    },
    dateResolved: {
      type: Date,
    },
    dateDispatched: {
      type: Date,
    },
    dateArrived: {
      type: Date,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isBeingResponded: {
      type: Boolean,
    },
    archivedDate: {
      type: Date,
    },
    dispatcherName: {
      type: String,
    },
    respondersName: [
      {
        type: String,
      },
    ],
    preAssessment: {
      fullName: {
        type: String,
      },
      birthdate: {
        type: Date,
      },
      gender: {
        type: String,
      },
      address: {
        type: String,
      },
      contactNumber: {
        type: String,
      },

      hospitalName: {
        type: String,
      },

      medicalHistory: [
        {
          type: String,
        },
      ],
      medicalCondition: {
        type: String,
      },

      allergies: [
        {
          type: String,
          /* 
          default: [], */
        },
      ],
      medications: [
        {
          type: String,

          /*  default: [], */
        },
      ],

      signs: {
        loc: {
          type: String,
        },
        speech: {
          type: String,
        },
        skin: {
          type: String,
        },
        color: {
          type: String,
        },
        respiration: {
          type: String,
        },
        pulse: {
          type: String,
        },
        pupils: {
          type: String,
        },
      },

      vitalSigns: [
        {
          bloodPressure: {
            type: String,
          },
          pulseRate: {
            type: String,
          },
          respiratoryRate: {
            type: String,
          },
          temperature: {
            type: String,
          },
          oxygenSaturation: {
            type: String,
          },
          glucoseLevel: {
            type: String,
          },
          dateRecorded: {
            type: Date,
          },
        },
      ],
      injury: {
        type: String,
      },

      management: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssistanceRequest", AssistanceRequestSchema);
