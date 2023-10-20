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
    /*  situation: {
      question: {
        type: String,
        required: true,
      },
      answers: {
        answers: {
          type: String,
          required: true,
        },
      },
    }, */
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
        /*  default: "", */
      },

      medicalHistory: [
        {
          type: String,
          default: "",
        },
      ],
      medicalCondition: {
        type: String,
        default: "",
      },

      allergies: [
        {
          type: String,
          /*   default: "", */
          default: [],
        },
      ],
      medications: [
        {
          type: String,
          /*  default: "", */
          default: [],
        },
      ],

      signs: {
        loc: {
          type: String,
          default: "",
        },
        speech: {
          type: String,
          default: "",
        },
        skin: {
          type: String,
          default: "",
        },
        color: {
          type: String,
          default: "",
        },
        respiration: {
          type: String,
          default: "",
        },
        pulse: {
          type: String,
          default: "",
        },
        pupils: {
          type: String,
          default: "",
        },
      },

      vitalSigns: [
        {
          bloodPressure: {
            type: String,

            /* default: "", */
          },
          pulseRate: {
            type: String,
            /* default: "", */
          },
          respiratoryRate: {
            type: String,
            /* default: "", */
          },
          temperature: {
            type: String,
            /*  default: "", */
          },
          oxygenSaturation: {
            type: String,
            /*   default: "", */
          },
          glucoseLevel: {
            type: String,
            /*      default: "", */
          },
          dateRecorded: {
            type: Date,
          },
        },
      ],
      injury: {
        type: String,
        default: "",
      },

      management: {
        type: String,
        default: "",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssistanceRequest", AssistanceRequestSchema);
