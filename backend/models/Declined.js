const mongoose = require('mongoose');

const DeclinedSchema = new mongoose.Schema({
  request:    { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
  title:      { type: String },  
  description:{ type: String },   
  assignee:   { type: String },   
  assignedBy: { type: String },   
  
  declinedOn: { type: Date, default: Date.now },
  declinedReason:  { type: String, required: true },
  alternativeDate: { type: Date,   required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Declined', DeclinedSchema);
