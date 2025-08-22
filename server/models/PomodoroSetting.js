const mongoose = require('mongoose');

const PomodoroSettingSchema = new mongoose.Schema({
  workMinutes: {
    type: Number,
    default: 25,
  },
  shortBreakMinutes: {
    type: Number,
    default: 5,
  },
  longBreakMinutes: {
    type: Number,
    default: 15,
  },
  sessionsPerLongBreak: {
    type: Number,
    default: 4,
  },
});

module.exports = mongoose.model('PomodoroSetting', PomodoroSettingSchema);
