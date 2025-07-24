const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  degree: {
    type: String,
    required: [true, 'Degree is required'],
    trim: true
  },
  institute: {
    type: String,
    required: [true, 'Institute is required'],
    trim: true
  },
  startYear: {
    type: String,
    required: [true, 'Start year is required']
  },
  endYear: {
    type: String,
    required: [true, 'End year is required']
  },
  field: {
    type: String,
    required: [true, 'Field of study is required'],
    trim: true
  },
  grade: {
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

educationSchema.pre('save', function(next) {
  console.log('About to save education:', this);
  next();
});

educationSchema.post('save', function(doc, next) {
  console.log('Successfully saved education:', doc);
  next();
});

educationSchema.post('findOneAndUpdate', function(doc, next) {
  console.log('Successfully updated education:', doc);
  next();
});

module.exports = mongoose.model('Education', educationSchema);

