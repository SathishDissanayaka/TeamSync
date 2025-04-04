const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

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