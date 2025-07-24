const mongoose = require('mongoose');

const careerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  jobTitle: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  startDate: {
    type: String,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: String
  },
  currentlyWorking: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true
  },
  skills: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
  versionKey: false
});

careerProfileSchema.pre('save', function(next) {
  console.log('About to save career profile:', this);
  next();
});

careerProfileSchema.post('save', function(doc, next) {
  console.log('Successfully saved career profile:', doc);
  next();
});

careerProfileSchema.post('findOneAndUpdate', function(doc, next) {
  console.log('Successfully updated career profile:', doc);
  next();
});

module.exports = mongoose.model('CareerProfile', careerProfileSchema);
