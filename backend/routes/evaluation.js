const express = require('express');
const router = express.Router();
const Evaluation = require('../models/Evaluation');

// Create a new evaluation
router.post('/', async (req, res) => {
  const { employee, grade, notes, furtherAction, month } = req.body;

  try {
    const newEvaluation = new Evaluation({
      employee,
      grade,
      notes,
      furtherAction,
      month,
    });

    await newEvaluation.save();
    res.status(201).json(newEvaluation);
  } catch (err) {
    console.error('Failed to create evaluation:', err);
    res.status(500).json({ error: 'Failed to create evaluation' });
  }
});

// Fetch all evaluations
router.get('/all', async (req, res) => {
  try {
    const evaluations = await Evaluation.find();
    res.json(evaluations);
  } catch (err) {
    console.error('Failed to fetch evaluations:', err);
    res.status(500).json({ error: 'Failed to fetch evaluations' });
  }
});

// Fetch evaluations for a specific month
router.get('/:month', async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ month: req.params.month });
    res.json(evaluations);
  } catch (err) {
    console.error('Failed to fetch evaluations:', err);
    res.status(500).json({ error: 'Failed to fetch evaluations' });
  }
});

// Update an evaluation
router.put('/:employee', async (req, res) => {
  const { grade, notes, furtherAction } = req.body;

  try {
    const evaluation = await Evaluation.findOneAndUpdate(
      { employee: req.params.employee },
      { grade, notes, furtherAction },
      { new: true }
    );

    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    res.json(evaluation);
  } catch (err) {
    console.error('Failed to update evaluation:', err);
    res.status(500).json({ error: 'Failed to update evaluation' });
  }
});

// Delete an evaluation
router.delete('/:employee', async (req, res) => {
  try {
    const evaluation = await Evaluation.findOneAndDelete({ employee: req.params.employee });

    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    res.json({ message: 'Evaluation deleted' });
  } catch (err) {
    console.error('Failed to delete evaluation:', err);
    res.status(500).json({ error: 'Failed to delete evaluation' });
  }
});

module.exports = router;