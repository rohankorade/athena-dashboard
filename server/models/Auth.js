// server/models/Auth.js
const mongoose = require('mongoose');

const authSchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true 
  },
  // You can add more fields here if needed, like a description
  description: {
    type: String,
    default: 'Default authentication key'
  }
});

module.exports = mongoose.model('Auth', authSchema);