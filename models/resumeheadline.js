const mongoose = require('mongoose');

const resumeHeadlineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  headline: {
    type: String,
    required: [true, 'Headline is required'],
    minlength: [10, 'Headline must be at least 10 characters'],
    maxlength: [300, 'Headline cannot exceed 300 characters'],
    trim: true
  }
}, {
  timestamps: true,
  versionKey: false
});


resumeHeadlineSchema.pre('save', function(next) {
  console.log('About to save headline:', this);
  next();
});

resumeHeadlineSchema.post('save', function(doc, next) {
  console.log('Successfully saved headline:', doc);
  next();
});

resumeHeadlineSchema.post('findOneAndUpdate', function(doc, next) {
  console.log('Successfully updated headline:', doc);
  next();
});

module.exports = mongoose.model('ResumeHeadline', resumeHeadlineSchema);