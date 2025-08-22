// server/models/ExamSession.js
const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema({
  sessionCode: {
    type: String,
    required: true,
    unique: true
  },
  examCollectionName: {
    type: String,
    required: true
  },
  timeLimit: {
    type: Number, // in seconds
    default: 432000
  },
  status: {
    type: String,
    enum: ['lobby', 'active', 'finished'],
    default: 'lobby'
  },
  participants: [{
    username: String,
    isReady: { type: Boolean, default: false }
  }]
}, { timestamps: true });

module.exports = mongoose.model('ExamSession', examSessionSchema);