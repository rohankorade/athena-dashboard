const mongoose = require('mongoose');
const stashVideoSchema = require('./server/models/StashVideo.js');

const MONGO_URI = 'mongodb://localhost:27017/upscDashboard';
const StashVideo = mongoose.model('StashVideo', stashVideoSchema);

async function seedStash() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected for seeding stash.');

        // Clear existing videos in the test collection
        await StashVideo.deleteMany({ collectionName: 'test_collection' });
        console.log('Cleared existing videos from test_collection.');

        const videos = [];
        for (let i = 1; i <= 30; i++) {
            videos.push({
                title: `Test Video ${i}`,
                fileName: `video${i}.mp4`,
                fileSize: '100MB',
                videoType: 'mp4',
                fileLink: `http://example.com/video${i}.mp4`,
                associatedAccount: 'test_account',
                collectionName: 'test_collection',
            });
        }

        await StashVideo.insertMany(videos);
        console.log('Seeded 30 test videos into test_collection. 🌱');

    } catch (error) {
        console.error('Error seeding the stash database:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

seedStash();
