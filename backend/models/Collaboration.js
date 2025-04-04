const mongoose = require('mongoose');

const CollaborationSchema = new mongoose.Schema({
  taskName: {
    type: String,
    required: true,
  },
  assignedBy: {
    type: String,
    required: true,
  },
  assignee: {
    type: String,
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Collaboration', CollaborationSchema);