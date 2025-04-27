const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Get all notifications for a company
router.get('/:companyID', async (req, res) => {
  try {
    const notifications = await Notification.find({ companyID: req.params.companyID })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark a notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark all notifications as read for a company
router.put('/:companyID/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { companyID: req.params.companyID, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a notification
router.delete('/:notificationId', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.notificationId);
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new notification
router.post('/', async (req, res) => {
  try {
    let notificationData = req.body;
    // If message contains a TS number, replace it with the user's name
    if (notificationData.userID) {
      const User = require('../models/User');
      const user = await User.findOne({ companyID: notificationData.userID });
      if (user) {
        // Replace all occurrences of the TS number in the message with the user's full name
        if (notificationData.message && notificationData.message.includes(notificationData.userID)) {
          notificationData.message = notificationData.message.replaceAll(notificationData.userID, user.fullName);
        }
      }
    }
    const notification = new Notification(notificationData);
    const savedNotification = await notification.save();
    // Emit the notification through WebSocket
    req.app.get('io').emit('notification', savedNotification);
    res.status(201).json(savedNotification);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router; 