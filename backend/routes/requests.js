const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Collaboration = require('../models/Collaboration');
const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose');

//sahan changes
const Declined = require('../models/Declined');

// Helper function to get employee name
const getEmployeeName = async (employeeId) => {
  try {
    const employee = await User.findOne({ companyID: employeeId });
    return employee ? employee.fullName : employeeId;
  } catch (err) {
    console.error('Error fetching employee name:', err);
    return employeeId;
  }
};

//Sathish Requesting Sub-System
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

    // Get employee names
    const assigneeName = await getEmployeeName(assignee);
    const assignedByName = await getEmployeeName(assignedBy);

    // Create notification for the assignee
    const notification = new Notification({
      companyID: assignee,
      userID: assignee,
      type: 'request',
      title: 'New Task Request',
      message: `${assignedByName} has assigned you a new task: ${taskName}`,
      metadata: {
        requestId: newRequest._id,
        taskName,
        priority,
        deadline
      }
    });
    await notification.save();

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

//SAHAN - MANAGEMENT
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

    // Get employee names
    const assigneeName = await getEmployeeName(updatedRequest.assignee);

    // Create notification for the assigner
    const notification = new Notification({
      companyID: updatedRequest.assignedBy,
      userID: updatedRequest.assignedBy,
      type: 'accept',
      title: 'Task Accepted',
      message: `${assigneeName} has accepted the task: ${updatedRequest.taskName}`,
      metadata: {
        requestId: updatedRequest._id,
        taskName: updatedRequest.taskName
      }
    });
    await notification.save();

    res.json(updatedRequest);
  } catch (err) {
    console.error('Failed to accept request:', err);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// Decline a request (Sahan Changes)
router.put('/decline/:id', async (req, res) => {
  try {
    // 1) pull reason + date from the form body
    const { declinedReason, alternativeDate } = req.body;

    // 2) validate inputs
    if (!declinedReason || !alternativeDate) {
      return res.status(400).json({ error: 'Reason and alternative date are required.' });
    }
    const pickedDate = new Date(alternativeDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (pickedDate < today) {
      return res.status(400).json({ error: 'Alternative date cannot be in the past.' });
    }

    // 3) mark the original request declined
    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      { status: 'declined', declinedOn: new Date().toISOString() },
      { new: true }
    );
    if (!updatedRequest) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    // 4) create a new Declined document copying fields + your two new ones
    const declinedEntry = await Declined.create({
      request:         updatedRequest._id,
      title:           updatedRequest.taskName,
      description:     updatedRequest.description,
      assignee:        updatedRequest.assignee,     
      assignedBy:      updatedRequest.assignedBy,        
      declinedOn:      updatedRequest.declinedOn,    
      declinedReason,                               
      alternativeDate: pickedDate 
    });

    // Get employee names
    const assigneeName = await getEmployeeName(updatedRequest.assignee);

    // Create notification for the assigner
    const notification = new Notification({
      companyID: updatedRequest.assignedBy,
      userID: updatedRequest.assignedBy,
      type: 'decline',
      title: 'Task Declined',
      message: `${assigneeName} has declined the task: ${updatedRequest.taskName}. Reason: ${declinedReason}`,
      metadata: {
        requestId: updatedRequest._id,
        taskName: updatedRequest.taskName,
        reason: declinedReason,
        alternativeDate: pickedDate
      }
    });
    await notification.save();

    // 5) respond with both if you like, or just the updatedRequest
    return res.status(201).json({ updatedRequest, declinedEntry });

  } catch (err) {
    console.error('Failed to decline request:', err);
    return res.status(500).json({ error: 'Failed to decline request.' });
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

    // Get employee names
    const assigneeName = await getEmployeeName(updatedRequest.assignee);

    // Create notification for the assigner
    const notification = new Notification({
      companyID: updatedRequest.assignedBy,
      userID: updatedRequest.assignedBy,
      type: 'mark_as_done',
      title: 'Task Completed',
      message: `${assigneeName} has completed the task: ${updatedRequest.taskName}`,
      metadata: {
        requestId: updatedRequest._id,
        taskName: updatedRequest.taskName
      }
    });
    await notification.save();

    res.json(updatedRequest);
  } catch (err) {
    console.error('Failed to complete request:', err);
    res.status(500).json({ error: 'Failed to complete request' });
  }
});

// Restore original delete endpoint for pending requests
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

//for collaborations ==SAHAN
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

//Incoming list SAHAN
// Fetch requests assigned to a specific user by companyID
router.get('/assigned/:companyID', async (req, res) => {
  try {
    const requests = await Request.find({ assignee: req.params.companyID, status: 'pending' });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//to-do list SAHAN
// Fetch ongoing requests for a specific user by companyID
router.get('/ongoing/:companyID', async (req, res) => {
  try {
    const requests = await Request.find({ assignee: req.params.companyID, status: 'ongoing' });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//under-developing section
// == Get the endpoint from here for declined tasks windows ====
// Fetch declined requests for a specific user by companyID

router.get('/declined/:companyID', async (req, res) => {
  try {
    const requests = await Request.find({ assignee: req.params.companyID, status: 'declined' });
    res.json(requests);
  } catch (err) {
    res.status500().json({ error: err.message });
  }
});

// Fetch all declined requests (not user‑specific) for ManagerView (Sahan)
router.get('/declined', async (req, res) => {
  try {
    const entries = await Declined.find({});
    return res.json(entries);
  } catch (err) {
    console.error('Failed to fetch all declined entries:', err);
    return res.status(500).json({ error: 'Failed to fetch all declined entries' });
  }
});

// Update task progress
router.put('/progress/:id', async (req, res) => {
  try {
    const { progress, comment } = req.body;
    const companyID = req.body.companyID; // Get from request body

    if (progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progress must be between 0 and 100' });
    }

    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      {
        $set: { progress },
        $push: {
          progressUpdates: {
            percentage: progress,
            comment,
            updatedBy: companyID,
            updatedAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Create notification for progress update
    const notification = new Notification({
      companyID: updatedRequest.assignedBy,
      userID: companyID,
      type: 'progress_update',
      title: 'Task Progress Updated',
      message: `Task "${updatedRequest.taskName}" progress updated to ${progress}%`,
      metadata: {
        requestId: updatedRequest._id,
        taskName: updatedRequest.taskName,
        progress,
        comment
      }
    });
    await notification.save();

    res.json(updatedRequest);
  } catch (err) {
    console.error('Failed to update progress:', err);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Add endpoint to delete from Declined collection by declined entry _id
router.delete('/declined/:id', async (req, res) => {
  try {
    await Declined.findByIdAndDelete(req.params.id);
    res.json({ message: 'Declined entry deleted' });
  } catch (err) {
    console.error('Failed to delete declined entry:', err);
    res.status(500).json({ error: 'Failed to delete declined entry' });
  }
});

module.exports = router;