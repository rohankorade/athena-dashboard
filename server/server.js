// server/server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importing the models
const Note = require('./models/Note');
const Exam = require('./models/Exam'); // Assuming Exam.js is now in models
const TestSeries = require('./models/TestSeries');
const Test = require('./models/Test');

// --- Express App Setup ---
const app = express();
const PORT = 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
const mongoURI = 'mongodb://localhost:27017/upscDashboard';
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));


// --- API Routes ---

// == Exams API (from before) ==
app.get('/api/exams', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exams = await Exam.find({ date: { $gte: today } }).sort({ date: 'asc' });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exams', error });
    }
});

// == Test Series API ==
// GET all test series
app.get('/api/test-series', async (req, res) => {
    try {
        const series = await TestSeries.find().sort({ name: 'asc' });
        res.json(series);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching test series', error });
    }
});

// POST a new test series
app.post('/api/test-series', async (req, res) => {
    try {
        const newSeries = new TestSeries({ name: req.body.name });
        await newSeries.save();
        res.status(201).json(newSeries);
    } catch (error) {
        res.status(400).json({ message: 'Error creating test series', error });
    }
});

// == Tests API ==
// GET all tests for a specific series
app.get('/api/tests/:seriesId', async (req, res) => {
    try {
        const tests = await Test.find({ series: req.params.seriesId }).sort({ testNumber: 'asc' });
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tests', error });
    }
});

// POST a new test score
app.post('/api/tests', async (req, res) => {
    try {
        const { series, testNumber, dateTaken, questionsCorrect, questionsIncorrect, marksScored, subject } = req.body;

        const correct = parseInt(questionsCorrect);
        const incorrect = parseInt(questionsIncorrect);
        const totalQuestions = 100; // Assuming 100 for now
        
        const attempted = correct + incorrect;
        const unattempted = totalQuestions - attempted;

        const newTest = new Test({
            series, testNumber, dateTaken, subject,
            totalQuestions, maxMarks: 200,
            attempted, unattempted,
            questionsCorrect, questionsIncorrect,
            marksScored
        });
        await newTest.save();
        res.status(201).json(newTest);
    } catch (error) {
        res.status(400).json({ message: 'Error saving test score', error });
    }
});


// GET a structured list of dates for the explorer
app.get('/api/editorials/dates', async (req, res) => {
    try {
        const dateTree = await Note.aggregate([
            // Stage 1: Filter documents to ensure the date field exists and is a valid date type.
            // This is the crucial step that prevents server crashes.
            { 
                $match: { 
                    "frontmatter.date": { 
                        $exists: true, 
                        $type: "date" 
                    } 
                } 
            },
            
            // Stage 2: Group by the full date to get unique days.
            { 
                $group: {
                    _id: {
                        year: { $year: "$frontmatter.date" },
                        month: { $month: "$frontmatter.date" },
                        day: { $dayOfMonth: "$frontmatter.date" }
                    }
                }
            },
            
            // Stage 3: Group the days by month.
            { 
                $group: {
                    _id: { year: "$_id.year", month: "$_id.month" },
                    days: { $push: "$_id.day" }
                }
            },
            
            // Stage 4: Group the months by year to create the final nested structure.
            { 
                $group: {
                    _id: "$_id.year",
                    months: { $push: { month: "$_id.month", days: "$days" } }
                }
            },

            // Stage 5: Sort the final results by year in descending order.
            { 
                $sort: { _id: -1 } 
            }
        ]);
        res.json(dateTree);
    } catch (error) {
        // If anything still goes wrong, send a detailed error message.
        console.error("Error fetching date tree:", error);
        res.status(500).json({ message: 'Error fetching date tree', error });
    }
});

// GET all editorials for a specific date
app.get('/api/editorials/by-date', async (req, res) => {
    try {
        const { year, month, day } = req.query;
        const startDate = new Date(year, month - 1, day);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1);

        const notes = await Note.find({
            "frontmatter.date": {
                $gte: startDate,
                $lt: endDate
            }
        });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notes by date', error });
    }
});

// PATCH to update the isRead status of a note
app.patch('/api/editorials/:id/status', async (req, res) => {
    try {
        const { isRead } = req.body;
        const updatedNote = await Note.findByIdAndUpdate(
            req.params.id,
            { isRead: isRead },
            { new: true } // Return the updated document
        );
        res.json(updatedNote);
    } catch (error) {
        res.status(400).json({ message: 'Error updating note status', error });
    }
});

// --- ADD THIS NEW DEBUG ROUTE ---
app.get('/api/editorials/debug-one', async (req, res) => {
    try {
        // Fetch just one document from the editorials collection
        const oneNote = await Note.findOne();
        if (!oneNote) {
            return res.status(404).json({ message: "No documents found in the editorials collection." });
        }
        console.log("--- DEBUG: ONE NOTE ---");
        console.log(oneNote);
        console.log("-----------------------");
        res.json(oneNote);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching debug note', error });
    }
});

// Add this new debug route to server.js
app.get('/api/editorials/debug-by-path', async (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath) {
            return res.status(400).json({ message: "Please provide a 'path' query parameter." });
        }
        
        // Find a note with a file path that CONTAINS the provided string
        const note = await Note.findOne({ filePath: { $regex: filePath, $options: 'i' } });

        if (!note) {
            return res.status(404).json({ message: "Note not found containing that file path." });
        }
        res.json(note);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching debug note', error });
    }
});

// GET all statistics for the editorials page
app.get('/api/editorials/stats', async (req, res) => {
    try {
        // 1. Days to CSP
        const cspExam = await Exam.findById('68a4bfe9adb3d434faf2c939');
        let daysToCSP = 'N/A';
        if (cspExam) {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const examDate = new Date(cspExam.date);
            const diffTime = examDate.getTime() - today.getTime();
            daysToCSP = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // 2. Editorial Counts
        const total = await Note.countDocuments({});
        const read = await Note.countDocuments({ isRead: true });
        const unread = total - read;

        // 3. Per Day Metric
        let perDay = 0;
        // Calculate the metric only if there are days remaining
        if (unread > 0 && daysToCSP > 0) {
            perDay = (unread / daysToCSP).toFixed(1);
        }

        // --- Final Response ---
        res.json({
            daysToCSP,
            total,
            read,
            unread,
            perDay
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error });
    }
});

app.get('/api/editorials/next-to-read', async (req, res) => {
    try {
        // 1. Filter for isRead: false
        // 2. Sort by date ascending (oldest first)
        // 3. Find just one
        const nextNote = await Note.findOne({ isRead: false }).sort({ "frontmatter.date": 1 });
        res.json(nextNote); // Will return the note object or null if none are found
    } catch (error) {
        res.status(500).json({ message: 'Error fetching next note to read', error });
    }
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});