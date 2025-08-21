// server/server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");

// Importing the models
const Note = require('./models/Note');
const Exam = require('./models/Exam'); // Assuming Exam.js is now in models
const TestSeries = require('./models/TestSeries');
const Test = require('./models/Test');
const ExamSession = require('./models/ExamSession');
const ExamAttempt = require('./models/ExamAttempt');

const activeExamTimers = {};

// --- Express App Setup ---
const app = express();

// Create an HTTP server and attach Socket.IO to it
// This allows us to use Socket.IO for real-time features in the future
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Your React app's address
    methods: ["GET", "POST"]
  }
});

// PORT Configuration
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

// GET endpoint for advanced, unified search
app.get('/api/editorials/search', async (req, res) => {
    try {
        const { terms = '', mode = 'OR' } = req.query;
        if (!terms.trim()) {
            return res.json([]);
        }

        const searchTerms = terms.split(',');
        const query = {};
        
        // Define the fields to search within
        const fieldsToSearch = [
            'title',
            'frontmatter.subject',
            'frontmatter.paper',
            'frontmatter.theme',
            'frontmatter.tags'
        ];

        if (mode === 'AND') {
            // AND logic: The document must match criteria for ALL search terms
            query.$and = searchTerms.map(term => {
                const termRegex = new RegExp(term.trim(), 'i'); // Case-insensitive regex for the term
                // For each term, it can exist in ANY of the fields
                return { $or: fieldsToSearch.map(field => ({ [field]: termRegex })) };
            });
        } else {
            // OR logic: The document can match criteria for ANY search term
            const termRegexes = searchTerms.map(term => new RegExp(term.trim(), 'i'));
            // Find documents where ANY field contains ANY of the regexes
            query.$or = fieldsToSearch.map(field => ({ [field]: { $in: termRegexes } }));
        }

        const results = await Note.find(query);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error during search', error });
    }
});

// GET a single note by its ID
app.get('/api/editorials/:id', async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }
        res.json(note);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching note', error });
    }
});


// LOCAL MOCK APIs

// GET all available question paper collections from the 'localMocks' db
app.get('/api/mocks/collections', async (req, res) => {
    try {
        const mockDb = mongoose.connection.useDb('localMocks');
        const collections = await mockDb.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        res.json(collectionNames);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching collections', error });
    }
});

// POST to create a new exam session (lobby)
app.post('/api/mocks/create-session', async (req, res) => {
    try {
        const { collectionName } = req.body;
        if (!collectionName) {
            return res.status(400).json({ message: 'Collection name is required.' });
        }
        // Generate a simple, random 6-character code
        const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const newSession = new ExamSession({
            sessionCode,
            examCollectionName: collectionName,
        });
        await newSession.save();
        res.status(201).json(newSession);
    } catch (error) {
        res.status(500).json({ message: 'Error creating session', error });
    }
});

// GET a session by its short code
app.get('/api/mocks/session-by-code/:code', async (req, res) => {
    try {
        const session = await ExamSession.findOne({ sessionCode: req.params.code });
        if (!session) {
            return res.status(404).json({ message: "Session not found." });
        }
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching session', error });
    }
});

// GET all questions for a given exam collection
app.get('/api/exam-questions/:collectionName', async (req, res) => {
    try {
        const { collectionName } = req.params;
        const mockDb = mongoose.connection.useDb('localMocks');
        // Mongoose doesn't have a direct way to select a collection by a variable name,
        // so we access the native driver's `db` object.
        const questions = await mockDb.db.collection(collectionName).find({}).toArray();
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exam questions', error });
    }
});

// GET a specific exam attempt by its ID
app.get('/api/exam-attempt/:attemptId', async (req, res) => {
    try {
        const { attemptId } = req.params;
        const attempt = await ExamAttempt.findById(attemptId);
        if (!attempt) {
            return res.status(404).json({ message: "Exam attempt not found." });
        }
        res.json(attempt);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exam attempt', error });
    }
});


// --- REAL-TIME LOGIC with Socket.io ---
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  const broadcastLobbyUpdate = async (sessionId) => {
    const updatedSession = await ExamSession.findById(sessionId);
    io.to(sessionId).emit('lobby_update', updatedSession);
  };

  socket.on('join_lobby', (sessionId) => {
    socket.join(sessionId);
    console.log(`User ${socket.id} joined lobby: ${sessionId}`);
    broadcastLobbyUpdate(sessionId); // Send initial update to the new user
  });
  
  socket.on('participant_join', async ({ sessionId, username }) => {
    // Store the username on the socket object for future identification
    socket.username = username;

    await ExamSession.findByIdAndUpdate(sessionId, {
        $push: { participants: { username, isReady: false } }
    });
    broadcastLobbyUpdate(sessionId);
  });
  
  socket.on('participant_ready', async ({ sessionId, username, isReady }) => {
    await ExamSession.updateOne(
        { _id: sessionId, "participants.username": username },
        { $set: { "participants.$.isReady": isReady } }
    );
    broadcastLobbyUpdate(sessionId);
  });

  socket.on('start_exam', async (sessionId) => {
    try {
        const session = await ExamSession.findById(sessionId);
        if (!session) { return; }

        // Prevent starting a timer if one is already running for this session
        if (activeExamTimers[sessionId]) {
            console.log(`Timer already active for session: ${sessionId}`);
            return;
        }

        const mockDb = mongoose.connection.useDb('localMocks');
        const questions = await mockDb.db.collection(session.examCollectionName).find({}).toArray();
        const initialAnswers = questions.map(q => ({
            question_number: q.question_number,
            status: 'unseen'
        }));

        const startTime = new Date();
        const timeLimit = 7200; // Default time limit from schema

        const createdAttempts = await Promise.all(
            session.participants.map(participant => {
                const newAttempt = new ExamAttempt({
                    examSession: session._id,
                    username: participant.username,
                    examCollectionName: session.examCollectionName,
                    startTime: startTime,
                    timeLimit: timeLimit,
                    answers: initialAnswers,
                });
                return newAttempt.save();
            })
        );

        const attemptMap = Object.fromEntries(createdAttempts.map(a => [a.username, a._id]));

        const socketsInRoom = await io.in(sessionId).fetchSockets();
        for (const sock of socketsInRoom) {
            const userAttemptId = attemptMap[sock.username];
            if (userAttemptId) {
                sock.emit('exam_started', { attemptId: userAttemptId });
            }
        }

        // --- NEW SERVER-SIDE TIMER LOGIC ---
        const timerId = setInterval(() => {
            const now = new Date();
            const elapsedSeconds = Math.floor((now - startTime) / 1000);
            const remainingTime = Math.max(0, timeLimit - elapsedSeconds);

            io.to(sessionId).emit('timer_tick', { remainingTime });

            if (remainingTime <= 0) {
                console.log(`Timer finished for session: ${sessionId}`);
                clearInterval(timerId);
                delete activeExamTimers[sessionId];
                // Optionally, you could force-submit all exams here
            }
        }, 1000);

        activeExamTimers[sessionId] = timerId;
        console.log(`Timer started for session: ${sessionId}`);

    } catch (error) {
        console.error("Error starting exam:", error);
    }
  });

  socket.on('update_answer', async ({ attemptId, question_number, selected_option_index, status }) => {
    try {
        await ExamAttempt.updateOne(
            { _id: attemptId, "answers.question_number": question_number },
            { $set: {
                "answers.$.selected_option_index": selected_option_index,
                "answers.$.status": status
            }}
        );
        // For now, we just save. We could optionally emit a confirmation back.
    } catch (error) {
        console.error("Error updating answer:", error);
    }
  });

  socket.on('submit_exam', async ({ attemptId }) => {
    try {
      const attempt = await ExamAttempt.findById(attemptId);
      if (!attempt || attempt.isCompleted) { return; }

      const mockDb = mongoose.connection.useDb('localMocks');
      const questions = await mockDb.db.collection(attempt.examCollectionName).find({}).toArray();

      let score = 0;
      // NOTE: This logic compares the 0-based index from the client with the 1-based string from the database.
      attempt.answers.forEach(answer => {
        if (answer.status === 'answered') {
          const question = questions.find(q => q.question_number === answer.question_number);
          // Convert user's 0-based index to a 1-based string for comparison
          const userAnswerAsString = String(answer.selected_option_index + 1);
          if (question && userAnswerAsString === question.correct_answer) {
            score += 2; // Correct answer
          } else {
            score -= 0.66; // Incorrect answer penalty
          }
        }
      });

      attempt.finalScore = score.toFixed(2);
      attempt.isCompleted = true;
      attempt.submittedAt = new Date();
      await attempt.save();

      // Notify the client that the exam is finished and they can view results
      socket.emit('exam_finished', { attemptId: attempt._id });

    } catch (error) {
        console.error("Error submitting exam:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Start the Server
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});