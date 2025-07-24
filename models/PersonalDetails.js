const mongoose = require('mongoose');

const personalDetailsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Non-binary', 'Prefer not to say']
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Prefer not to say']
  },
  nationality: {
    type: String,
    trim: true
  },
  passportNumber: {
    type: String,
    trim: true
  },
  languages: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    proficiency: {
      type: String,
      enum: ['Native', 'Fluent', 'Intermediate', 'Basic'],
      required: true
    }
  }],
  hobbies: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  versionKey: false
});

personalDetailsSchema.pre('save', function(next) {
  console.log('About to save personal details:', this);
  next();
});

personalDetailsSchema.post('save', function(doc, next) {
  console.log('Successfully saved personal details:', doc);
  next();
});

personalDetailsSchema.post('findOneAndUpdate', function(doc, next) {
  console.log('Successfully updated personal details:', doc);
  next();
});

module.exports = mongoose.model('PersonalDetails', personalDetailsSchema);
