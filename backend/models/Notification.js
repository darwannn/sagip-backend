const mongoose = require("mongoose");

const Notification = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  notifications: [{
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    dateSent: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model("Notification", Notification);
