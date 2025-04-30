const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});

// Make io accessible to routes
app.set('io', io);

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

// Notifications route
const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);

// Add chat route
const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Server running successfully!');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  //console.log('User connected:', socket.id);   //Uncomment for Socket.io debugging ++Sahan
  
  socket.on('disconnect', () => {
    // console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});