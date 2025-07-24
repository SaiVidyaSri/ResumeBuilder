const mongoose = require('mongoose');

const presentationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Presentation title is required'],
    trim: true
  },
  platform: {
    type: String,
    required: [true, 'Platform is required'],
    enum: ['SlideShare', 'Google Slides', 'Prezi', 'Speaker Deck', 'Other']
  },
  otherPlatform: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    required: [true, 'Presentation URL is required'],
    trim: true
  },
  date: {
    type: String
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  versionKey: false
});

presentationSchema.pre('save', function(next) {
  console.log('About to save presentation:', this);
  next();
});

presentationSchema.post('save', function(doc, next) {
  console.log('Successfully saved presentation:', doc);
  next();
});

presentationSchema.post('findOneAndUpdate', function(doc, next) {
  console.log('Successfully updated presentation:', doc);
  next();
});

module.exports = mongoose.model('Presentation', presentationSchema);
