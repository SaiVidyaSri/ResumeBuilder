const mongoose = require('mongoose');

const projectsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true
  },
  client: {
    type: String,
    trim: true
  },
  startDate: {
    type: String,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: String
  },
  ongoing: {
    type: Boolean,
    default: false
  },
  url: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
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

projectsSchema.pre('save', function(next) {
  console.log('About to save project:', this);
  next();
});

projectsSchema.post('save', function(doc, next) {
  console.log('Successfully saved project:', doc);
  next();
});

projectsSchema.post('findOneAndUpdate', function(doc, next) {
  console.log('Successfully updated project:', doc);
  next();
});

module.exports = mongoose.model('Projects', projectsSchema);
