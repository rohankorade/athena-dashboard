// server/seedTests.js

const mongoose = require('mongoose');
const TestSeries = require('./models/TestSeries');
const Test = require('./models/Test');

// --- Configuration ---
const mongoURI = 'mongodb://localhost:27017/upscDashboard';
// IMPORTANT: Change this name to match the exact name of the series in your database.
const TARGET_SERIES_NAME = "MPSC Rajyaseva - Chanakya Mandal"; 

// --- Your Test Data ---
const testsData = [
    { testNumber: "01", subject: "Polity - 1", dateTaken: "2025-06-08", attempted: 80, questionsCorrect: 52, questionsIncorrect: 28, unattempted: 20, marksScored: 90 },
    { testNumber: "02", subject: "Polity - 2", dateTaken: "2025-06-15", attempted: 84, questionsCorrect: 63, questionsIncorrect: 21, unattempted: 16, marksScored: 116 },
    { testNumber: "03", subject: "Science - 1", dateTaken: "2025-06-22", attempted: 0, questionsCorrect: 0, questionsIncorrect: 0, unattempted: 0, marksScored: 0 },
    { testNumber: "04", subject: "Science - 2", dateTaken: "2025-06-29", attempted: 62, questionsCorrect: 30, questionsIncorrect: 32, unattempted: 38, marksScored: 44 },
    { testNumber: "05", subject: "Economy - 1", dateTaken: "2025-07-06", attempted: 81, questionsCorrect: 56, questionsIncorrect: 25, unattempted: 19, marksScored: 99.5 },
    { testNumber: "06", subject: "Economy - 2", dateTaken: "2025-07-13", attempted: 85, questionsCorrect: 58, questionsIncorrect: 27, unattempted: 15, marksScored: 102.5 },
    { testNumber: "07", subject: "History - 1", dateTaken: "2025-07-20", attempted: 54, questionsCorrect: 24, questionsIncorrect: 30, unattempted: 46, marksScored: 33 },
    { testNumber: "08", subject: "History - 2", dateTaken: "2025-07-27", attempted: 0, questionsCorrect: 0, questionsIncorrect: 0, unattempted: 0, marksScored: 0 },
    { testNumber: "09", subject: "Geography - 1", dateTaken: "2025-08-03", attempted: 69, questionsCorrect: 45, questionsIncorrect: 24, unattempted: 31, marksScored: 78 },
    { testNumber: "10", subject: "Geography - 2", dateTaken: "2025-08-10", attempted: 69, questionsCorrect: 55, questionsIncorrect: 14, unattempted: 31, marksScored: 100.5 }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected for seeding.');

        // 1. Find the target Test Series by name
        const targetSeries = await TestSeries.findOne({ name: TARGET_SERIES_NAME });
        if (!targetSeries) {
            throw new Error(`Test Series "${TARGET_SERIES_NAME}" not found. Please add it first or check for typos.`);
        }
        console.log(`Found Test Series: ${targetSeries.name}`);

        // 2. Clear only the tests linked to this series
        await Test.deleteMany({ series: targetSeries._id });
        console.log(`Cleared existing tests for "${targetSeries.name}".`);

        // 3. Add the series ID to each test document
        const testsWithSeriesId = testsData.map(test => ({
            ...test,
            series: targetSeries._id,
            totalQuestions: 100, // Assuming these are constant
            maxMarks: 200
        }));

        // 4. Insert the new test data
        await Test.insertMany(testsWithSeriesId);
        console.log(`Successfully seeded ${testsWithSeriesId.length} tests for "${targetSeries.name}"! 🌱`);

    } catch (error) {
        console.error('Error seeding the database:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
};

seedDatabase();