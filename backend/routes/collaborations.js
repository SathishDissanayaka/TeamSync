const express = require('express');
const router = express.Router();
const Collaboration = require('../models/Collaboration');

// Fetch all collaborations
router.get('/', async (req, res) => {
  try {
    const collaborations = await Collaboration.find();
    res.json(collaborations);
  } catch (err) {
    console.error('Failed to fetch collaborations:', err);
    res.status(500).json({ error: 'Failed to fetch collaborations' });
  }
});

module.exports = router;