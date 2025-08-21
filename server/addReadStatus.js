// server/addReadStatus.js

const mongoose = require('mongoose');
const Note = require('./models/Note');

const MONGO_URI = 'mongodb://localhost:27017/upscDashboard';

async function addReadStatusToExistingNotes() {
    console.log('--- Starting migration script ---');

    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected.');

        // This operation finds all documents where the 'isRead' field does not exist...
        const result = await Note.updateMany(
            { isRead: { $exists: false } },
            // ...and sets 'isRead' to false.
            { $set: { isRead: false } }
        );

        console.log(`\nMigration complete!`);
        console.log(`Documents matched: ${result.matchedCount}`);
        console.log(`Documents updated: ${result.modifiedCount}`);

    } catch (error) {
        console.error('\n❌ An error occurred during migration:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

addReadStatusToExistingNotes();