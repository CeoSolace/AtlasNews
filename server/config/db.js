const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the URI defined in the environment.  This helper
 * centralizes connection logic so that other modules can simply import and
 * rely on an active Mongoose connection.  If the connection fails the
 * process will exit with an error code, preventing the app from running in
 * an invalid state.  The connection uses updated settings to avoid
 * deprecated functionality.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;