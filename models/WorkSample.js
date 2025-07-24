const mongoose = require('mongoose');

const workSampleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  type: {
    type: String,
    required: [true, 'Sample type is required'],
    enum: ['GitHub', 'Behance', 'Dribbble', 'CodePen', 'Other']
  },
  otherType: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Sample title is required'],
    trim: true
  },
  url: {
    type: String,
    required: [true, 'Sample URL is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  }
}, {
  timestamps: true,
  versionKey: false
});

workSampleSchema.pre('save', function(next) {
  console.log('About to save work sample:', this);
  next();
});

workSampleSchema.post('save', function(doc, next) {
  console.log('Successfully saved work sample:', doc);
  next();
});

workSampleSchema.post('findOneAndUpdate', function(doc, next) {
  console.log('Successfully updated work sample:', doc);
  next();
});

module.exports = mongoose.model('WorkSample', workSampleSchema);
