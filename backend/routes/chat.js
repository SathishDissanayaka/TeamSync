const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');

// Find chat by taskId
router.get('/task/:taskId', async (req, res) => {
  try {
    const chat = await Chat.findOne({ taskId: req.params.taskId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// Clear all messages in a chat
router.put('/:chatId/clear', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    chat.messages = [];
    await chat.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear chat' });
  }
});

// Get all chats for a user
router.get('/:companyID', async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.params.companyID
    }).sort({ lastMessage: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Create a new chat
router.post('/', async (req, res) => {
  try {
    const { name, type, participants, taskId } = req.body;
    const newChat = new Chat({
      name,
      type,
      participants,
      taskId
    });
    const savedChat = await newChat.save();
    res.status(201).json(savedChat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Send a message
router.post('/:chatId/messages', async (req, res) => {
  try {
    const { sender, content, attachments } = req.body;
    const chat = await Chat.findById(req.params.chatId);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const message = {
      sender,
      content,
      attachments,
      readBy: [sender]
    };

    chat.messages.push(message);
    chat.lastMessage = new Date();
    await chat.save();

    // Get the last message with Mongoose-generated timestamps
    const savedMessage = chat.messages[chat.messages.length - 1];

    // Notify other participants
    const otherParticipants = chat.participants.filter(p => p !== sender);
    const notificationPromises = otherParticipants.map(async (participant) => {
      const notification = new Notification({
        companyID: participant,
        userID: sender,
        type: 'chat',
        title: 'New Message',
        message: `New message in ${chat.name}: ${content.substring(0, 50)}...`,
        metadata: {
          chatId: chat._id,
          messageId: savedMessage._id
        }
      });
      await notification.save();
    });

    await Promise.all(notificationPromises);

    res.status(201).json(savedMessage);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.put('/:chatId/read', async (req, res) => {
  try {
    const { companyID } = req.body;
    const chat = await Chat.findById(req.params.chatId);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    chat.messages.forEach(message => {
      if (!message.readBy.includes(companyID)) {
        message.readBy.push(companyID);
      }
    });

    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get chat by chatId
router.get('/id/:chatId', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

module.exports = router; 
