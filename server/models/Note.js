// server/models/Note.js
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  filePath: { type: String, required: true, unique: true },
  isRead: { type: Boolean, default: false },
  frontmatter: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  _id: false,
  collection: 'editorials'
});

module.exports = mongoose.model('Note', noteSchema);