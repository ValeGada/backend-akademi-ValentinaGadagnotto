const mongoose = require('mongoose');

// mongo connection
const connectDB = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URL);
      // console.log('MongoDB connected');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    }
  };

connectDB();