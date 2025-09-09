// server/server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

// Importing the models
const Auth = require('./models/Auth');
const Note = require('./models/Note');
const Exam = require('./models/Exam');
const TestSeries = require('./models/TestSeries');
const Test = require('./models/Test');
const ExamSessionSchema = require('./models/ExamSession');
const ExamAttemptSchema = require('./models/ExamAttempt');
const PracticeAttemptSchema = require('./models/PracticeAttempt');
const StashVideoSchema = require('./models/StashVideo');

// Ensure the cache directory exists
const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
}

// --- Express App Setup ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// PORT Configuration
const PORT = 5000;
const JWT_SECRET = "d8a7c4e6f1b9c2d4a7e6f3b1d9c8a4e7f5b2c1d8e6f7a9b3c2d5f1a7c8e9b2";

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- MongoDB Connection ---
const mongoURI = 'mongodb://localhost:27017/upscDashboard';
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

// Create separate DB connections for better organization
const mockDb = mongoose.connection.useDb('localMocks', { useCache: true });
const practiceDb = mongoose.connection.useDb('practiceDB', { useCache: true });
const stashDb = mongoose.connection.useDb('stash-alpha', { useCache: true });

// Register models on their respective DBs
const MockExamSession = mockDb.model('ExamSession', ExamSessionSchema);
const MockExamAttempt = mockDb.model('ExamAttempt', ExamAttemptSchema);
const PracticeAttempt = practiceDb.model('PracticeAttempt', PracticeAttemptSchema);


// =================================================================
// --- PUBLIC API ROUTES (No protection needed for these) ---
// =================================================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { key } = req.body;
        if (!key) {
            return res.status(400).json({ message: 'Auth key is required.' });
        }
        const authKey = await Auth.findOne();
        if (!authKey || key !== authKey.key) {
            return res.status(401).json({ message: 'Invalid auth key.' });
        }
        const token = jwt.sign({ user: 'admin' }, JWT_SECRET, { expiresIn: '365d' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login', error });
    }
});

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

app.get('/api/mocks/sessions', async (req, res) => {
    try {
        const sessions = await MockExamSession.find().sort({ createdAt: -1 });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sessions', error });
    }
});

app.get('/api/mocks/sessions/:sessionId/attempts', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const attempts = await MockExamAttempt.find({ examSession: sessionId }).sort({ createdAt: -1 });
        res.json(attempts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attempts for session', error });
    }
});

app.post('/api/mocks/create-session', async (req, res) => {
    try {
        const { collectionName, timeLimit, totalQuestions, maxMarks, negativeMarking } = req.body;
        if (!collectionName) {
            return res.status(400).json({ message: 'Collection name is required.' });
        }
        const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const sessionData = {
            sessionCode,
            examCollectionName: collectionName,
            totalQuestions,
            maxMarks,
            negativeMarking
        };
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

app.get('/api/mocks/session-by-code/:code', async (req, res) => {
    try {
        const session = await MockExamSession.findOne({ sessionCode: req.params.code });
        if (!session) { return res.status(404).json({ message: "Session not found." }); }
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching session', error });
    }
});

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

app.get('/api/exam-attempt/:attemptId', async (req, res) => {
    try {
        const { attemptId } = req.params;
        const attempt = await MockExamAttempt.findById(attemptId).populate('examSession');
        if (!attempt) { return res.status(404).json({ message: "Exam attempt not found." }); }
        res.json(attempt);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exam attempt', error });
    }
});


// =================================================================
// --- Authentication Middleware (The Gatekeeper) ---
// =================================================================
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Not authorized, token failed.' });
            }
            next();
        });
    } else {
        res.status(401).json({ message: 'Not authorized, no token.' });
    }
};

// =================================================================
// --- PROTECTED API ROUTES (Apply the 'protect' middleware) ---
// =================================================================
const examRouter = express.Router();
const testSeriesRouter = express.Router();
const testRouter = express.Router();
const editorialRouter = express.Router();
const practiceRouter = express.Router();
const stashRouter = express.Router();

// Apply the middleware
app.use('/api/exams', protect, examRouter);
app.use('/api/test-series', protect, testSeriesRouter);
app.use('/api/tests', protect, testRouter);
app.use('/api/editorials', protect, editorialRouter);
app.use('/api/practice', protect, practiceRouter);
app.use('/api/stash', protect, stashRouter);


// --- Protected API Route Handlers ---

// == Exams API ==
examRouter.get('/', async (req, res) => {
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
testSeriesRouter.get('/', async (req, res) => {
    try {
        const series = await TestSeries.find().sort({ name: 'asc' });
        res.json(series);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching test series', error });
    }
});

testSeriesRouter.post('/', async (req, res) => {
    try {
        const newSeries = new TestSeries({ name: req.body.name });
        await newSeries.save();
        res.status(201).json(newSeries);
    } catch (error) {
        res.status(400).json({ message: 'Error creating test series', error });
    }
});

// == Tests API ==
testRouter.get('/:seriesId', async (req, res) => {
    try {
        const tests = await Test.find({ series: req.params.seriesId }).sort({ testNumber: 'asc' });
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tests', error });
    }
});

testRouter.post('/', async (req, res) => {
    try {
        const { series, testNumber, dateTaken, questionsCorrect, questionsIncorrect, marksScored, subject } = req.body;
        const correct = parseInt(questionsCorrect);
        const incorrect = parseInt(questionsIncorrect);
        const totalQuestions = 100;
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

// == Editorials API ==
editorialRouter.get('/dates', async (req, res) => {
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

editorialRouter.get('/by-date', async (req, res) => {
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

editorialRouter.get('/stats', async (req, res) => {
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

editorialRouter.get('/next-to-read', async (req, res) => {
    try {
        const nextNote = await Note.findOne({ isRead: false }).sort({ "frontmatter.date": 1 });
        res.json(nextNote);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching next note to read', error });
    }
});

editorialRouter.get('/search', async (req, res) => {
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

editorialRouter.patch('/:id/status', async (req, res) => {
    try {
        const { isRead } = req.body;
        const updatedNote = await Note.findByIdAndUpdate(req.params.id, { isRead: isRead }, { new: true });
        res.json(updatedNote);
    } catch (error) {
        res.status(400).json({ message: 'Error updating note status', error });
    }
});

editorialRouter.get('/:id', async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) { return res.status(404).json({ message: "Note not found" }); }
        res.json(note);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching note', error });
    }
});


// --- Practice API Routes ---
practiceRouter.get('/tests', async (req, res) => {
    try {
        const collections = await practiceDb.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        res.json(collectionNames);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching practice tests', error });
    }
});

practiceRouter.get('/questions/:collectionName', async (req, res) => {
    try {
        const { collectionName } = req.params;
        const questions = await practiceDb.db.collection(collectionName).find({}).sort({ question_number: 1 }).toArray();
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching practice questions', error });
    }
});

practiceRouter.post('/create-attempt', async (req, res) => {
    try {
        const { username, collectionName } = req.body;
        const questions = await practiceDb.db.collection(collectionName).find({}, { projection: { question_number: 1 } }).sort({ question_number: 1 }).toArray();

        const initialAnswers = questions.map(q => ({
            question_number: q.question_number,
            status: 'unanswered',
        }));
        
        const newAttempt = new PracticeAttempt({
            username,
            practiceTestCollection: collectionName,
            answers: initialAnswers,
        });

        await newAttempt.save();
        res.status(201).json(newAttempt);
    } catch (error) {
        res.status(500).json({ message: 'Error creating practice attempt', error });
    }
});

practiceRouter.get('/attempt/:id', async (req, res) => {
    try {
        const attempt = await PracticeAttempt.findById(req.params.id);
        if (!attempt) {
            return res.status(404).json({ message: 'Practice attempt not found' });
        }
        res.json(attempt);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching practice attempt', error });
    }
});

practiceRouter.patch('/attempt/:id/finish', async (req, res) => {
    try {
        const attempt = await PracticeAttempt.findByIdAndUpdate(
            req.params.id,
            { isCompleted: true },
            { new: true }
        );
        if (!attempt) {
            return res.status(404).json({ message: 'Practice attempt not found' });
        }
        res.json(attempt);
    } catch (error) {
        res.status(500).json({ message: 'Error finishing practice attempt', error });
    }
});

// --- STASH API ROUTES ---
stashRouter.get('/collections', async (req, res) => {
    try {
        const collections = await stashDb.db.listCollections().toArray();
        const collectionsWithCounts = await Promise.all(
            collections.map(async (col) => {
                const count = await stashDb.db.collection(col.name).countDocuments();
                return { name: col.name, count };
            })
        );
        res.json(collectionsWithCounts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stash collections', error });
    }
});

stashRouter.get('/collections/:collectionName', async (req, res) => {
    try {
        const { collectionName } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = 15;
        const skip = (page - 1) * limit;

        const StashModel = stashDb.model(collectionName, StashVideoSchema, collectionName);
        const allVideos = await StashModel.find({}).lean();

        // New, more robust date parsing function
        const parseDateFromDoc = (doc) => {
            // Priority 1: Use the dedicated scene_date field (DD-MM-YYYY)
            if (doc.scene_date) {
                try {
                    const [day, month, year] = doc.scene_date.split('-');
                    const fullYear = year.length === 4 ? year : `20${year}`;
                    const date = new Date(`${fullYear}-${month}-${day}`);
                    if (!isNaN(date.getTime())) return date;
                } catch (e) { /* Fall through */ }
            }

            // Priority 2: Fallback to parsing the file_title (YY.MM.DD)
            if (doc.file_title) {
                const match = doc.file_title.match(/(\d{2})\.(\d{2})\.(\d{2})/);
                if (match) {
                    const [_, year, month, day] = match;
                    const date = new Date(`20${year}`, month - 1, day);
                    if (!isNaN(date.getTime())) return date;
                }
            }
            
            // Priority 3: Use the MongoDB timestamp
            return doc.createdAt ? new Date(doc.createdAt) : null;
        };

        allVideos.sort((a, b) => {
            const dateA = parseDateFromDoc(a);
            const dateB = parseDateFromDoc(b);

            if (dateA && dateB) return dateA - dateB; // Sort oldest to latest
            if (dateA) return -1; // Videos with dates come before those without
            if (dateB) return 1;
            return 0; // Keep original order if neither has a date
        });
        
        const totalVideos = allVideos.length;
        const totalPages = Math.ceil(totalVideos / limit);
        const videos = allVideos.slice(skip, skip + limit);

        res.json({ videos, currentPage: page, totalPages });
    } catch (error) {
        console.error("Error in /collections/:collectionName :", error);
        res.status(500).json({ message: 'Error fetching videos from collection', error });
    }
});

stashRouter.get('/search', async (req, res) => {
    try {
        const { q, page = 1 } = req.query;
        if (!q) {
            return res.json({ videos: [], currentPage: 1, totalPages: 1 });
        }

        const limit = 15;
        const skip = (page - 1) * limit;

        const collections = await stashDb.db.listCollections().toArray();
        let allResults = [];

        // --- NEW: Split search query into individual terms ---
        const searchTerms = q.split(' ').filter(term => term.length > 0);

        for (const col of collections) {
            const StashModel = stashDb.model(col.name, StashVideoSchema, col.name);

            // --- NEW: Create a complex query to match all terms in either title or performers ---
            const andConditions = searchTerms.map(term => {
                const termRegex = new RegExp(term, 'i'); // Case-insensitive regex for each term
                return {
                    $or: [
                        { scene_title: termRegex },
                        { scene_performers: termRegex }
                    ]
                };
            });
            
            const query = andConditions.length > 0 ? { $and: andConditions } : {};

            const resultsInCollection = await StashModel.find(query).lean();
            allResults.push(...resultsInCollection);
        }

        // --- NEW: Sort and paginate the aggregated results ---
        allResults.sort((a, b) => a.scene_title.localeCompare(b.scene_title));
        
        const totalVideos = allResults.length;
        const totalPages = Math.ceil(totalVideos / limit);
        const paginatedVideos = allResults.slice(skip, skip + limit);

        res.json({ 
            videos: paginatedVideos, 
            currentPage: parseInt(page, 10), 
            totalPages 
        });

    } catch (error) {
        console.error("Error during stash search:", error);
        res.status(500).json({ message: 'Error during stash search', error });
    }
});

// GET /api/stash/dashboard/stats
stashRouter.get('/dashboard/stats', async (req, res) => {
    try {
        const collections = await stashDb.db.listCollections().toArray();
        let totalVideos = 0;
        for (const col of collections) {
            totalVideos += await stashDb.db.collection(col.name).countDocuments();
        }
        res.json({
            totalCollections: collections.length,
            totalVideos: totalVideos
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stash stats', error });
    }
});

// GET /api/stash/dashboard/recent
stashRouter.get('/dashboard/recent', async (req, res) => {
    try {
        const collections = await stashDb.db.listCollections().toArray();
        let recentVideos = [];

        for (const col of collections) {
            const StashModel = stashDb.model(col.name, StashVideoSchema, col.name);
            const videos = await StashModel.find({})
                .sort({ createdAt: -1 }) // Sort by newest
                .limit(9) // Get the top 5 from each collection
                .lean();
            recentVideos.push(...videos);
        }
        
        // Sort the aggregated results to find the absolute newest
        recentVideos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(recentVideos.slice(0, 9)); // Return the top 5 overall
    } catch (error) {
        res.status(500).json({ message: 'Error fetching recent videos', error });
    }
});

// --- NEW: GET /api/stash/dashboard/cache-stats ---
stashRouter.get('/dashboard/cache-stats', async (req, res) => {
    try {
        const files = await fs.promises.readdir(cacheDir);
        let totalSize = 0;
        const types = {};

        for (const file of files) {
            const filePath = path.join(cacheDir, file);
            const stats = await fs.promises.stat(filePath);
            totalSize += stats.size;
            const ext = path.extname(file).toLowerCase();
            types[ext] = (types[ext] || 0) + stats.size;
        }

        res.json({
            totalSize,
            breakdown: types
        });
    } catch (error) {
        // If the cache directory doesn't exist, send back zeros.
        if (error.code === 'ENOENT') {
            return res.json({ totalSize: 0, breakdown: {} });
        }
        res.status(500).json({ message: 'Error fetching cache stats', error });
    }
});

// --- NEW: DELETE /api/stash/clear-cache ---
stashRouter.delete('/clear-cache', async (req, res) => {
    try {
        const files = await fs.promises.readdir(cacheDir);
        for (const file of files) {
            await fs.promises.unlink(path.join(cacheDir, file));
        }
        console.log('[Cache] All files in cache directory deleted.');
        res.status(200).json({ message: 'Cache cleared successfully.' });
    } catch (error) {
        console.error('[Cache] Error clearing cache:', error);
        res.status(500).json({ message: 'Failed to clear cache', error });
    }
});

// GET /api/stash/image - Caching proxy for images
stashRouter.get('/image', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send({ message: 'URL query parameter is required.' });
    }

    try {
        const hash = crypto.createHash('md5').update(url).digest('hex');
        // --- NEW: Get the original file extension ---
        const extension = path.extname(new URL(url).pathname);
        // --- NEW: Use the original extension for the cache file ---
        const fileName = `${hash}${extension || '.jpg'}`; // Default to .jpg if no extension
        const cachePath = path.join(__dirname, 'cache', fileName);

        if (fs.existsSync(cachePath)) {
            // No verification needed for existing cache items in this version
            // For a more robust solution, we could add it here too.
            console.log(`[Image Cache] HIT: Serving from cache: ${cachePath}`);
            return res.sendFile(cachePath);
        }

        console.log(`[Image Cache] MISS: Downloading from URL: ${url}`);
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'arraybuffer'
        });

        const buffer = Buffer.from(response.data);

        // --- NEW: Conditional Verification Step ---
        // Only perform the strict check if the source file is a .webp
        if (extension.toLowerCase() === '.webp') {
            if (buffer.length < 12 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
                console.error(`[Image Cache] FAILED VERIFICATION: Downloaded file is not a valid WEBP image. URL: ${url}`);
                return res.status(502).json({ message: 'Invalid or corrupt WEBP file from source.' });
            }
            console.log(`[Image Cache] SUCCESS: WEBP file verified.`);
        }

        // If valid (or not a WEBP), write to cache and send to the client
        await fs.promises.writeFile(cachePath, buffer);
        console.log(`[Image Cache] Cached and now sending file: ${cachePath}`);
        res.sendFile(cachePath);

    } catch (error) {
        console.error(`[Image Cache] FAILED to download or process image: ${error.message}`);
        res.status(500).send({ message: 'Error fetching image from source.' });
    }
});


// --- REAL-TIME LOGIC with Socket.io ---
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  const activeExamTimers = {};
  
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

  socket.on('admin_join_session', async ({ sessionId, username }) => {
    await MockExamSession.findByIdAndUpdate(sessionId, {
        $push: { participants: { username, isReady: true } }
    });
    socket.username = username;
    broadcastLobbyUpdate(sessionId);
  });

  socket.on('admin_leave_session', async ({ sessionId, username }) => {
    await MockExamSession.findByIdAndUpdate(sessionId, {
        $pull: { participants: { username } }
    });
    socket.username = undefined;
    broadcastLobbyUpdate(sessionId);
  });

  socket.on('start_exam', async (sessionId) => {
    try {
        const session = await MockExamSession.findById(sessionId);
        if (!session || activeExamTimers[sessionId]) { return; }

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
        const timeLimit = session.timeLimit;

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
        io.to(sessionId).emit('exam_started_for_all', { attemptMap });

        const sessionTimer = setTimeout(async () => {
            console.log(`Session ${sessionId} time limit reached. Auto-submitting all attempts.`);
            const attemptsToSubmit = await MockExamAttempt.find({ examSession: sessionId, isCompleted: false });
            
            const socketsInRoom = await io.in(sessionId).fetchSockets();
            for (const attempt of attemptsToSubmit) {
                const userSocket = socketsInRoom.find(s => s.username === attempt.username);
                await submitExamAttempt(attempt._id, userSocket);
            }

            if (activeExamTimers[sessionId]) {
                clearInterval(activeExamTimers[sessionId].tickTimer);
                delete activeExamTimers[sessionId];
            }
            
            session.status = 'finished';
            await session.save();
            broadcastLobbyUpdate(sessionId);
        }, timeLimit * 1000);

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

        const updatedAttempt = await MockExamAttempt.findById(attemptId);
        if (updatedAttempt) {
            const roomName = `attempt-room-${attemptId}`;
            io.to(roomName).emit('attempt_update', updatedAttempt);
        }

    } catch (error) {
        console.error("Error updating answer:", error);
    }
  });

  const submitExamAttempt = async (attemptId, socket) => {
    try {
      const attempt = await MockExamAttempt.findById(attemptId);
      if (!attempt || attempt.isCompleted) { return; }

      const session = await MockExamSession.findById(attempt.examSession);
      if (!session) {
          console.error(`Could not find session ${attempt.examSession} for attempt ${attemptId}`);
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
            score -= negativeMarking;
          }
        }
      });

      attempt.finalScore = score.toFixed(2);
      attempt.isCompleted = true;
      attempt.submittedAt = new Date();
      await attempt.save();

      if (socket) {
        socket.emit('exam_finished', { attemptId: attempt._id });
      } else {
        console.log(`Attempt ${attempt._id} submitted by server.`);
      }

    } catch (error) {
        console.error("Error submitting exam:", error);
    }
  };

  socket.on('submit_exam', async ({ attemptId }) => {
      await submitExamAttempt(attemptId, socket);
  });

  socket.on('practice_update_answer', async ({ attemptId, question_number, status, selected_option_index, timeTaken }) => {
    try {
        await PracticeAttempt.updateOne(
            { _id: attemptId, "answers.question_number": question_number },
            { 
                $set: { 
                    "answers.$.status": status,
                    "answers.$.selected_option_index": selected_option_index,
                },
                $inc: {
                    "answers.$.timeTaken": timeTaken
                }
            }
        );
    } catch(error) {
        console.error("Error updating practice answer:", error);
    }
  });

  socket.on('practice_mark_for_review', async ({ attemptId, question_number, status }) => {
    try {
        await PracticeAttempt.updateOne(
            { _id: attemptId, "answers.question_number": question_number },
            { $set: { "answers.$.status": status } }
        );
    } catch (error) {
        console.error("Error marking for review:", error);
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