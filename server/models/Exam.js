// server/models/Exam.js
const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true }
});

module.exports = mongoose.model('Exam', examSchema);