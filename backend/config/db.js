import mongoose from 'mongoose';

/**
 * Establishes connection to MongoDB Atlas using Mongoose.
 * Exits the process on failure since the app cannot function without a DB.
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.error(
        'MongoDB Connection Error: Missing `MONGO_URI`.\n' +
          'Create `backend/.env` (copy from `backend/.env.example`) and set `MONGO_URI`.'
      );
      process.exit(1);
    }

    // Helpful guard for the template values in `.env.example`
    if (mongoUri.includes('<username>') || mongoUri.includes('<password>')) {
      console.error(
        'MongoDB Connection Error: `MONGO_URI` still contains placeholders.\n' +
          'Update `backend/.env` with your real MongoDB Atlas connection string.'
      );
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
