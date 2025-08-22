const mongoose = require('mongoose');

const PomodoroSessionSchema = new mongoose.Schema({
  sessionType: {
    type: String,
    enum: ['work', 'shortBreak', 'longBreak'],
    required: true,
  },
  duration: {
    type: Number, // in minutes
    required: true,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('PomodoroSession', PomodoroSessionSchema);
