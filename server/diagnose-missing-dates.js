// server/diagnose-missing-dates.js

const mongoose = require('mongoose');
const Note = require('./models/Note');

const MONGO_URI = 'mongodb://localhost:27017/upscDashboard';

async function diagnoseMissingDates() {
    console.log('--- Searching for notes with missing dates ---');
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected.');

        // Find all documents where 'frontmatter.date' does NOT exist.
        const notesWithoutDates = await Note.find({
            "frontmatter.date": { $exists: false }
        });

        if (notesWithoutDates.length > 0) {
            console.log(`\nFound ${notesWithoutDates.length} document(s) missing the 'date' field:`);
            notesWithoutDates.forEach(note => {
                console.log(`  -> File: ${note.filePath} (ID: ${note._id})`);
            });
        } else {
            console.log('✅ All documents have a date field!');
        }
    } catch (error) {
        console.error('\n❌ An error occurred:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

diagnoseMissingDates();