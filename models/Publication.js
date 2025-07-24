const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  type: {
    type: String,
    required: [true, 'Publication type is required'],
    enum: ['White Paper', 'Research Paper', 'Journal Article', 'Conference Paper', 'Book Chapter', 'Other']
  },
  otherType: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Publication/Journal name is required'],
    trim: true
  },
  date: {
    type: String,
    required: [true, 'Publication date is required']
  },
  url: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  versionKey: false
});

publicationSchema.pre('save', function(next) {
  console.log('About to save publication:', this);
  next();
});

publicationSchema.post('save', function(doc, next) {
  console.log('Successfully saved publication:', doc);
  next();
});

publicationSchema.post('findOneAndUpdate', function(doc, next) {
  console.log('Successfully updated publication:', doc);
  next();
});

module.exports = mongoose.model('Publication', publicationSchema);
