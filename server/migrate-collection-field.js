// server/migrate-collection-field.js
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/upscDashboard';

async function migrateField() {
    console.log('--- Starting migration script to rename "collection" field ---');
    let client;
    try {
        // Connect to the main database
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected.');

        // Get a handle on the stash-alpha database
        const stashDb = mongoose.connection.useDb('stash-alpha');

        // Get all collection names
        const collections = await stashDb.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        console.log(`Found ${collectionNames.length} collections to process.`);

        for (const name of collectionNames) {
            console.log(`  -> Processing collection: ${name}`);
            const result = await stashDb.db.collection(name).updateMany(
                { "collection": { $exists: true } }, // Find documents that have the old field
                { $rename: { "collection": "collectionName" } } // Rename it
            );
            console.log(`     - Matched: ${result.matchedCount}, Updated: ${result.modifiedCount}`);
        }

        console.log('\n✅ Migration complete! The "collection" field has been renamed to "collectionName".');

    } catch (error) {
        console.error('\n❌ An error occurred during migration:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

migrateField();