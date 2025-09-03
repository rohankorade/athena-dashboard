// server/models/StashVideo.js
const mongoose = require('mongoose');

const stashVideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fileName: { type: String },
  fileSize: { type: String },
  videoType: { type: String },
  fileLink: { type: String, required: true },
  associatedAccount: { type: String },
  collection: { type: String, required: true },
}, { 
  timestamps: true,
});

module.exports = stashVideoSchema;