const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Import auth route
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Admin route
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Requests route
const requestRoutes = require('./routes/requests');
app.use('/api/requests', requestRoutes);

// Feedback route
const feedbackRoutes = require('./routes/feedback');
app.use('/api/feedback', feedbackRoutes);

// Evaluation route
const evaluationRoutes = require('./routes/evaluation');
app.use('/api/evaluations', evaluationRoutes);

// Employee statistics route
const employeeStatRoutes = require('./routes/employeeStat');
app.use('/api/employeeStat', employeeStatRoutes);

// Collaborations route
const collaborationRoutes = require('./routes/collaborations');
app.use('/api/collaborations', collaborationRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Server running successfully!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});