const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema({
  employee: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: '',
    required: true
  },
  furtherAction: {
    type: String,
    default: ''
  },
  month: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Evaluation', EvaluationSchema); 