const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['system issue', 'system misuse', 'general', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['processing', 'completed'],
    default: 'processing'
  },
  employee: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;