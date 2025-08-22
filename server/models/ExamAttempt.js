const mongoose = require('mongoose');

// This sub-schema defines the structure for storing the state of a single answer.
const answerSchema = new mongoose.Schema({
  question_number: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['unseen', 'unanswered', 'answered', 'marked_for_review'],
    default: 'unseen'
  },
  // We store the index of the option the user selected.
  selected_option_index: {
    type: Number,
    default: null
  }
}, { _id: false }); // _id is not needed for subdocuments in this case.

const examAttemptSchema = new mongoose.Schema({
  // Link to the overall exam session/lobby.
  examSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamSession',
    required: true
  },
  // The participant's name.
  username: {
    type: String,
    required: true
  },
  // The MongoDB collection name that holds the questions for this test.
  examCollectionName: {
    type: String,
    required: true
  },
  // The exact time the exam was started for the session.
  startTime: {
    type: Date
  },
  // The total time allowed for the exam, in seconds.
  timeLimit: {
    type: Number,
    required: true,
    default: 7200 // Default to 2 hours (7200 seconds)
  },
  // An array to hold the participant's answers and status for all questions.
  answers: [answerSchema],
  // Flag to indicate if the test has been submitted.
  isCompleted: {
    type: Boolean,
    default: false
  },
  // The final score after submission.
  finalScore: {
    type: Number,
    default: 0
  },
  // The time the participant submitted their test.
  submittedAt: {
    type: Date
  }
});

module.exports = examAttemptSchema;
