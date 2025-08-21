// server/models/Test.js
const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  series: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSeries',
    required: true
  },
  testNumber: { type: String, required: true },
  subject: { type: String, required: true },
  dateTaken: { type: Date, required: true },
  
  totalQuestions: { type: Number, default: 100 },
  maxMarks: { type: Number, default: 200 },
  
  attempted: { type: Number, required: true },
  unattempted: { type: Number, required: true },
  questionsCorrect: { type: Number, required: true },
  questionsIncorrect: { type: Number, required: true },
  
  marksScored: { type: Number, required: true }
});

module.exports = mongoose.model('Test', testSchema);