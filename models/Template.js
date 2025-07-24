// Define Template Schema
const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  features: { type: [String], required: true },
  category: { type: String, required: true },
  industry: { type: String },
  rating: { type: Number, default: 0 },
  previewImagePath: { type: String },
  htmlContent: { type: String, required: true },
  downloads: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Template', templateSchema);