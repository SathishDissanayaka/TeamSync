const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const User = require('../models/User');

// Fetch employees with request statistics
router.get('/users', async (req, res) => {
  try {
    const employees = await User.aggregate([
      {
        $match: {
          role: { $nin: ['Admin', 'BusinessOwner'] }
        }
      },
      {
        $lookup: {
          from: 'requests',
          localField: 'companyID',
          foreignField: 'assignee',
          as: 'requests',
        },
      },
      {
        $project: {
          fullName: 1,
          companyID: 1,
          role: 1,
          requests: 1,
        },
      },
    ]);

    res.json(employees);
  } catch (err) {
    console.error('Failed to fetch employees:', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

module.exports = router;