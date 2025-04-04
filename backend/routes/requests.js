const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Collaboration = require('../models/Collaboration');

// Create a new request
router.post('/', async (req, res) => {
  const { taskName, description, priority, deadline, assignee, assignedBy } = req.body;

  try {
    // Validate required fields
    if (!taskName || !description || !priority || !deadline || !assignee || !assignedBy) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Create new request
    const newRequest = new Request({
      taskName,
      description,
      priority,
      deadline,
      assignee,
      assignedBy,
      status: 'pending' // Ensure the status is set to 'pending' by default
    });

    // Save request to database
    await newRequest.save();

    res.status(201).json(newRequest);
  } catch (err) {
    console.error('Failed to create request:', err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// Edit an existing request
router.put('/:id', async (req, res) => {
  try {
    const updatedRequest = await Request.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedRequest);
  } catch (err) {
    console.error('Failed to update request:', err);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// Accept a request
router.put('/accept/:id', async (req, res) => {
  try {
    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      { status: 'ongoing', acceptedOn: new Date().toISOString() },
      { new: true }
    );

    // Create a new collaboration entry
    const newCollaboration = new Collaboration({
      taskName: updatedRequest.taskName,
      assignedBy: updatedRequest.assignedBy,
      assignee: updatedRequest.assignee,
      deadline: updatedRequest.deadline,
      createdAt: updatedRequest.createdAt 
    });
    await newCollaboration.save();

    res.json(updatedRequest);
  } catch (err) {
    console.error('Failed to accept request:', err);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// Decline a request
router.put('/decline/:id', async (req, res) => {
  try {
    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      { status: 'declined', declinedOn: new Date().toISOString() },
      { new: true }
    );
    res.json(updatedRequest);
  } catch (err) {
    console.error('Failed to decline request:', err);
    res.status(500).json({ error: 'Failed to decline request' });
  }
});

// Mark a request as completed
router.put('/complete/:id', async (req, res) => {
  try {
    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', completedOn: new Date().toISOString() },
      { new: true }
    );

    // Delete the collaboration entry
    await Collaboration.findOneAndDelete({ taskName: updatedRequest.taskName, assignee: updatedRequest.assignee });

    res.json(updatedRequest);
  } catch (err) {
    console.error('Failed to complete request:', err);
    res.status(500).json({ error: 'Failed to complete request' });
  }
});

// Delete a request
router.delete('/:id', async (req, res) => {
  try {
    await Request.findByIdAndDelete(req.params.id);
    res.json({ message: 'Request deleted' });
  } catch (err) {
    console.error('Failed to delete request:', err);
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

// Fetch pending requests made by a specific user
router.get('/pending/:companyID', async (req, res) => {
  try {
    const pendingRequests = await Request.find({ status: 'pending', assignedBy: req.params.companyID });
    res.json(pendingRequests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch completed requests made by a specific user
router.get('/completed/:companyID', async (req, res) => {
  try {
    const completedRequests = await Request.find({ status: 'completed', assignedBy: req.params.companyID });
    res.json(completedRequests);
  } catch (err) {
    console.error('Failed to fetch completed requests:', err);
    res.status(500).json({ error: 'Failed to fetch completed requests' });
  }
});

// Fetch all ongoing requests
router.get('/ongoing', async (req, res) => {
  try {
    const ongoingRequests = await Request.find({ status: 'ongoing' });
    res.json(ongoingRequests);
  } catch (err) {
    console.error('Failed to fetch ongoing requests:', err);
    res.status(500).json({ error: 'Failed to fetch ongoing requests' });
  }
});

// Fetch requests assigned to a specific user by companyID
router.get('/assigned/:companyID', async (req, res) => {
  try {
    const requests = await Request.find({ assignee: req.params.companyID, status: 'pending' });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch ongoing requests for a specific user by companyID
router.get('/ongoing/:companyID', async (req, res) => {
  try {
    const requests = await Request.find({ assignee: req.params.companyID, status: 'ongoing' });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch declined requests for a specific user by companyID
router.get('/declined/:companyID', async (req, res) => {
  try {
    const requests = await Request.find({ assignee: req.params.companyID, status: 'declined' });
    res.json(requests);
  } catch (err) {
    res.status500().json({ error: err.message });
  }
});

module.exports = router;