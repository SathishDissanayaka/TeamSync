const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Create a new feedback
router.post('/', async (req, res) => {
  const { title, description, category, employee } = req.body;

  try {
    const newFeedback = new Feedback({
      title,
      description,
      category,
      employee
    });

    const savedFeedback = await newFeedback.save();

    // Prefer the name sent from the frontend, fallback to lookup, then fallback to TS number
    let employeeName = (req.body.user && req.body.user.trim()) || "";
    if (!employeeName && employee) {
      const employeeUser = await User.findOne({ companyID: employee });
      if (employeeUser && employeeUser.fullName) {
        employeeName = employeeUser.fullName;
      } else {
        employeeName = employee; // fallback to TS number if all else fails
      }
    }
    if (!employeeName) employeeName = "Unknown Employee";

    // Notify all admins (Admin, BusinessOwner, Manager)
    const adminRoles = ['Admin', 'BusinessOwner', 'Manager'];
    const admins = await User.find({ role: { $in: adminRoles } });
    const notificationPromises = admins.map(async (admin) => {
      const notification = new Notification({
        companyID: admin.companyID,
        userID: admin.companyID,
        type: 'feedback',
        title: 'New Feedback Submitted',
        message: `New feedback submitted by ${employeeName}: ${title}`,
        metadata: {
          feedbackId: savedFeedback._id,
          title,
          description,
          category,
          employee
        }
      });
      const savedNotification = await notification.save();
      // Emit to all admins in real time
      req.app.get('io').emit('notification', savedNotification);
      return savedNotification;
    });
    await Promise.all(notificationPromises);

    res.status(201).json(savedFeedback);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create feedback' });
  }
});

// Get all feedbacks
router.get('/', async (req, res) => {
  try {
    const feedbacks = await Feedback.find();
    res.status(200).json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
});

// Update a feedback
router.put('/:id', async (req, res) => {
  try {
    const updatedFeedback = await Feedback.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedFeedback);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update feedback' });
  }
});

// Delete a feedback
router.delete('/:id', async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Feedback deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

// Mark feedback as completed
router.put('/:id/complete', async (req, res) => {
  try {
    const updatedFeedback = await Feedback.findByIdAndUpdate(req.params.id, { status: 'completed' }, { new: true });
    res.status(200).json(updatedFeedback);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark feedback as completed' });
  }
});

module.exports = router;