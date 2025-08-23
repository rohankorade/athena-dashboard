// server/seedAuth.js
const mongoose = require('mongoose');
const Auth = require('./models/Auth');

// MongoDB connection URI and the secret key to be seeded
const MONGO_URI = 'mongodb://localhost:27017/upscDashboard';
const SECRET_KEY = "athena-dashboard-key-a6b7x9z"; 

async function seedAuthKey() {
    console.log('--- Seeding authentication key ---');
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected.');

        // Remove any existing keys to ensure we only have one
        await Auth.deleteMany({});
        console.log('Cleared existing auth keys.');

        // Create and save the new key
        const authKey = new Auth({ key: SECRET_KEY });
        await authKey.save();
        console.log('✅ Successfully seeded the new auth key.');

    } catch (error) {
        console.error('❌ An error occurred while seeding the auth key:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

seedAuthKey();