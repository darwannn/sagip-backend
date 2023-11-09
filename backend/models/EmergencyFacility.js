const mongoose = require("mongoose");
mongoose.pluralize(null);

const EmergencyFacilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    status: {
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

module.exports = mongoose.model("EmergencyFacility", EmergencyFacilitySchema);
