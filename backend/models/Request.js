const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  taskName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High'],
  },
  deadline: {
    type: Date,
    required: true,
  },
  assignee: {
    type: String,
    required: true,
  },
  assignedBy: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'ongoing', 'completed', 'declined'],
    default: 'pending',
  },
  acceptedOn: {
    type: Date,
    default: null,
  },
  declinedOn: {
    type: Date,
    default: null,
  },
  completedOn: {
    type: Date,
    default: null,
  }
}, { timestamps: true });

module.exports = mongoose.model('Request', RequestSchema);