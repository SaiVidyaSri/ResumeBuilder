const mongoose = require('mongoose');

const profileSummarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  summary: {
    type: String,
    required: [true, 'Profile summary is required'],
    minlength: [50, 'Profile summary must be at least 50 characters'],
    maxlength: [2000, 'Profile summary cannot exceed 2000 characters'],
    trim: true
  }
}, {
  timestamps: true,
  versionKey: false
});

profileSummarySchema.pre('save', function(next) {
  console.log('About to save profile summary:', this);
  next();
});

profileSummarySchema.post('save', function(doc, next) {
  console.log('Successfully saved profile summary:', doc);
  next();
});

profileSummarySchema.post('findOneAndUpdate', function(doc, next) {
  console.log('Successfully updated profile summary:', doc);
  next();
});

module.exports = mongoose.model('ProfileSummary', profileSummarySchema);