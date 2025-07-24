const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Certification name is required'],
    trim: true
  },
  organization: {
    type: String,
    required: [true, 'Issuing organization is required'],
    trim: true
  },
  issueDate: {
    type: String,
    required: [true, 'Issue date is required']
  },
  expiryDate: {
    type: String
  },
  noExpiry: {
    type: Boolean,
    default: false
  },
  credentialId: {
    type: String,
    trim: true
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

certificationSchema.pre('save', function(next) {
  console.log('About to save certification:', this);
  next();
});

certificationSchema.post('save', function(doc, next) {
  console.log('Successfully saved certification:', doc);
  next();
});

certificationSchema.post('findOneAndUpdate', function(doc, next) {
  console.log('Successfully updated certification:', doc);
  next();
});

module.exports = mongoose.model('Certification', certificationSchema);
