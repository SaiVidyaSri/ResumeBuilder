const mongoose = require('mongoose');

const itSkillsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  skillName: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true
  },
  level: {
    type: String,
    required: [true, 'Proficiency level is required'],
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
  },
  experience: {
    type: String,
    required: [true, 'Experience is required'],
    enum: ['< 1', '1-2', '2-3', '3-5', '5+']
  },
  lastUsed: {
    type: String,
    enum: ['Currently Using', '< 1', '1-2', '2-3', '3+']
  },
  version: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  versionKey: false
});

itSkillsSchema.pre('save', function(next) {
  console.log('About to save IT skills:', this);
  next();
});

itSkillsSchema.post('save', function(doc, next) {
  console.log('Successfully saved IT skills:', doc);
  next();
});

itSkillsSchema.post('findOneAndUpdate', function(doc, next) {
  console.log('Successfully updated IT skills:', doc);
  next();
});

module.exports = mongoose.model('ITskills', itSkillsSchema);
