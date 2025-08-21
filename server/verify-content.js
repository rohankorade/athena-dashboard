// server/verify-content.js

const mongoose = require('mongoose');
const Note = require('./models/Note');

const MONGO_URI = 'mongodb://localhost:27017/upscDashboard';
// You can adjust this number. We'll flag any content field shorter than this.
const MINIMUM_LENGTH = 100;

async function verifyContent() {
    console.log(`--- Verifying note content in database (checking for content shorter than ${MINIMUM_LENGTH} characters) ---`);
    let problemFiles = 0;

    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected.');

        // 1. Fetch all notes to check them in our script
        const allNotes = await Note.find({});
        const incompleteNotes = [];

        // 2. Loop through each note and check the length of its content
        for (const note of allNotes) {
            const issues = [];
            if (!note.rawContent || note.rawContent.length < MINIMUM_LENGTH) {
                issues.push('rawContent is too short');
            }
            if (!note.analysisContent || note.analysisContent.length < MINIMUM_LENGTH) {
                issues.push('analysisContent is too short');
            }
            // We can skip keywordsContent as it can be short

            if (issues.length > 0) {
                incompleteNotes.push({
                    filePath: note.filePath,
                    reason: issues.join(', ')
                });
            }
        }

        console.log('\n--- Verification Complete ---');
        if (incompleteNotes.length > 0) {
            console.log(`❌ Found ${incompleteNotes.length} note(s) with content sections that are too short:`);
            incompleteNotes.forEach(note => {
                console.log(`  -> File: ${note.filePath} (Reason: ${note.reason})`);
            });
            problemFiles = incompleteNotes.length;
        } else {
            console.log('✅ All notes have a sufficient amount of text in their content sections!');
        }

    } catch (error) {
        console.error('\nAn error occurred during verification:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

verifyContent();