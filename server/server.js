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
const ExamSessionSchema = require('./models/ExamSession');
const ExamAttemptSchema = require('./models/ExamAttempt');
const PomodoroSetting = require('./models/PomodoroSetting');
const Task = require('./models/Task');
const PomodoroSession = require('./models/PomodoroSession');

const activeExamTimers = {};

// --- Express App Setup ---
const app = express();

// Create an HTTP server and attach Socket.IO to it
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
const mongoURI = 'mongodb://localhost:27017/athenaUtilities';
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected successfully to athenaUtilities.'))
    .catch(err => console.error('MongoDB connection error:', err));

// Get a connection to the localMocks DB and compile models on it
const mockDb = mongoose.connection.useDb('localMocks', { useCache: true });
const MockExamSession = mockDb.model('ExamSession', ExamSessionSchema);
const MockExamAttempt = mockDb.model('ExamAttempt', ExamAttemptSchema);


// --- API Routes ---

// --- Pomodoro Timer API ---

// GET Pomodoro Settings
app.get('/api/pomodoro/settings', async (req, res) => {
    try {
        let settings = await PomodoroSetting.findOne();
        if (!settings) {
            // If no settings exist, create and save the default settings
            settings = new PomodoroSetting();
            await settings.save();
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching Pomodoro settings', error });
    }
});

// PUT (Update) Pomodoro Settings
app.put('/api/pomodoro/settings', async (req, res) => {
    try {
        const updatedSettings = await PomodoroSetting.findOneAndUpdate({}, req.body, {
            new: true, // Return the updated document
            upsert: true, // Create if it doesn't exist
            runValidators: true,
        });
        res.json(updatedSettings);
    } catch (error) {
        res.status(400).json({ message: 'Error updating Pomodoro settings', error });
    }
});

// GET all tasks
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find().sort({ createdAt: 'desc' });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tasks', error });
    }
});

// POST a new task
app.post('/api/tasks', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ message: 'Task text is required.' });
        }
        const newTask = new Task({ text });
        await newTask.save();
        res.status(201).json(newTask);
    } catch (error) {
        res.status(400).json({ message: 'Error creating task', error });
    }
});

// PUT (Update) a task
app.put('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { text, completed } = req.body;
        const updatedTask = await Task.findByIdAndUpdate(id, { text, completed }, { new: true });
        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found.' });
        }
        res.json(updatedTask);
    } catch (error) {
        res.status(400).json({ message: 'Error updating task', error });
    }
});

// DELETE a task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTask = await Task.findByIdAndDelete(id);
        if (!deletedTask) {
            return res.status(404).json({ message: 'Task not found.' });
        }
        res.json({ message: 'Task deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting task', error });
    }
});

// GET all Pomodoro sessions
app.get('/api/pomodoro/sessions', async (req, res) => {
    try {
        const sessions = await PomodoroSession.find().sort({ completedAt: 'desc' });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching Pomodoro sessions', error });
    }
});

// POST a new Pomodoro session
app.post('/api/pomodoro/sessions', async (req, res) => {
    try {
        const { sessionType, duration } = req.body;
        const newSession = new PomodoroSession({ sessionType, duration });
        await newSession.save();
        res.status(201).json(newSession);
    } catch (error) {
        res.status(400).json({ message: 'Error logging Pomodoro session', error });
    }
});


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
            { $match: { "frontmatter.date": { $exists: true, $type: "date" } } },
            { $group: { _id: { year: { $year: "$frontmatter.date" }, month: { $month: "$frontmatter.date" }, day: { $dayOfMonth: "$frontmatter.date" } } } },
            { $group: { _id: { year: "$_id.year", month: "$_id.month" }, days: { $push: "$_id.day" } } },
            { $group: { _id: "$_id.year", months: { $push: { month: "$_id.month", days: "$days" } } } },
            { $sort: { _id: -1 } }
        ]);
        res.json(dateTree);
    } catch (error) {
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

        const notes = await Note.find({ "frontmatter.date": { $gte: startDate, $lt: endDate } });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notes by date', error });
    }
});

// PATCH to update the isRead status of a note
app.patch('/api/editorials/:id/status', async (req, res) => {
    try {
        const { isRead } = req.body;
        const updatedNote = await Note.findByIdAndUpdate(req.params.id, { isRead: isRead }, { new: true });
        res.json(updatedNote);
    } catch (error) {
        res.status(400).json({ message: 'Error updating note status', error });
    }
});

// --- ADD THIS NEW DEBUG ROUTE ---
app.get('/api/editorials/debug-one', async (req, res) => {
    try {
        const oneNote = await Note.findOne();
        if (!oneNote) { return res.status(404).json({ message: "No documents found in the editorials collection." }); }
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
        if (!filePath) { return res.status(400).json({ message: "Please provide a 'path' query parameter." }); }
        const note = await Note.findOne({ filePath: { $regex: filePath, $options: 'i' } });
        if (!note) { return res.status(404).json({ message: "Note not found containing that file path." }); }
        res.json(note);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching debug note', error });
    }
});

// GET all statistics for the editorials page
app.get('/api/editorials/stats', async (req, res) => {
    try {
        const cspExam = await Exam.findById('68a4bfe9adb3d434faf2c939');
        let daysToCSP = 'N/A';
        if (cspExam) {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const examDate = new Date(cspExam.date);
            const diffTime = examDate.getTime() - today.getTime();
            daysToCSP = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        const total = await Note.countDocuments({});
        const read = await Note.countDocuments({ isRead: true });
        const unread = total - read;
        let perDay = 0;
        if (unread > 0 && daysToCSP > 0) {
            perDay = (unread / daysToCSP).toFixed(1);
        }
        res.json({ daysToCSP, total, read, unread, perDay });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error });
    }
});

app.get('/api/editorials/next-to-read', async (req, res) => {
    try {
        const nextNote = await Note.findOne({ isRead: false }).sort({ "frontmatter.date": 1 });
        res.json(nextNote);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching next note to read', error });
    }
});

// GET endpoint for advanced, unified search
app.get('/api/editorials/search', async (req, res) => {
    try {
        const { terms = '', mode = 'OR' } = req.query;
        if (!terms.trim()) { return res.json([]); }
        const searchTerms = terms.split(',');
        const query = {};
        const fieldsToSearch = ['title', 'frontmatter.subject', 'frontmatter.paper', 'frontmatter.theme', 'frontmatter.tags'];
        if (mode === 'AND') {
            query.$and = searchTerms.map(term => {
                const termRegex = new RegExp(term.trim(), 'i');
                return { $or: fieldsToSearch.map(field => ({ [field]: termRegex })) };
            });
        } else {
            const termRegexes = searchTerms.map(term => new RegExp(term.trim(), 'i'));
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
        if (!note) { return res.status(404).json({ message: "Note not found" }); }
        res.json(note);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching note', error });
    }
});

// LOCAL MOCK APIs

// GET all available question paper collections from the 'mockPapers' db
app.get('/api/mocks/collections', async (req, res) => {
    try {
        const questionDb = mongoose.connection.useDb('mockPapers');
        const collections = await questionDb.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        res.json(collectionNames);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching collections', error });
    }
});

// GET total questions for a specific collection
app.get('/api/mocks/collections/:collectionName/details', async (req, res) => {
    try {
        const { collectionName } = req.params;
        const questionDb = mongoose.connection.useDb('mockPapers');
        const totalQuestions = await questionDb.db.collection(collectionName).countDocuments();
        res.json({ totalQuestions });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching collection details', error });
    }
});

// GET all exam sessions
app.get('/api/mocks/sessions', async (req, res) => {
    try {
        const sessions = await MockExamSession.find().sort({ createdAt: -1 });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sessions', error });
    }
});

// GET all attempts for a specific session
app.get('/api/mocks/sessions/:sessionId/attempts', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const attempts = await MockExamAttempt.find({ examSession: sessionId }).sort({ createdAt: -1 });
        res.json(attempts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attempts for session', error });
    }
});

// POST to create a new exam session (lobby)
app.post('/api/mocks/create-session', async (req, res) => {
    try {
        const { collectionName, timeLimit, totalQuestions, maxMarks, negativeMarking } = req.body;
        if (!collectionName) {
            return res.status(400).json({ message: 'Collection name is required.' });
        }

        const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Prepare session data, including the new fields
        const sessionData = {
            sessionCode,
            examCollectionName: collectionName,
            totalQuestions,
            maxMarks,
            negativeMarking
        };

        // If a time limit is provided, convert it from minutes to seconds and add it
        if (timeLimit) {
            sessionData.timeLimit = timeLimit * 60;
        }

        const newSession = new MockExamSession(sessionData);
        await newSession.save();
        res.status(201).json(newSession);
    } catch (error) {
        res.status(500).json({ message: 'Error creating session', error });
    }
});

// GET a session by its short code
app.get('/api/mocks/session-by-code/:code', async (req, res) => {
    try {
        const session = await MockExamSession.findOne({ sessionCode: req.params.code });
        if (!session) { return res.status(404).json({ message: "Session not found." }); }
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching session', error });
    }
});

// GET all questions for a given exam collection
app.get('/api/exam-questions/:collectionName', async (req, res) => {
    try {
        const { collectionName } = req.params;
        const questionDb = mongoose.connection.useDb('mockPapers');
        const questions = await questionDb.db.collection(collectionName).find({}).toArray();
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exam questions', error });
    }
});

// GET a specific exam attempt by its ID
app.get('/api/exam-attempt/:attemptId', async (req, res) => {
    try {
        const { attemptId } = req.params;
        // Populate the examSession to get access to its scoring details
        const attempt = await MockExamAttempt.findById(attemptId).populate('examSession');
        if (!attempt) { return res.status(404).json({ message: "Exam attempt not found." }); }
        res.json(attempt);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exam attempt', error });
    }
});

// --- REAL-TIME LOGIC with Socket.io ---
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  const broadcastLobbyUpdate = async (sessionId) => {
    const updatedSession = await MockExamSession.findById(sessionId);
    if (updatedSession) {
        io.to(sessionId).emit('lobby_update', updatedSession);
    }
  };

  socket.on('join_lobby', (sessionId) => {
    socket.join(sessionId);
    console.log(`User ${socket.id} joined lobby: ${sessionId}`);
    broadcastLobbyUpdate(sessionId);
  });
  
  socket.on('participant_join', async ({ sessionId, username }) => {
    socket.username = username;
    await MockExamSession.findByIdAndUpdate(sessionId, {
        $push: { participants: { username, isReady: false } }
    });
    broadcastLobbyUpdate(sessionId);
  });
  
  socket.on('participant_ready', async ({ sessionId, username, isReady }) => {
    await MockExamSession.updateOne(
        { _id: sessionId, "participants.username": username },
        { $set: { "participants.$.isReady": isReady } }
    );
    broadcastLobbyUpdate(sessionId);
  });

  socket.on('start_exam', async (sessionId) => {
    try {
        const session = await MockExamSession.findById(sessionId);
        if (!session || activeExamTimers[sessionId]) { return; }

        // Mark the session as active
        session.status = 'active';
        await session.save();
        broadcastLobbyUpdate(sessionId);

        const questionDb = mongoose.connection.useDb('mockPapers');
        const questions = await questionDb.db.collection(session.examCollectionName).find({}).toArray();
        const initialAnswers = questions.map(q => ({
            question_number: q.question_number,
            status: 'unseen'
        }));

        const startTime = new Date();
        const timeLimit = session.timeLimit; // Use timeLimit from session

        const createdAttempts = await Promise.all(
            session.participants.map(participant => {
                const newAttempt = new MockExamAttempt({
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

        // Set a timeout to auto-submit all exams when the session time limit is reached
        const sessionTimer = setTimeout(async () => {
            console.log(`Session ${sessionId} time limit reached. Auto-submitting all attempts.`);
            const attemptsToSubmit = await MockExamAttempt.find({ examSession: sessionId, isCompleted: false });
            for (const attempt of attemptsToSubmit) {
                // Find the socket for the user to emit 'exam_finished' event
                const userSocket = socketsInRoom.find(s => s.username === attempt.username);
                await submitExamAttempt(attempt._id, userSocket);
            }
            // Clean up
            if (activeExamTimers[sessionId]) {
                clearInterval(activeExamTimers[sessionId].tickTimer);
                delete activeExamTimers[sessionId];
            }
            // Mark session as finished
            session.status = 'finished';
            await session.save();
            broadcastLobbyUpdate(sessionId);
        }, timeLimit * 1000); // Convert seconds to milliseconds

        // Interval for broadcasting remaining time
        const tickTimer = setInterval(() => {
            const now = new Date();
            const elapsedSeconds = Math.floor((now - startTime) / 1000);
            const remainingTime = Math.max(0, timeLimit - elapsedSeconds);
            io.to(sessionId).emit('timer_tick', { remainingTime });

            if (remainingTime <= 0) {
                clearInterval(tickTimer);
            }
        }, 1000);

        activeExamTimers[sessionId] = { sessionTimer, tickTimer };
        console.log(`Timer started for session: ${sessionId} with a limit of ${timeLimit} seconds.`);

    } catch (error) {
        console.error("Error starting exam:", error);
    }
  });

  socket.on('join_attempt_room', (attemptId) => {
    const roomName = `attempt-room-${attemptId}`;
    socket.join(roomName);
    console.log(`User ${socket.id} joined attempt watch room: ${roomName}`);
  });

  socket.on('update_answer', async ({ attemptId, question_number, selected_option_index, status }) => {
    try {
        await MockExamAttempt.updateOne(
            { _id: attemptId, "answers.question_number": question_number },
            { $set: { "answers.$.selected_option_index": selected_option_index, "answers.$.status": status }}
        );

        // After updating, fetch the entire attempt and broadcast it to the watch room
        const updatedAttempt = await MockExamAttempt.findById(attemptId);
        if (updatedAttempt) {
            const roomName = `attempt-room-${attemptId}`;
            io.to(roomName).emit('attempt_update', updatedAttempt);
        }

    } catch (error) {
        console.error("Error updating answer:", error);
    }
  });

  // Refactored submission logic into a reusable function
  const submitExamAttempt = async (attemptId, socket) => {
    try {
      const attempt = await MockExamAttempt.findById(attemptId);
      if (!attempt || attempt.isCompleted) { return; }

      // Fetch the session to get scoring details
      const session = await MockExamSession.findById(attempt.examSession);
      if (!session) {
          console.error(`Could not find session ${attempt.examSession} for attempt ${attemptId}`);
          // Simple fallback to prevent crash, though this should ideally not happen
          return;
      }

      const { totalQuestions, maxMarks, negativeMarking } = session;
      const marksPerCorrectAnswer = totalQuestions > 0 ? maxMarks / totalQuestions : 0;

      const questionDb = mongoose.connection.useDb('mockPapers');
      const questions = await questionDb.db.collection(attempt.examCollectionName).find({}).toArray();

      let score = 0;
      attempt.answers.forEach(answer => {
        if (answer.status === 'answered') {
          const question = questions.find(q => q.question_number === answer.question_number);
          const userAnswerAsString = String(answer.selected_option_index + 1);

          if (question && userAnswerAsString === question.correct_answer) {
            score += marksPerCorrectAnswer;
          } else {
            // Only apply negative marking if it's a wrong answer, not just unattempted
            score -= negativeMarking;
          }
        }
      });

      attempt.finalScore = score.toFixed(2);
      attempt.isCompleted = true;
      attempt.submittedAt = new Date();
      await attempt.save();

      // If a socket is provided, emit the finished event to that specific user
      if (socket) {
        socket.emit('exam_finished', { attemptId: attempt._id });
      } else {
        // If no socket (e.g. server-side submission), we can broadcast if needed,
        // but for now, we'll just log it. A specific user event is better.
        console.log(`Attempt ${attempt._id} submitted by server.`);
      }

    } catch (error) {
        console.error("Error submitting exam:", error);
    }
  };

  socket.on('submit_exam', async ({ attemptId }) => {
      await submitExamAttempt(attemptId, socket);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Start the Server
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});