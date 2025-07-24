const mongoose = require('mongoose');

const onlineProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  type: {
    type: String,
    required: [true, 'Profile type is required'],
    enum: ['LinkedIn', 'Twitter', 'Portfolio', 'Other']
  },
  otherType: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    required: [true, 'Profile URL is required'],
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

onlineProfileSchema.pre('save', function(next) {
  console.log('About to save online profile:', this);
  next();
});

onlineProfileSchema.post('save', function(doc, next) {
  console.log('Successfully saved online profile:', doc);
  next();
});

onlineProfileSchema.post('findOneAndUpdate', function(doc, next) {
  console.log('Successfully updated online profile:', doc);
  next();
});

module.exports = mongoose.model('OnlineProfile', onlineProfileSchema);
