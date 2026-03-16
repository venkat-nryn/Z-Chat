const mongoose = require('mongoose');

const isSrvLookupError = (error) => {
  const message = `${error?.message || ''} ${error?.cause?.message || ''}`;

  return [
    'querySrv ENOTFOUND',
    'querySrv ECONNREFUSED',
    'ENODATA',
    'ETIMEOUT'
  ].some(fragment => message.includes(fragment));
};

const connectWithUri = async (uri, label) => {
  const connection = await mongoose.connect(uri, {
    family: 4,
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB Connected (${label}): ${connection.connection.host}`);
  return connection;
};

const connectDB = async () => {
  const srvUri = process.env.MONGODB_URI;
  const directUri = process.env.MONGODB_URI_DIRECT;

  if (!srvUri && !directUri) {
    console.error('Missing MongoDB URI. Set MONGODB_URI or MONGODB_URI_DIRECT in environment variables.');
    process.exit(1);
  }

  try {
    if (srvUri) {
      try {
        await connectWithUri(srvUri, 'srv');
      } catch (error) {
        if (!directUri || !isSrvLookupError(error)) {
          throw error;
        }

        console.warn('SRV lookup failed, retrying with direct MongoDB URI.');
        await connectWithUri(directUri, 'direct-fallback');
      }
    } else {
      await connectWithUri(directUri, 'direct');
    }

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    console.error('Tip: set MONGODB_URI_DIRECT in .env to bypass SRV DNS lookup issues.');
    process.exit(1);
  }
};

module.exports = connectDB;