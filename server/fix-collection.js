// server/fix-tushy-collection.js
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/upscDashboard';
const DB_NAME = 'stash-alpha';
const COLLECTION_NAME = 'Tushy';
const OLD_VALUE = 'Deeper';
const NEW_VALUE = 'Tushy';

async function fixCollectionName() {
    console.log(`--- Starting script to update '${COLLECTION_NAME}' collection ---`);
    
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected.');

        // Get a handle on the stash-alpha database
        const stashDb = mongoose.connection.useDb(DB_NAME);

        console.log(`Targeting collection: ${COLLECTION_NAME}`);
        console.log(`Finding documents where 'collection' is '${OLD_VALUE}'...`);

        // Perform the update operation
        const result = await stashDb.db.collection(COLLECTION_NAME).updateMany(
            { "collection": OLD_VALUE },
            { $set: { "collection": NEW_VALUE } }
        );

        console.log('\n✅ Update complete!');
        console.log(`   Documents matched: ${result.matchedCount}`);
        console.log(`   Documents updated: ${result.modifiedCount}`);

    } catch (error) {
        console.error('\n❌ An error occurred during the update:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

fixCollectionName();