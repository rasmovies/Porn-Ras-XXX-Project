const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const emailRoutes = require('./routes/emailRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection (optional)
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/adulttube')
//   .then(() => console.log('MongoDB connected'))
//   .catch((err) => console.log('MongoDB not available, running without database', err));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'AdultTube API Server' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/email', emailRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

