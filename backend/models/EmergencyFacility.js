const mongoose = require("mongoose");

const EmergencyFacilitySchema = new mongoose.Schema({
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
 
  image: {
    type: String,
    required: true,
  },
  isFull: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

module.exports = mongoose.model("EmergencyFacility", EmergencyFacilitySchema);
