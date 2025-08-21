// server/models/TestSeries.js
const mongoose = require('mongoose');

const testSeriesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model('TestSeries', testSeriesSchema);