const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  companyID: {
    type: String,
    required: true,
  },
  userID: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['request', 'accept', 'decline', 'mark_as_done'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Notification', notificationSchema); 