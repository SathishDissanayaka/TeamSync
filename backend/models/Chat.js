const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    type: String,
    url: String
  }],
  readBy: [{
    type: String
  }]
}, { timestamps: true });

const ChatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['direct', 'group', 'task'],
    required: true
  },
  participants: [{
    type: String,
    required: true
  }],
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  },
  messages: [MessageSchema],
  lastMessage: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Chat', ChatSchema); 