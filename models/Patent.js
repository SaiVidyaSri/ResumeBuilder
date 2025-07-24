const mongoose = require('mongoose');

const patentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Patent title is required'],
    trim: true
  },
  office: {
    type: String,
    required: [true, 'Patent office is required'],
    trim: true
  },
  number: {
    type: String,
    required: [true, 'Patent number is required'],
    trim: true
  },
  status: {
    type: String,
    required: [true, 'Patent status is required'],
    enum: ['Filed', 'Published', 'Granted', 'Pending']
  },
  filingDate: {
    type: Date,
    required: [true, 'Filing date is required']
  },
  issueDate: {
    type: Date
  },
  url: {
    type: String,
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

patentSchema.pre('save', function(next) {
  console.log('About to save patent:', this);
  next();
});

patentSchema.post('save', function(doc, next) {
  console.log('Successfully saved patent:', doc);
  next();
});

patentSchema.post('findOneAndUpdate', function(doc, next) {
  console.log('Successfully updated patent:', doc);
  next();
});

module.exports = mongoose.model('Patent', patentSchema);
