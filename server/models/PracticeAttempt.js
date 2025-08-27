// server/models/PracticeAttempt.js
const mongoose = require('mongoose');

const practiceAnswerSchema = new mongoose.Schema({
  question_number: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['unanswered', 'correct', 'incorrect', 'marked_for_review'],
    default: 'unanswered'
  },
  selected_option_index: {
    type: Number,
    default: null
  },
  timeTaken: {
    type: Number,
    default: 0
  }
}, { _id: false });

const practiceAttemptSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  practiceTestCollection: {
    type: String,
    required: true
  },
  answers: [practiceAnswerSchema],
  isCompleted: {
    type: Boolean,
    default: false
  },
}, { timestamps: true });

module.exports = practiceAttemptSchema;